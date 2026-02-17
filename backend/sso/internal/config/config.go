package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Env              string     `mapstructure:"env"`
	ConnectionString string     `mapstructure:"connection_string"`
	Secret           string     `mapstructure:"secret"`
	HTTP             HTTPConfig `mapstructure:"http"`
}

type HTTPConfig struct {
	Port    int           `mapstructure:"port"`
	Timeout time.Duration `mapstructure:"timeout"`
}

func LoadConfig() (*Config, error) {
	return LoadConfigFrom("")
}

func LoadConfigFrom(path string) (*Config, error) {
	if path != "" {
		viper.SetConfigFile(path)
	} else {
		viper.SetConfigFile("../../config/config.yaml")
	}

	var cfg Config
	err := viper.ReadInConfig()
	if err != nil {
		return nil, fmt.Errorf("error reading config file: %w", err)
	}

	err = viper.Unmarshal(&cfg)
	if err != nil {
		return nil, fmt.Errorf("error while unmarshaling config file: %w", err)
	}
	overrideFromEnv(&cfg)
	return &cfg, nil
}

func overrideFromEnv(cfg *Config) {
	if env := os.Getenv("SSO_ENV"); env != "" {
		cfg.Env = env
	}

	if conn := os.Getenv("SSO_CONNECTION_STRING"); conn != "" {
		cfg.ConnectionString = conn
	}

	if secret := os.Getenv("SSO_SECRET"); secret != "" {
		cfg.Secret = secret
	}

	if portStr := os.Getenv("SSO_HTTP_PORT"); portStr != "" {
		if port, err := strconv.Atoi(portStr); err == nil {
			cfg.HTTP.Port = port
		}
	}

	if timeoutStr := os.Getenv("SSO_HTTP_TIMEOUT"); timeoutStr != "" {
		if duration, err := time.ParseDuration(timeoutStr); err == nil {
			cfg.HTTP.Timeout = duration
		}
	}
}
