package auth

import (
	"context"
	"net/http"
	"time"

	authModels "github.com/EtoNeAnanasbI95/sso/internal/dto/auth"
	"github.com/EtoNeAnanasbI95/sso/internal/dto/response"
	"github.com/labstack/echo/v4"
)

type AuthService interface {
	Auth(ctx context.Context, request authModels.AuthRequest, isNew bool) (*authModels.AuthResponse, error)
	Refresh(ctx context.Context, refreshToken string) (*authModels.AuthResponse, error)
	RequestPasswordReset(ctx context.Context, login string) (string, error)
	CompletePasswordReset(ctx context.Context, token, newPassword string) error
}

type Handler struct {
	s AuthService
}

func NewHandler(auth AuthService) *Handler {
	return &Handler{
		s: auth,
	}
}

// LogIn godoc
// @Summary Login user
// @Tags auth
// @Accept json
// @Produce json
// @Param request body authModels.AuthRequest true "Credentials"
// @Success 200 {object} authModels.AuthResponse
// @Router /auth/logIn [post]
func (h *Handler) LogIn(c echo.Context) error {
	return h.auth(c, false)
}

// SignUp godoc
// @Summary Register user
// @Tags auth
// @Accept json
// @Produce json
// @Param request body authModels.AuthRequest true "Credentials"
// @Success 200 {object} authModels.AuthResponse
// @Router /auth/signUp [post]
func (h *Handler) SignUp(c echo.Context) error {
	return h.auth(c, true)
}

// Refresh godoc
// @Summary Refresh access token
// @Tags auth
// @Produce json
// @Success 200 {object} authModels.AuthResponse
// @Router /auth/refresh [post]
func (h *Handler) Refresh(c echo.Context) error {
	ctx := c.Request().Context()

	cookie, err := c.Cookie(refreshCookieName)
	if err != nil || cookie.Value == "" {
		return c.JSON(http.StatusUnauthorized, response.NewBadResponse[any]("Токен не найден", "Необходим refresh cookie"))
	}
	refreshToken := cookie.Value

	result, err := h.s.Refresh(ctx, refreshToken)
	if err != nil {
		clearRefreshTokenCookie(c)
		return c.JSON(http.StatusUnauthorized, response.NewBadResponse[any]("Ошибка обновления токена", err.Error()))
	}

	setRefreshTokenCookie(c, result.RefreshToken)
	return c.JSON(http.StatusOK, response.NewSuccessResponse(result))
}

// RequestPasswordReset godoc
// @Summary Request password reset token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body authModels.PasswordResetRequest true "Login"
// @Success 200 {object} map[string]interface{}
// @Router /auth/password/request [post]
func (h *Handler) RequestPasswordReset(c echo.Context) error {
	ctx := c.Request().Context()

	var req authModels.PasswordResetRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusOK, response.NewBadResponse[any]("Ошибка чтения json", err.Error()))
	}
	if req.Login == "" {
		return c.JSON(http.StatusOK, response.NewBadResponse[any]("Отсутствует аргумент", "Логин обязателен"))
	}

	token, err := h.s.RequestPasswordReset(ctx, req.Login)
	if err != nil {
		return c.JSON(http.StatusOK, response.NewBadResponse[any]("Не удалось выпустить токен", err.Error()))
	}

	payload := map[string]string{
		"token": token,
	}

	return c.JSON(http.StatusOK, response.NewSuccessResponse(&payload))
}

// CompletePasswordReset godoc
// @Summary Complete password reset
// @Tags auth
// @Accept json
// @Produce json
// @Param request body authModels.PasswordResetComplete true "Token + new password"
// @Success 200 {object} map[string]interface{}
// @Router /auth/password/complete [post]
func (h *Handler) CompletePasswordReset(c echo.Context) error {
	ctx := c.Request().Context()

	var req authModels.PasswordResetComplete
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusOK, response.NewBadResponse[any]("Ошибка чтения json", err.Error()))
	}
	if req.Token == "" || req.NewPassword == "" {
		return c.JSON(http.StatusOK, response.NewBadResponse[any]("Отсутствует аргумент", "Токен и новый пароль обязательны"))
	}

	if err := h.s.CompletePasswordReset(ctx, req.Token, req.NewPassword); err != nil {
		return c.JSON(http.StatusOK, response.NewBadResponse[any]("Не удалось сбросить пароль", err.Error()))
	}

	payload := struct{}{}
	return c.JSON(http.StatusOK, response.NewSuccessResponse(&payload))
}

// Logout godoc
// @Summary Logout user and clear refresh cookie
// @Tags auth
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /auth/logout [post]
func (h *Handler) Logout(c echo.Context) error {
	clearRefreshTokenCookie(c)
	payload := struct{}{}
	return c.JSON(http.StatusOK, response.NewSuccessResponse(&payload))
}

func (h *Handler) auth(c echo.Context, isNew bool) error {
	ctx := c.Request().Context()

	var req authModels.AuthRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusOK, response.NewBadResponse[any]("Ошибка чтения json", err.Error()))
	}

	if req.Login == "" {
		return c.JSON(http.StatusOK, response.NewBadResponse[any]("Отсутствует аргумент", "Логин обязателен"))
	}
	if isNew && req.TelegramUsername == "" {
		return c.JSON(http.StatusOK, response.NewBadResponse[any]("Отсутствует аргумент", "Тег Telegram обязателен"))
	}
	if req.Password == "" {
		return c.JSON(http.StatusOK, response.NewBadResponse[any]("Отсутствует аргумент", "Пароль обязателен"))
	}

	result, err := h.s.Auth(ctx, req, isNew)
	if err != nil {
		return c.JSON(http.StatusOK, response.NewBadResponse[any]("Ошибка авторизации", err.Error()))
	}

	setRefreshTokenCookie(c, result.RefreshToken)
	return c.JSON(http.StatusOK, response.NewSuccessResponse(result))
}

const refreshCookieName = "refresh_token"

func setRefreshTokenCookie(c echo.Context, token string) {
	cookie := &http.Cookie{
		Name:     refreshCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int((time.Hour * 24 * 30).Seconds()),
	}
	c.SetCookie(cookie)
}

func clearRefreshTokenCookie(c echo.Context) {
	cookie := &http.Cookie{
		Name:     refreshCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	}
	c.SetCookie(cookie)
}
