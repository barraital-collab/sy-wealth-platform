/**
 * Database Configuration - SQLite Version
 * No need for separate MySQL server!
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

let db = null;

function getDatabase() {
    if (!db) {
        // Create/open database file
        db = new Database(path.join(__dirname, '../sy_wealth.db'));
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        initializeTables();
    }
    return db;
}

function getProductTasksTemplates(projectName) {
    const name = projectName.toLowerCase();
    if (name.includes('desktop') || name.includes('ordinateur') || name.includes('pc')) {
        return [
            { title: 'Vérifier la carte mère', description: 'Inspectez les composants et branchez le PC correctement.' },
            { title: 'Installer la mémoire RAM', description: 'Ajouter la mémoire vive et vérifier qu’elle est reconnue.' },
            { title: 'Tester l’alimentation', description: 'Démarrer l’ordinateur et vérifier la stabilité du courant.' }
        ];
    }
    if (name.includes('gaming')) {
        return [
            { title: 'Choisir les composants gaming', description: 'Sélectionnez la bonne carte graphique et le refroidissement.' },
            { title: 'Configurer le système de refroidissement', description: 'Vérifiez que les ventilateurs et le refroidissement sont bien installés.' },
            { title: 'Installer les drivers graphiques', description: 'Mettez à jour les pilotes pour de meilleures performances.' }
        ];
    }
    if (name.includes('server') || name.includes('cloud')) {
        return [
            { title: 'Configurer la baie serveur', description: 'Montez le serveur et branchez les câbles réseau.' },
            { title: 'Tester la connectivité réseau', description: 'Assurez-vous que le serveur est accessible sur le réseau.' },
            { title: 'Sécuriser l’accès serveur', description: 'Appliquez les bonnes règles de pare-feu et mots de passe.' }
        ];
    }
    if (name.includes('laptop') || name.includes('portable')) {
        return [
            { title: 'Vérifier la batterie', description: 'Testez l’autonomie et le chargement du portable.' },
            { title: 'Optimiser la dissipation thermique', description: 'Contrôlez la ventilation et la température du système.' },
            { title: 'Installer la suite logicielle', description: 'Préparez le portable avec les logiciels essentiels.' }
        ];
    }
    if (name.includes('workstation')) {
        return [
            { title: 'Valider la configuration professionnelle', description: 'Vérifiez les composants pour un usage métier intensif.' },
            { title: 'Configurer les logiciels métiers', description: 'Installez et testez les applications professionnelles.' },
            { title: 'Tester la stabilité du système', description: 'Exécutez des benchmarks pour confirmer la stabilité.' }
        ];
    }
    return [
        { title: 'Configurer le matériel', description: 'Vérifiez que tous les composants sont bien installés.' },
        { title: 'Tester la performance', description: 'Assurez-vous que le matériel fonctionne selon les normes.' },
        { title: 'Soumettre un rapport de maintenance', description: 'Envoyez un compte-rendu sur l’état du matériel.' }
    ];
}

function ensureProjectTasks(connection, projectId, projectName) {
    const existing = connection.get(
        'SELECT COUNT(*) as count FROM tasks WHERE project_id = ?',
        [projectId]
    );

    if (existing.count === 0) {
        const templates = getProductTasksTemplates(projectName);
        const insertStmt = connection.prepare('INSERT INTO tasks (title, description, project_id, active, created_at) VALUES (?, ?, ?, 1, datetime(\'now\'))');
        for (const task of templates) {
            insertStmt.run(task.title, task.description, projectId);
        }
    }
}

function initializeTables() {
    try {
        // Users table
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                balance REAL DEFAULT 0,
                role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked')),
                referral_code TEXT,
                referred_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Projects table
        db.exec(`
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                investment REAL NOT NULL,
                daily_gain REAL NOT NULL,
                duration INTEGER NOT NULL,
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Investments table WITH CASCADE
        db.exec(`
            CREATE TABLE IF NOT EXISTS investments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                project_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                daily_gain REAL NOT NULL,
                days_remaining INTEGER NOT NULL,
                status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        `);

        // Deposits table WITH CASCADE
        db.exec(`
            CREATE TABLE IF NOT EXISTS deposits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                method TEXT NOT NULL,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                approved_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `); 

        // Withdrawals table WITH CASCADE
        db.exec(`
            CREATE TABLE IF NOT EXISTS withdrawals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                amount REAL NOT NULL,
                method TEXT NOT NULL,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                approved_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Ensure optional request metadata columns exist on upgrade
        const depositTableInfo = db.prepare('PRAGMA table_info(deposits)').all();
        if (!depositTableInfo.some(column => column.name === 'sender_phone')) {
            db.exec('ALTER TABLE deposits ADD COLUMN sender_phone TEXT');
        }
        if (!depositTableInfo.some(column => column.name === 'receipt_path')) {
            db.exec('ALTER TABLE deposits ADD COLUMN receipt_path TEXT');
        }

        const withdrawalTableInfo = db.prepare('PRAGMA table_info(withdrawals)').all();
        if (!withdrawalTableInfo.some(column => column.name === 'phone')) {
            db.exec('ALTER TABLE withdrawals ADD COLUMN phone TEXT');
        }


        const usersTableInfo = db.prepare('PRAGMA table_info(users)').all();
        if (!usersTableInfo.some(column => column.name === 'email')) {
            db.exec('ALTER TABLE users ADD COLUMN email TEXT');
        }
        if (!usersTableInfo.some(column => column.name === 'referral_code')) {
            db.exec('ALTER TABLE users ADD COLUMN referral_code TEXT');
        }
        if (!usersTableInfo.some(column => column.name === 'referred_by')) {
            db.exec('ALTER TABLE users ADD COLUMN referred_by INTEGER');
        }

        const investmentsTableInfo = db.prepare('PRAGMA table_info(investments)').all();
        if (!investmentsTableInfo.some(column => column.name === 'daily_gain')) {
            db.exec('ALTER TABLE investments ADD COLUMN daily_gain REAL DEFAULT 0');
        }

        // Ensure referral codes exist for all users
        const usersWithoutReferral = db.prepare("SELECT id FROM users WHERE referral_code IS NULL OR referral_code = ''").all();
        const updateReferralCode = db.prepare('UPDATE users SET referral_code = ? WHERE id = ?');
        for (const row of usersWithoutReferral) {
            updateReferralCode.run(`SY${row.id.toString().padStart(5, '0')}`, row.id);
        }
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users (referral_code)');

        // Transactions table WITH CASCADE
        db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                investment_id INTEGER,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
            )
        `); 

        const transactionsTableInfo = db.prepare('PRAGMA table_info(transactions)').all();
        if (!transactionsTableInfo.some(column => column.name === 'investment_id')) {
            db.exec('ALTER TABLE transactions ADD COLUMN investment_id INTEGER');
        }


        // Announcements table
        db.exec(`
            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tasks table
        db.exec(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                project_id INTEGER DEFAULT NULL,
                active INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        `);

        // User task completion table WITH CASCADE
        db.exec(`
            CREATE TABLE IF NOT EXISTS user_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                task_id INTEGER NOT NULL,
                completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `); 


        // Add project_id column to tasks if it does not exist
        const tasksTableInfo = db.prepare('PRAGMA table_info(tasks)').all();
        if (!tasksTableInfo.some(column => column.name === 'project_id')) {
            db.exec('ALTER TABLE tasks ADD COLUMN project_id INTEGER DEFAULT NULL');
        }

        // Seed default generic tasks if none exist
        const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
        if (taskCount === 0) {
            const defaultTasks = [
                { title: 'Compléter votre profil', description: 'Remplissez toutes les informations de votre profil.' },
                { title: 'Partager votre lien de parrainage', description: 'Invitez un ami avec votre lien de parrainage.' },
                { title: 'Confirmer votre dépôt', description: 'Faites un dépôt valide pour continuer à gagner.' }
            ];
            const taskStmt = db.prepare('INSERT INTO tasks (title, description, project_id, active) VALUES (?, ?, ?, ?)');
            for (const task of defaultTasks) {
                taskStmt.run(task.title, task.description, null, 1);
            }
        }

        // Create admin user if doesn't exist
        const adminExists = db.prepare('SELECT id FROM users WHERE phone = ?').get('0707070707');
        if (!adminExists) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            db.prepare('INSERT INTO users (name, phone, password, role, balance, status) VALUES (?, ?, ?, ?, ?, ?)')
                .run('Admin SY Wealth', '0707070707', hashedPassword, 'admin', 0, 'active');
            console.log('✓ Admin user created: 0707070707 / admin123');
        }

        // Create test projects if don't exist
        const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
        if (projectCount === 0) {
            const testProjects = [
                { name: 'Desktop PC', investment: 150000, daily_gain: 25000, duration: 30 },
                { name: 'Gaming PC', investment: 300000, daily_gain: 55000, duration: 30 },
                { name: 'Server System', investment: 500000, daily_gain: 100000, duration: 30 },
                { name: 'Laptop Pro', investment: 200000, daily_gain: 35000, duration: 30 },
                { name: 'Workstation', investment: 400000, daily_gain: 80000, duration: 30 }
            ];

            const stmt = db.prepare('INSERT INTO projects (name, investment, daily_gain, duration, active) VALUES (?, ?, ?, ?, 1)');
            for (const project of testProjects) {
                stmt.run(project.name, project.investment, project.daily_gain, project.duration);
            }
            console.log('✓ Test projects created');
        }

        // Ensure each project has product-specific tasks seeded
        const projects = db.prepare('SELECT id, name FROM projects').all();
        const taskProjectCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?');
        const taskInsert = db.prepare('INSERT INTO tasks (title, description, project_id, active, created_at) VALUES (?, ?, ?, 1, datetime(\'now\'))');
        for (const project of projects) {
            const count = taskProjectCount.get(project.id).count;
            if (count === 0) {
                const templates = getProductTasksTemplates(project.name);
                for (const task of templates) {
                    taskInsert.run(task.title, task.description, project.id);
                }
            }
        }

        console.log('✓ Database initialized (SQLite)');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Create a wrapper to make SQLite behave like MySQL for compatibility
function getConnection() {
    const database = getDatabase();
    
    return {
        query(sql, params = []) {
            const stmt = database.prepare(sql);
            if (params.length > 0) {
                const result = stmt.all(...params);
                return [result, database];
            }
            const result = stmt.all();
            return [result, database];
        },
        
        get(sql, params = []) {
            const stmt = database.prepare(sql);
            if (params.length > 0) {
                return stmt.get(...params);
            }
            return stmt.get();
        },
        
        all(sql, params = []) {
            const stmt = database.prepare(sql);
            if (params.length > 0) {
                return stmt.all(...params);
            }
            return stmt.all();
        },
        
        run(sql, params = []) {
            const stmt = database.prepare(sql);
            if (params.length > 0) {
                const result = stmt.run(...params);
                return { insertId: result.lastInsertRowid || 0, changes: result.changes };
            }
            const result = stmt.run();
            return { insertId: result.lastInsertRowid || 0, changes: result.changes };
        },

        // Transaction support
        prepare(sql) {
            return database.prepare(sql);
        },

        transaction(fn) {
            return database.transaction(fn)();
        },

        beginTransaction() {
            database.prepare('BEGIN').run();
        },

        commit() {
            database.prepare('COMMIT').run();
        },

        rollback() {
            database.prepare('ROLLBACK').run();
        },

        getDatabase() {
            return database;
        },
        
        promise() {
            return {
                query: (sql, params = []) => {
                    return new Promise((resolve, reject) => {
                        try {
                            const result = database.prepare(sql).all(...params);
                            resolve([result, database]);
                        } catch (error) {
                            reject(error);
                        }
                    });
                },
                run: (sql, params = []) => {
                    return new Promise((resolve, reject) => {
                        try {
                            const result = database.prepare(sql).run(...params);
                            resolve({ insertId: result.lastInsertRowid, affectedRows: result.changes });
                        } catch (error) {
                            reject(error);
                        }
                    });
                }
            };
        }
    };
}

module.exports = { getConnection, getDatabase };
