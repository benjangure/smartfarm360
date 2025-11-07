@echo off
echo Starting SmartFarm360 Backend...
echo.

REM Try different ways to run Maven
cd smartfarm-backend

echo Trying mvn...
mvn clean compile spring-boot:run 2>nul
if %errorlevel% equ 0 goto :success

echo Trying mvnw...
mvnw.cmd clean compile spring-boot:run 2>nul
if %errorlevel% equ 0 goto :success

echo Trying ./mvnw...
./mvnw clean compile spring-boot:run 2>nul
if %errorlevel% equ 0 goto :success

echo.
echo ERROR: Maven not found or not working properly.
echo.
echo Please install Maven or use your IDE to run the application:
echo 1. Open IntelliJ IDEA
echo 2. Open the smartfarm-backend folder
echo 3. Right-click on SmartfarmBackendApplication.java
echo 4. Select "Run SmartfarmBackendApplication"
echo.
echo Or install Maven from: https://maven.apache.org/download.cgi
echo.
pause
exit /b 1

:success
echo Backend started successfully!
pause