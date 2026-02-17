package main

// @title SSO API
// @version 1.0
// @description SSO service API.
// @BasePath /
import (
	"flag"
	"log/slog"
	"os"

	"github.com/EtoNeAnanasbI95/sso/internal"
	"github.com/EtoNeAnanasbI95/sso/internal/config"
)

func main() {
	configPath := flag.String("config", "", "path to configuration file")
	flag.Parse()

	cfg, err := config.LoadConfigFrom(*configPath)
	if err != nil {
		slog.Error("Could not load config", "err", err)
		os.Exit(1)
	}
	if err := internal.Run(cfg); err != nil {
		slog.Error("Failed to run server", "err", err)
		os.Exit(1)
	}
}
