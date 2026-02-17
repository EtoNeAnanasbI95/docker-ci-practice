.PHONY: sso api

sso:
	cd sso && ./run.sh

api:
	dotnet run --project ./api/src/Api/Api.csproj

bot:
	cd ./telegram-bot && pnpm start
