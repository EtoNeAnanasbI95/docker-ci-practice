# syntax=docker/dockerfile:1.7

ARG GO_VERSION=1.23
FROM golang:${GO_VERSION} AS build
WORKDIR /src

# Enable modules cache
COPY backend/sso/go.mod backend/sso/go.sum ./
RUN go mod download

COPY backend/sso/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/sso ./cmd/sso

FROM alpine:3.20 AS runtime
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

# Recreate minimal folder structure so the relative config path still works
COPY --from=build /app/sso ./cmd/sso/sso
COPY backend/sso/config ./config

USER app
EXPOSE 8081
WORKDIR /app/cmd/sso

ENTRYPOINT ["./sso"]
