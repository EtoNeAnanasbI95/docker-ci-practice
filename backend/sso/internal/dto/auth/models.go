package auth

// AuthRequest содержит учетные данные для авторизации
// swagger:model AuthRequest
type AuthRequest struct {
	// Логин пользователя
	Login string `json:"login" example:"user@example.com"`
	// Telegram username (используется при регистрации)
	TelegramUsername string `json:"telegram_username,omitempty" example:"my_telegram"`
	// Telegram chat ID для работы с ботом
	TelegramChatID *int64 `json:"telegram_chat_id,omitempty" example:"123456789"`
	// Пароль пользователя
	Password string `json:"password" example:"P@ssw0rd!"`
	// Полное имя (используется при регистрации)
	FullName string `json:"full_name,omitempty" example:"Иван Иванов"`
}

// AuthResponse возвращает JWT токены после успешной аутентификации
// swagger:model AuthResponse
type AuthResponse struct {
	// Refresh Token для обновления пары токенов
	RefreshToken string `json:"refresh_token"`
	// Access Token для доступа к защищенным ресурсам
	AccessToken string `json:"access_token"`
	// Идентификатор пользователя
	UserID int64 `json:"user_id"`
	// Название роли пользователя
	Role string `json:"role"`
}

// swagger:model PasswordResetRequest
type PasswordResetRequest struct {
	// Логин или Telegram пользователя
	Login string `json:"login" example:"user123"`
}

// swagger:model PasswordResetComplete
type PasswordResetComplete struct {
	// Токен сброса пароля
	Token string `json:"token"`
	// Новый пароль
	NewPassword string `json:"new_password"`
}
