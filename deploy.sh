#!/usr/bin/env bash
# Builds the frontend + API into one ASP.NET Core app and deploys it to Azure App Service (Free F1, Linux).
# Creates the resource group, plan and web app on first run; later runs just redeploy.
# Requires: az (logged in), node/npm, dotnet 10 SDK, python3 (for zipping).
set -euo pipefail

RESOURCE_GROUP="${RESOURCE_GROUP:-cacheshowdown-rg-plc}"
APP_NAME="${APP_NAME:-cacheshowdown-app-plc}"
PLAN_NAME="${PLAN_NAME:-cacheshowdown-plan-plc}"
LOCATION="${LOCATION:-polandcentral}"

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/publish"

echo "==> Building frontend (prerendered static files)"
(cd "$ROOT/app" && npm ci && npm run build)

echo "==> Publishing API"
rm -rf "$OUT"
dotnet publish "$ROOT/API/API.csproj" -c Release -o "$OUT/app"
cp -r "$ROOT/app/dist/client" "$OUT/app/wwwroot"
(cd "$OUT/app" && python3 -m zipfile -c "$OUT/app.zip" ./*)

echo "==> Ensuring Azure resources exist"
if [ "$(az group exists -n "$RESOURCE_GROUP")" != true ]; then
  az group create -n "$RESOURCE_GROUP" -l "$LOCATION" -o none
fi
if ! az appservice plan show -g "$RESOURCE_GROUP" -n "$PLAN_NAME" -o none 2>/dev/null; then
  az appservice plan create -g "$RESOURCE_GROUP" -n "$PLAN_NAME" -l "$LOCATION" --is-linux --sku F1 -o none
fi
if ! az webapp show -g "$RESOURCE_GROUP" -n "$APP_NAME" -o none 2>/dev/null; then
  az webapp create -g "$RESOURCE_GROUP" -p "$PLAN_NAME" -n "$APP_NAME" --runtime "DOTNETCORE:10.0" -o none
fi
# HTTPS only; no ARRAffinity cookie (it would show up in every response the lessons display).
az webapp update -g "$RESOURCE_GROUP" -n "$APP_NAME" --https-only true --client-affinity-enabled false -o none

echo "==> Deploying"
az webapp deploy -g "$RESOURCE_GROUP" -n "$APP_NAME" --src-path "$OUT/app.zip" --type zip

echo "==> Done: https://$(az webapp show -g "$RESOURCE_GROUP" -n "$APP_NAME" --query defaultHostName -o tsv)"
