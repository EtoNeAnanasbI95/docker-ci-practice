package application

import (
	"net/http"

	_ "github.com/EtoNeAnanasbI95/sso/docs"
	"github.com/EtoNeAnanasbI95/sso/internal/application/auth"
	"github.com/EtoNeAnanasbI95/sso/internal/config"
	"github.com/EtoNeAnanasbI95/sso/pkg/echomiddleware"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"
)

func SetupHTTPServer(cfg *config.Config, authService auth.AuthService, jwt echomiddleware.Jwt) *echo.Echo {
	e := echo.New()

	e.Pre(middleware.RemoveTrailingSlash())
	e.Use(echomiddleware.JwtValidation(jwt))
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOriginFunc: func(origin string) (bool, error) {
			// allow any origin but echo will echo back the actual host instead of "*"
			return true, nil
		},
		AllowCredentials: true,
		AllowMethods:     []string{echo.GET, echo.HEAD, echo.PUT, echo.PATCH, echo.POST, echo.DELETE},
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	// Swagger UI endpoint
	e.GET("/swagger/*", echoSwagger.WrapHandler)

	e.GET("/health", func(c echo.Context) error {
		return c.String(http.StatusOK, "OK")
	})
	e.GET("/v", func(c echo.Context) error {
		return c.String(http.StatusOK, "JWT IS VALID")
	})

	registerAuthRoutes(e, authService)

	return e
}

func registerAuthRoutes(e *echo.Echo, authService auth.AuthService) {
	authHandler := auth.NewHandler(authService)
	auth := e.Group("/auth")
	auth.POST("/logIn", authHandler.LogIn)
	auth.POST("/signUp", authHandler.SignUp)
	auth.POST("/refresh", authHandler.Refresh)
	auth.POST("/logout", authHandler.Logout)
	auth.POST("/password/request", authHandler.RequestPasswordReset)
	auth.POST("/password/complete", authHandler.CompletePasswordReset)
}
