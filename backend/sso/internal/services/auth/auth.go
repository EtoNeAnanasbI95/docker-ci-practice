package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/EtoNeAnanasbI95/sso/internal/domain"
	"github.com/EtoNeAnanasbI95/sso/internal/dto/auth"
	authErrors "github.com/EtoNeAnanasbI95/sso/internal/errors/auth"
	jwtErrors "github.com/EtoNeAnanasbI95/sso/internal/errors/jwt"
	libjwt "github.com/EtoNeAnanasbI95/sso/internal/lib/jwt"
	"golang.org/x/crypto/bcrypt"
)

type Jwt interface {
	NewTokens(userId int64, role string) (accessToken string, refreshToken string, err error)
	ParseToken(tokenString string, expectedType libjwt.TokenType) (*libjwt.TokenClaims, error)
}

type Repository interface {
	GetUserByLogin(ctx context.Context, login string) (*domain.User, error)
	GetUserWithId(ctx context.Context, uid int64) (*domain.User, error)
	CreateUser(ctx context.Context, user *domain.User) (int64, error)
	RequestPasswordReset(ctx context.Context, userId int64, ttlMinutes int) (string, error)
	GetPasswordResetToken(ctx context.Context, token string) (*domain.PasswordResetToken, error)
	MarkResetTokenConsumed(ctx context.Context, tokenId int64) error
	UpdateUserPassword(ctx context.Context, userId int64, password []byte) error
}

type Auth struct {
	repo Repository
	jwt  Jwt
}

const resetTokenTTLMinutes = 30

func New(repo Repository, jwt Jwt) *Auth {
	return &Auth{
		repo: repo,
		jwt:  jwt,
	}
}

func (a *Auth) Auth(ctx context.Context, request auth.AuthRequest, isNew bool) (*auth.AuthResponse, error) {
	const op string = "Auth.Login"

	user, err := a.repo.GetUserByLogin(ctx, request.Login)
	if err != nil {
		slog.Error("failed to get user", "err", err)
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	// если создание
	if isNew {
		// если пользователь найден - уже существует
		if user != nil {
			return nil, authErrors.ErrUserAlreadyExists
		}

		user = domain.NewUser(
			request.Login,
			request.TelegramUsername,
			request.Password,
			request.FullName,
			request.TelegramChatID,
			nil,
			nil,
		)
		newUserID, err := a.repo.CreateUser(ctx, user)
		if err != nil {
			errText := fmt.Errorf("ошибка в ходе создания пользователя: %w", err)
			slog.Error(errText.Error())
			return nil, errText
		}
		user, err = a.repo.GetUserWithId(ctx, newUserID)
		if err != nil {
			return nil, err
		}
	} else { // если авторизация
		// если пользователь не найден
		if user == nil {
			return nil, authErrors.ErrInvalidUserCredentials
		}
		valid := user.CheckPassword(request.Password)
		// если пароль не верен
		if !valid {
			return nil, authErrors.ErrInvalidUserCredentials
		}
	}

	return a.getAuthResponse(ctx, user)
}

func (a *Auth) Refresh(ctx context.Context, refreshToken string) (*auth.AuthResponse, error) {

	// проверка токена
	claims, err := a.jwt.ParseToken(refreshToken, libjwt.TokenTypeRefresh)
	if err != nil {
		if errors.Is(err, jwtErrors.ErrInvalidToken) {
			return nil, err
		}
		slog.Error("ошибка парсинга токена", "err", err)
		return nil, err
	}

	// проверка пользователя
	user, err := a.repo.GetUserWithId(ctx, claims.UserID)
	if err != nil {
		errorText := fmt.Errorf("ошибка получения пользователя по идентфикатору: %w", err)
		slog.Error(errorText.Error())
		return nil, errorText
	}
	// если его нет или удален - нахуй
	if user == nil || user.IsArchived {
		return nil, authErrors.ErrUserNotFound
	}

	return a.getAuthResponse(ctx, user)
}

func (a *Auth) RequestPasswordReset(ctx context.Context, login string) (string, error) {
	user, err := a.repo.GetUserByLogin(ctx, login)
	if err != nil {
		return "", err
	}
	if user == nil {
		// Не раскрываем, существует ли пользователь
		return "", nil
	}
	token, err := a.repo.RequestPasswordReset(ctx, user.Id, resetTokenTTLMinutes)
	if err != nil {
		return "", err
	}
	return token, nil
}

func (a *Auth) CompletePasswordReset(ctx context.Context, tokenStr, newPassword string) error {
	resetToken, err := a.repo.GetPasswordResetToken(ctx, tokenStr)
	if err != nil {
		return err
	}
	if resetToken == nil {
		return authErrors.ErrInvalidResetToken
	}
	if resetToken.IsRevoked || resetToken.ConsumedAt != nil || resetToken.ExpiresAt.Before(time.Now()) {
		return authErrors.ErrInvalidResetToken
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	if err := a.repo.UpdateUserPassword(ctx, resetToken.UserId, hashed); err != nil {
		return err
	}

	if err := a.repo.MarkResetTokenConsumed(ctx, resetToken.Id); err != nil {
		return err
	}

	return nil
}

func (a *Auth) getAuthResponse(ctx context.Context, user *domain.User) (*auth.AuthResponse, error) {
	if user == nil {
		return nil, fmt.Errorf("user not found for token response")
	}

	roleName := user.RoleName
	if roleName == "" {
		roleName = "customer"
	}

	accessToken, refreshToken, err := a.jwt.NewTokens(user.Id, roleName)
	if err != nil {
		errorText := fmt.Errorf("ошибка генерации токенов доступа: %w", err)
		slog.Error(errorText.Error())
		return nil, errorText
	}

	return &auth.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		UserID:       user.Id,
		Role:         roleName,
	}, nil
}
