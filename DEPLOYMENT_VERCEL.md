# 🚀 Déploiement SY Wealth sur Vercel (Gratuit)

## Prérequis

1. **Compte GitHub** : Créez un compte sur [github.com](https://github.com)
2. **Compte Vercel** : Inscrivez-vous sur [vercel.com](https://vercel.com) avec votre compte GitHub

## Étapes de déploiement

### 1. Préparer le projet

Assurez-vous que tous les fichiers sont prêts :
- ✅ `vercel.json` (configuration Vercel)
- ✅ `.env.example` (variables d'environnement)
- ✅ Tous les fichiers du projet

### 2. Créer un dépôt GitHub

```bash
# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - SY Wealth Platform"

# Créer un dépôt sur GitHub et copier l'URL
# Puis ajouter le remote
git remote add origin https://github.com/VOTRE_USERNAME/NOM_DU_REPO.git

# Pousser le code
git push -u origin main
```

### 3. Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "Import Project"
3. Connectez votre compte GitHub
4. Sélectionnez votre dépôt SY Wealth
5. Configurez le déploiement :
   - **Framework Preset** : Other
   - **Root Directory** : ./ (racine)
   - **Build Command** : laisser vide
   - **Output Directory** : laisser vide

### 4. Configurer les variables d'environnement

Dans le dashboard Vercel, allez dans "Settings" > "Environment Variables" et ajoutez :

```
JWT_SECRET=votre-cle-secrete-unique-ici
NODE_ENV=production
DB_PATH=./database.sqlite
```

### 5. Déployer

Cliquez sur "Deploy" et attendez que le déploiement se termine.

## 🌐 Accéder à votre site

Une fois déployé, Vercel vous donnera une URL comme :
`https://sy-wealth.vercel.app`

## 📧 Configuration Email (Optionnel)

Pour activer les notifications par email :

1. Créez un mot de passe d'application Gmail : https://myaccount.google.com/apppasswords
2. Ajoutez ces variables dans Vercel :
   ```
   EMAIL_USER=votre-email@gmail.com
   EMAIL_PASS=votre-mot-de-passe-app
   ```

## 🔧 Dépannage

### Erreur de base de données
- Vercel utilise un système de fichiers temporaire
- La base de données SQLite sera recréée à chaque déploiement
- Pour la persistance, considérez une base de données externe gratuite

### Erreur de port
- Vercel gère automatiquement le port
- Supprimez `PORT=3000` des variables d'environnement

## 📞 Support

Si vous avez des problèmes :
1. Vérifiez les logs de déploiement dans Vercel
2. Assurez-vous que toutes les dépendances sont dans `package.json`
3. Vérifiez que `server.js` exporte correctement l'app Express

---

**🎉 Félicitations ! Votre plateforme SY Wealth est maintenant en ligne !**