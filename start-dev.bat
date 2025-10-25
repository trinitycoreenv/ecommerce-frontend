@echo off
title Local Development Server

:: Set the host IP for the mobile hotspot
set HOST_IP=10.65.19.250
set PORT=3000

:: Update the environment variables
echo Configuring environment variables...
(
echo NEXT_PUBLIC_API_URL=http://%HOST_IP%:%PORT%/api
echo NEXT_PUBLIC_APP_URL=http://%HOST_IP%:%PORT%
echo NEXT_PUBLIC_SOCKET_URL=ws://%HOST_IP%:%PORT%
echo NEXTAUTH_URL=http://%HOST_IP%:%PORT%
echo DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce?schema=public
echo UPLOAD_DIR=./public/uploads
) > .env.local

:: Start ngrok in a new window if needed
IF "%1"=="--ngrok" (
    start "Ngrok Tunnel" cmd /c "ngrok http %PORT% --region us"
)

:: Start the Next.js development server
echo Starting Next.js development server...
pnpm dev -- -H %HOST_IP% -p %PORT%