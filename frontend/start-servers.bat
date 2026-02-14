@echo off
echo Killing existing processes on ports 5001 and 5173-5175...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174') do taskkill /PID %%a /F 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5175') do taskkill /PID %%a /F 2>nul

echo Starting backend server...
start "Backend Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "Frontend Server" cmd /k "npx vite --port 5173"

echo Servers started successfully!
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173
pause
