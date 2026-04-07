@echo off
echo ============================================
echo 🚀 SY Wealth - Script de déploiement
echo ============================================
echo.

cd /d "C:\Users\JEPORA\Desktop\SY"

echo Étape 1: Vérification de Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git n'est pas installé !
    echo Téléchargez Git depuis : https://git-scm.com/download/win
    pause
    exit /b 1
)
echo ✅ Git est installé
echo.

echo Étape 2: Initialisation du dépôt Git...
if exist .git (
    echo ⚠️  Dépôt Git déjà initialisé
) else (
    git init
    echo ✅ Dépôt Git initialisé
)
echo.

echo Étape 3: Ajout des fichiers...
git add .
echo ✅ Fichiers ajoutés
echo.

echo Étape 4: Commit des fichiers...
git commit -m "🚀 SY Wealth Platform - Ready for deployment" 2>nul
if errorlevel 1 (
    echo ⚠️  Aucun changement à commiter ou commit déjà fait
) else (
    echo ✅ Commit créé
)
echo.

echo ============================================
echo 📋 PROCHAINES ÉTAPES :
echo ============================================
echo.
echo 1. Créez un dépôt sur GitHub :
echo    https://github.com/new
echo    Nom: sy-wealth-platform
echo.
echo 2. Copiez l'URL du dépôt et exécutez :
echo    git remote add origin https://github.com/VOTRE_USERNAME/sy-wealth-platform.git
echo    git push -u origin main
echo.
echo 3. Déployez sur Vercel :
echo    https://vercel.com
echo.
echo 4. Consultez le guide complet :
echo    GUIDE_DEPLOIEMENT.md
echo.
echo ============================================

pause