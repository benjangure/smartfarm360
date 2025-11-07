@echo off
echo ========================================
echo SmartFarm360 - GitHub Push Script
echo ========================================
echo.

echo Step 1: Checking Git installation...
git --version
if errorlevel 1 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/downloads
    pause
    exit /b 1
)
echo Git is installed!
echo.

echo Step 2: Initializing Git repository...
git init
echo.

echo Step 3: Adding all files...
git add .
echo.

echo Step 4: Creating initial commit...
git commit -m "Initial commit: SmartFarm360 - Complete farm management system"
echo.

echo Step 5: Setting up remote repository...
echo.
echo IMPORTANT: Before continuing, make sure you have:
echo 1. Created a repository on GitHub named 'smartfarm360'
echo 2. Your repository URL is: https://github.com/benjangure/smartfarm360.git
echo.
set /p continue="Have you created the repository? (y/n): "
if /i not "%continue%"=="y" (
    echo.
    echo Please create the repository first:
    echo 1. Go to https://github.com
    echo 2. Click '+' icon -^> New repository
    echo 3. Name: smartfarm360
    echo 4. Description: A comprehensive farm management system
    echo 5. Choose Public or Private
    echo 6. DO NOT initialize with README
    echo 7. Click 'Create repository'
    echo.
    echo Then run this script again.
    pause
    exit /b 0
)

echo.
echo Adding remote repository...
git remote add origin https://github.com/benjangure/smartfarm360.git
echo.

echo Step 6: Renaming branch to main...
git branch -M main
echo.

echo Step 7: Pushing to GitHub...
echo You may be prompted for your GitHub credentials.
echo.
git push -u origin main
echo.

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Push failed!
    echo ========================================
    echo.
    echo Possible reasons:
    echo 1. Repository doesn't exist on GitHub
    echo 2. Authentication failed
    echo 3. Remote already exists
    echo.
    echo To fix:
    echo - If remote exists: git remote remove origin
    echo - Then run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Project pushed to GitHub!
echo ========================================
echo.
echo Your repository is now available at:
echo https://github.com/benjangure/smartfarm360
echo.
echo Next steps:
echo 1. Visit your repository on GitHub
echo 2. Add a description and topics
echo 3. Consider adding a LICENSE file
echo 4. Share with others!
echo.
pause
