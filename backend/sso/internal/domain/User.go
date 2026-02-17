package domain

import (
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidOldPassword error = errors.New("cтарый пароль не совпадает с текущим")
)

type User struct {
	Id               int64          `db:"id"`
	RoleId           int64          `db:"role_id"`
	Login            string         `db:"login"`
	TelegramUsername string         `db:"telegram_username"`
	TelegramChatId   sql.NullInt64  `db:"telegram_chat_id"`
	TelegramVerified bool           `db:"telegram_verified"`
	FullName         string         `db:"full_name"`
	PasswordHash     []byte         `db:"password"`
	CreationTime     time.Time      `db:"creation_datetime"`
	UpdateTime       *time.Time     `db:"update_datetime"`
	LastLoginAt      *time.Time     `db:"last_login_at"`
	IsArchived       bool           `db:"is_archived"`
	IsDeleted        bool           `db:"is_deleted"`
	RoleName         string         `db:"role_name"`
}

func NewUser(login, telegramUsername, password, fullName string, telegramChatId *int64, roleId *int64, isArchived *bool) *User {
	user := &User{
		Login:            login,
		TelegramUsername: telegramUsername,
		FullName:         fullName,
	}
	if user.TelegramUsername == "" {
		user.TelegramUsername = login
	}
	if telegramChatId != nil {
		user.TelegramChatId = sql.NullInt64{Int64: *telegramChatId, Valid: true}
	}
	user.PasswordHash, _ = bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if roleId != nil {
		user.RoleId = *roleId
	} else {
		// 3 = обычный покупатель
		user.RoleId = 3
	}
	user.CreationTime = time.Now()
	if isArchived != nil {
		user.IsArchived = *isArchived
	} else {
		user.IsArchived = false
	}
	user.IsDeleted = false
	user.TelegramVerified = false

	return user
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword(u.PasswordHash, []byte(password))
	return err == nil
}

func (u *User) UpdateLogin(login string) {
	u.Login = login
	u.updateDateTime()
}

func (u *User) UpdatePassword(oldPass, newPass string) error {
	oldCorrect := u.CheckPassword(oldPass)
	if oldCorrect {
		u.PasswordHash, _ = bcrypt.GenerateFromPassword([]byte(newPass), bcrypt.DefaultCost)
		u.updateDateTime()
		return nil
	} else {
		return ErrInvalidOldPassword
	}
}

func (u *User) ChangeArchiveStatus(status bool) {
	u.IsArchived = status
	u.updateDateTime()
}

func (u *User) updateDateTime() {
	t := time.Now()
	u.UpdateTime = &t
}
