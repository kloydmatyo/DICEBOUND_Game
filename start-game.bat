@echo off
echo 🎮 Starting Heroll - Roguelike Board Game RPG
echo.
echo Choose your option:
echo 1. Desktop App (Electron)
echo 2. Web Browser (Development)
echo 3. Build Game
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo Starting desktop app...
    npm run electron
) else if "%choice%"=="2" (
    echo Starting web development server...
    echo Open http://localhost:3000 in your browser
    npm run dev
) else if "%choice%"=="3" (
    echo Building game...
    npm run build
    echo Build complete!
    pause
) else (
    echo Invalid choice. Starting desktop app by default...
    npm run electron
)