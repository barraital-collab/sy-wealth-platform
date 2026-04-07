# 📋 Guide Complet - Mise en ligne SY Wealth

## ⚡ Déploiement Express sur Vercel (100% Gratuit)

### Étape 1: Installer Git

**Windows :**
1. Téléchargez Git : https://git-scm.com/download/win
2. Installez avec les paramètres par défaut
3. Redémarrez votre terminal

**Vérification :**
```bash
git --version
# Devrait afficher : git version 2.x.x
```

### Étape 2: Créer un compte GitHub

1. Allez sur https://github.com
2. Créez un compte gratuit
3. Vérifiez votre email

### Étape 3: Créer un compte Vercel

1. Allez sur https://vercel.com
2. Cliquez "Sign Up" et connectez-vous avec GitHub

### Étape 4: Préparer votre projet

✅ **Fichiers déjà configurés :**
- `vercel.json` - Configuration Vercel
- `.env.example` - Variables d'environnement
- `DEPLOYMENT_VERCEL.md` - Guide détaillé

### Étape 5: Créer le dépôt GitHub

```bash
# Aller dans votre dossier projet
cd C:\Users\JEPORA\Desktop\SY

# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "🚀 Initial commit - SY Wealth Platform"

# Créer un nouveau dépôt sur GitHub :
# 1. Allez sur https://github.com/new
# 2. Nom : sy-wealth-platform
# 3. Description : Plateforme d'investissement SY Wealth
# 4. Public ou Private (recommandé : Public pour gratuit)
# 5. NE COCHEZ PAS "Add README" ni ".gitignore"
# 6. Cliquez "Create repository"

# Copiez l'URL du dépôt et exécutez :
git remote add origin https://github.com/VOTRE_USERNAME/sy-wealth-platform.git

# Pousser le code
git push -u origin main
```

### Étape 6: Déployer sur Vercel

1. **Connectez-vous à Vercel** : https://vercel.com
2. **Cliquez "Import Project"**
3. **Sélectionnez votre dépôt GitHub** : sy-wealth-platform
4. **Configurez le déploiement :**
   - Framework Preset : **Other**
   - Root Directory : **./** (racine)
   - Build Command : **laisser vide**
   - Output Directory : **laisser vide**
5. **Cliquez "Deploy"**

### Étape 7: Configurer les variables d'environnement

Dans le dashboard Vercel :
1. Allez dans **Settings** > **Environment Variables**
2. Ajoutez ces variables :

```
JWT_SECRET=votre-cle-secrete-unique-ici-au-moins-32-caracteres
NODE_ENV=production
DB_PATH=./database.sqlite
```

**Pour générer un JWT_SECRET sécurisé :**
- Allez sur https://generate-secret.vercel.app/32
- Copiez la clé générée

### Étape 8: Accéder à votre site

Une fois déployé, Vercel vous donnera une URL comme :
```
https://sy-wealth-platform.vercel.app
```

## 🔧 Configuration Email (Optionnel)

Pour activer les notifications par email :

1. **Créez un mot de passe d'application Gmail :**
   - Allez sur https://myaccount.google.com/apppasswords
   - Connectez-vous à votre compte Gmail
   - Générez un mot de passe d'application

2. **Ajoutez dans Vercel :**
```
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app-gmail
```

## 🚨 Points Importants

### Base de données SQLite
- **Limitation** : Vercel utilise un système de fichiers temporaire
- **Conséquence** : La base de données sera recréée à chaque déploiement
- **Solution** : Pour la production, utilisez une base de données externe gratuite comme :
  - **PlanetScale** (MySQL gratuit)
  - **Supabase** (PostgreSQL gratuit)
  - **Railway** (PostgreSQL gratuit)

### Sécurité
- **Changez le JWT_SECRET** : Utilisez une clé unique et sécurisée
- **Variables sensibles** : Ne mettez jamais de mots de passe dans le code

## 📞 Support et Dépannage

### Erreurs courantes :

1. **"Cannot find module"**
   - Vérifiez que toutes les dépendances sont dans `package.json`

2. **Erreur de port**
   - Supprimez `PORT=3000` des variables d'environnement

3. **Base de données non trouvée**
   - C'est normal avec Vercel, la DB se recrée automatiquement

### Logs de déploiement :
- Dans Vercel, allez dans **Functions** > **Logs** pour voir les erreurs

## 🎯 Prochaines étapes recommandées

1. **Domaine personnalisé** : Achetez un domaine chez OVH/GoDaddy (~10€/an)
2. **Base de données persistante** : Migrez vers PostgreSQL gratuit
3. **Monitoring** : Ajoutez des logs et monitoring
4. **SSL** : Inclus automatiquement avec Vercel

---

## 📱 Testez votre déploiement

Une fois en ligne, testez :
- ✅ Page d'accueil : `https://votre-app.vercel.app`
- ✅ Connexion : `https://votre-app.vercel.app/login.html`
- ✅ Inscription : `https://votre-app.vercel.app/signup.html`
- ✅ API : `https://votre-app.vercel.app/api/status`

**🎉 Félicitations ! Votre plateforme SY Wealth est maintenant accessible mondialement !**