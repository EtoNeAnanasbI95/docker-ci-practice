package user

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"github.com/EtoNeAnanasbI95/sso/internal/domain"
	"github.com/EtoNeAnanasbI95/sso/pkg/database"
	"github.com/jmoiron/sqlx"
)

type UserRepository struct {
	db *sqlx.DB
}

func New(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

const baseSelectQuery = `
	SELECT u.*, r.name AS role_name
	FROM users u
	JOIN roles r ON r.id = u.role_id
`

func (u *UserRepository) GetUserByLogin(ctx context.Context, login string) (*domain.User, error) {
	const op = "User.GetUserByLogin"
	log := slog.With(
		slog.String("op", op),
	)
	log.Info("attempting to get user")

	var user domain.User
	telegramLookup := strings.TrimPrefix(login, "@")
	query := baseSelectQuery + " WHERE (u.login = $1 OR u.telegram_username = $2) AND u.is_deleted = FALSE AND u.is_archived = FALSE"
	err := u.db.Get(&user, query, login, telegramLookup)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		log.Error("something went wrong", "err", err)
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	return &user, nil
}

func (u *UserRepository) GetUserWithId(ctx context.Context, uid int64) (*domain.User, error) {
	const op = "User.GetUserWithId"
	log := slog.With(
		slog.String("op", op),
	)
	log.Info("attempting to get user with id")

	var user domain.User

	query := baseSelectQuery + " WHERE u.id = $1 AND u.is_deleted = FALSE"
	err := u.db.Get(&user, query, uid)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		log.Error("something went wrong", "err", err)
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	return &user, nil
}

func (u *UserRepository) CreateUser(ctx context.Context, user *domain.User) (int64, error) {
	const query = `
		INSERT INTO users (role_id, login, telegram_username, telegram_chat_id, telegram_verified, full_name, password, creation_datetime, update_datetime, is_archived, is_deleted)
		VALUES (:role_id, :login, :telegram_username, :telegram_chat_id, :telegram_verified, :full_name, :password, :creation_datetime, :update_datetime, :is_archived, :is_deleted)
		RETURNING id
	`

	result, err := database.WithUserTransaction(u.db, ctx, func(tx *sqlx.Tx) (int64, error) {
		rows, err := tx.NamedQuery(query, user)
		if err != nil {
			return 0, err
		}
		defer rows.Close()

		var id int64
		if rows.Next() {
			if err := rows.Scan(&id); err != nil {
				return 0, err
			}
		} else {
			return 0, fmt.Errorf("no id returned")
		}

		return id, nil
	})
	if err != nil {
		return 0, fmt.Errorf("insert user: %w", err)
	}

	return result, nil
}

func (u *UserRepository) RequestPasswordReset(ctx context.Context, userId int64, ttlMinutes int) (string, error) {
	const query = `SELECT request_password_reset($1, $2)`
	var token string
	if err := u.db.GetContext(ctx, &token, query, userId, ttlMinutes); err != nil {
		return "", fmt.Errorf("request password reset: %w", err)
	}
	return token, nil
}

func (u *UserRepository) GetPasswordResetToken(ctx context.Context, token string) (*domain.PasswordResetToken, error) {
	const query = `
		SELECT id, user_id, token, expires_at, consumed_at, is_revoked, created_at
		FROM password_reset_tokens
		WHERE token = $1
	`
	var reset domain.PasswordResetToken
	if err := u.db.GetContext(ctx, &reset, query, token); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get password reset token: %w", err)
	}
	return &reset, nil
}

func (u *UserRepository) MarkResetTokenConsumed(ctx context.Context, tokenId int64) error {
	const query = `
		UPDATE password_reset_tokens
		SET consumed_at = now(), is_revoked = TRUE
		WHERE id = $1
	`
	if _, err := u.db.ExecContext(ctx, query, tokenId); err != nil {
		return fmt.Errorf("mark reset token consumed: %w", err)
	}
	return nil
}

func (u *UserRepository) UpdateUserPassword(ctx context.Context, userId int64, password []byte) error {
	const query = `
		UPDATE users
		SET password = $2, update_datetime = now()
		WHERE id = $1
	`
	if _, err := u.db.ExecContext(ctx, query, userId, password); err != nil {
		return fmt.Errorf("update user password: %w", err)
	}
	return nil
}
