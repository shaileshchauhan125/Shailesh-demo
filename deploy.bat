@echo off
echo 🎲 Deploying Ludo PWA...

REM Check if git is initialized
if not exist ".git" (
    echo Initializing git repository...
    git init
    git branch -M main
)

REM Add all files
echo Adding files to git...
git add .

REM Commit with timestamp
echo Committing changes...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD% %HH%:%Min%:%Sec%"
git commit -m "PWA Update - %timestamp%"

REM Check if remote exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  No GitHub remote found!
    echo Please:
    echo 1. Create a new repository on GitHub
    echo 2. Run: git remote add origin https://github.com/yourusername/yourrepo.git
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)

REM Push to GitHub
echo Pushing to GitHub...
git push origin main

echo.
echo ✅ Code pushed to GitHub!
echo.
echo 🚀 Next steps:
echo 1. Go to netlify.com
echo 2. Click 'New site from Git'
echo 3. Connect your GitHub repository
echo 4. Set publish directory to: public
echo 5. Deploy!
echo.
echo Your PWA will be available at: https://yoursite.netlify.app
echo 🎮 Happy gaming!
pause
