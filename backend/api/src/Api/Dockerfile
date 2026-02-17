FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore only with project files to leverage Docker layer cache
COPY backend/api/src/Api/Api.csproj Api/
COPY backend/api/src/Data/Data.csproj Data/
COPY backend/api/src/Models/Models.csproj Models/
RUN dotnet restore Api/Api.csproj

# Copy the rest of the backend sources and publish
COPY backend/api/src/ ./
RUN dotnet publish Api/Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080
ENTRYPOINT ["dotnet", "Api.dll"]
