# 🚀 Démarrage rapide - SY Wealth

## Prérequis
1. **Node.js** (version 14+) - [Télécharger](https://nodejs.org/)
2. **MySQL** (version 5.7+) - [Télécharger](https://www.mysql.com/downloads/)

## Installation - 3 Étapes Simples

### Étape 1: Initialiser la base de données
1. Ouvrez **MySQL** (via MySQL Command Line ou MySQL Workbench)
2. Copiez et exécutez tout le contenu du fichier `database-schema.sql`
3. Cela créera la base de données `sy_wealth` avec toutes les tables

```sql
-- Exemple de commande
mysql -u root -p < database-schema.sql
```

### Étape 2: Configurer les variables d'environnement
Ouvrez le fichier `.env` et vérifiez que ces paramètres correspondent à votre MySQL:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sy_wealth
DB_PORT=3306
```

### Étape 3: Démarrer le serveur

#### Option A: Utiliser le script batch (Windows)
Double-cliquez sur `start.bat`

#### Option B: Ligne de commande
```bash
npm install
npm start
```

Le serveur démarrera sur: **http://localhost:3000**

---

## 📝 Identifiants de test

**Pour utilisateurs normaux:**
- Numéro: 0677777777 (ou une nouveau compte créé)
- Mot de passe: 123456

**Pour administrateurs:**
- URL: http://localhost:3000/admin-login.html
- Numéro: 0707070707
- Mot de passe: admin123

---

## ✨ Fonctionnalités principales

### Pour les utilisateurs
- ✓ Inscription avec validation du numéro de téléphone
- ✓ Connexion sécurisée
- ✓ Tableau de bord personnalisé
- ✓ Investissements en produits IT
- ✓ Suivi des gains quotidiens
- ✓ Dépôts et retraits

### Pour les administrateurs
- ✓ Gestion des utilisateurs
- ✓ Gestion des produits d'investissement
- ✓ Suivi des dépôts/retraits
- ✓ Statistiques en temps réel
- ✓ Gestion des annonces

---

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifiez que MySQL est en cours d'exécution
- Vérifiez les paramètres DB dans `.env`
- Supprimez le dossier `node_modules` et refaites `npm install`

### "Cannot find module" error
```bash
npm install
npm install bcryptjs jsonwebtoken validator dotenv mysql2 express cors node-cron
```

### Erreur de connexion à la base de données
```bash
# Vérifiez votre MySQL
mysql -u root -p
# Puis exécutez: database-schema.sql
```

### L'inscription ne fonctionne pas
- Vérifiez que le numéro de téléphone est au format: 0707070707
- Vérifiez que le mot de passe fait minimum 6 caractères
- Vérifiez la console du navigateur (F12) pour les messages d'erreur

---

## 📱 Points d'accès

- **Accueil**: http://localhost:3000/
- **Inscription**: http://localhost:3000/signup.html
- **Connexion utilisateur**: http://localhost:3000/login.html
- **Connexion admin**: http://localhost:3000/admin-login.html
- **Investir**: http://localhost:3000/investments.html
- **Tableau de bord**: http://localhost:3000/dashboard.html (après connexion)
- **Admin**: http://localhost:3000/admin.html (après connexion admin)

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez la console du navigateur (F12 → Console)
2. Vérifiez les logs du serveur (terminal/PowerShell)
3. Assurez-vous que MySQL fonctionne
4. Vérifiez que tous les fichiers `.env` sont correctement configurés
