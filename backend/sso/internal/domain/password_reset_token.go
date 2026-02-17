package domain

import "time"

type PasswordResetToken struct {
	Id         int64      `db:"id"`
	UserId     int64      `db:"user_id"`
	Token      string     `db:"token"`
	ExpiresAt  time.Time  `db:"expires_at"`
	ConsumedAt *time.Time `db:"consumed_at"`
	IsRevoked  bool       `db:"is_revoked"`
	CreatedAt  time.Time  `db:"created_at"`
}
