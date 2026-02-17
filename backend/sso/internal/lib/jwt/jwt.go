package jwt
import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	jwtErrors "github.com/EtoNeAnanasbI95/sso/internal/errors/jwt"
)

type TokenType string

const (
	TokenTypeAccess  TokenType = "access"
	TokenTypeRefresh TokenType = "refresh"
)

type TokenClaims struct {
	UserID int64
	Role   string
	Type   TokenType
}

type JwtLib struct {
	accessDuration  time.Duration
	refreshDuration time.Duration
	secret          []byte
}

func NewJwtLib(accessDuration time.Duration, secret []byte) *JwtLib {
	return &JwtLib{
		accessDuration:  accessDuration,
		refreshDuration: time.Hour * 24 * 30,
		secret:          secret,
	}
}

func (j *JwtLib) NewTokens(userId int64, role string) (accessToken string, refreshToken string, err error) {
	accessToken, err = j.signToken(userId, role, TokenTypeAccess, j.accessDuration)
	if err != nil {
		return "", "", err
	}
	refreshToken, err = j.signToken(userId, role, TokenTypeRefresh, j.refreshDuration)
	if err != nil {
		return "", "", err
	}
	return
}

func (j *JwtLib) signToken(userId int64, role string, tokenType TokenType, duration time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"sub":  userId,
		"role": role,
		"typ":  string(tokenType),
		"exp":  time.Now().Add(duration).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(j.secret)
}

func (j *JwtLib) ParseToken(tokenString string, expectedType TokenType) (*TokenClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return j.secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("token parse error: %s", err.Error())
	}
	if !token.Valid {
		return nil, jwtErrors.ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}

	tokenType, ok := claims["typ"].(string)
	if !ok || tokenType != string(expectedType) {
		return nil, jwtErrors.ErrInvalidToken
	}

	sub, ok := claims["sub"]
	if !ok {
		return nil, errors.New("can't get sub from claims")
	}

	role, _ := claims["role"].(string)

	return &TokenClaims{
		UserID: int64(sub.(float64)),
		Role:   role,
		Type:   TokenType(tokenType),
	}, nil
}
