@echo off
title E-Commerce Development Server
color 0A

echo ========================================
echo    E-COMMERCE DEVELOPMENT SERVER
echo ========================================
echo.
echo 🚀 Starting the development server...
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 API: http://localhost:3000/api
echo.
echo 👑 ADMIN: admin@ecommerce.com / admin123
echo 🏪 VENDOR: vendor1@example.com / vendor123
echo 🛒 CUSTOMER: customer1@example.com / customer123
echo 💰 FINANCE: finance@ecommerce.com / finance123
echo 📦 OPERATIONS: operations@ecommerce.com / ops123
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

:: Start the server and keep the window open
pnpm run dev

:: This will only execute if the server stops
echo.
echo Server stopped. Press any key to close this window...
pause >nul
