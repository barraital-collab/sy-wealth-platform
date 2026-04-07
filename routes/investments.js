/**
 * Investments Routes
 */

const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Utility function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0
    }).format(amount);
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
        for (const task of templates) {
            connection.run(
                'INSERT INTO tasks (title, description, project_id, active, created_at) VALUES (?, ?, ?, 1, datetime(\'now\'))',
                [task.title, task.description, projectId]
            );
        }
    }
}

// GET available products
router.get('/products', async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] 📦 GET /products - IP: ${req.ip}`);
        
        const connection = getConnection();
        
        // Test DB connection
        const testQuery = connection.get('SELECT 1 as test');
        if (!testQuery || testQuery.test !== 1) {
            throw new Error('DB connection failed - cannot execute basic query');
        }
        
        const products = connection.all(
            'SELECT id, name, investment, daily_gain AS dailyGain, duration FROM projects WHERE active = 1 ORDER BY id'
        );

        console.log(`✅ ${products.length} produits trouvés`);
        
        res.json({
            success: true,
            products,
            count: products.length
        });
    } catch (error) {
        console.error(`❌ GET /products ERROR [${new Date().toISOString()}]:`, {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ 
            success: false, 
            message: `Erreur chargement produits: ${error.message}` 
        });
    }
});

// Test endpoint without auth
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Investments API is working',
        timestamp: new Date().toISOString()
    });
});

// POST Create Investment
router.post('/create', authenticateToken, async (req, res) => {
    const startTime = new Date().toISOString();
    console.log(`[${startTime}] 💰 POST /create - User: ${req.user?.id || 'unknown'}, IP: ${req.ip}, Body:`, req.body);
    console.log(`[${startTime}] 🔑 Auth header:`, req.headers.authorization ? 'Present' : 'Missing');
    
    let connection;
    try {
        connection = getConnection();
        
        // Test DB immediately
        const dbTest = connection.get('SELECT 1');
        if (!dbTest) throw new Error('DB connection failed');
        
        const userId = req.user.id;
        const { projectId, amount } = req.body;

        console.log(`[${startTime}] UserID: ${userId}, ProjectID: ${projectId}, Amount: ${amount}`);

        if (!projectId || !amount || isNaN(amount) || parseFloat(amount) <= 0) {
            const errMsg = 'Paramètres invalides: projectId et amount requis et > 0';
            console.warn(`[${startTime}] ❌ ${errMsg}`);
            return res.status(400).json({ success: false, message: errMsg });
        }

        // 1. Get user + balance
        const user = connection.get('SELECT id, balance, referred_by FROM users WHERE id = ?', [userId]);
        if (!user) {
            const errMsg = 'Utilisateur introuvable';
            console.warn(`❌ ${errMsg} - userId: ${userId}`);
            return res.status(404).json({ success: false, message: errMsg });
        }

        const userBalance = parseFloat(user.balance);
        const investAmount = parseFloat(amount);
        
        console.log(`Solde utilisateur: ${userBalance}, Montant invest: ${investAmount}`);

        if (userBalance < investAmount) {
            const errMsg = `Solde insuffisant. Solde: ${formatCurrency(userBalance)}, Requis: ${formatCurrency(investAmount)}. Rechargez votre compte.`;
            console.warn(`❌ ${errMsg}`);
            return res.status(400).json({ success: false, message: errMsg });
        }

        // 2. Get project
        const project = connection.get(
            'SELECT id, name, duration, daily_gain FROM projects WHERE id = ? AND active = 1', 
            [projectId]
        );
        if (!project) {
            const errMsg = 'Projet introuvable ou inactif';
            console.warn(`❌ ${errMsg} - projectId: ${projectId}`);
            return res.status(404).json({ success: false, message: errMsg });
        }

        console.log(`Projet OK: ${project.name} (${project.duration}j, ${project.daily_gain}/j)`);

        // 3. Check if user already has an active investment
        const activeInvestment = connection.get(
            'SELECT id, project_id FROM investments WHERE user_id = ? AND status = ?',
            [userId, 'active']
        );

        if (activeInvestment) {
            const errMsg = 'Vous ne pouvez avoir qu\'un seul investissement actif à la fois';
            console.warn(`❌ ${errMsg} - userId: ${userId}, activeInvestmentId: ${activeInvestment.id}`);
            return res.status(400).json({ success: false, message: errMsg });
        }

        // 3. Transaction DB - atomic operations
        let transactionActive = false;
        connection.run('BEGIN TRANSACTION');
        transactionActive = true;
        
        try {
            // Create investment
            const result = connection.run(
                `INSERT INTO investments (user_id, project_id, amount, daily_gain, days_remaining, status, created_at)
                 VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))`,
                [userId, projectId, investAmount, project.daily_gain, project.duration]
            );

            // Deduct balance
            const balanceUpdate = connection.run(
                'UPDATE users SET balance = balance - ? WHERE id = ?',
                [investAmount, userId]
            );

            // Transaction log
            connection.run(
                'INSERT INTO transactions (user_id, investment_id, type, amount, status, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))',
                [userId, result.insertId || result.lastID, 'investment', investAmount, 'completed']
            );

            // Referral commission
            if (user.referred_by) {
                const commission = parseFloat((investAmount * 0.10).toFixed(2));
                if (commission > 0) {
                    connection.run('UPDATE users SET balance = balance + ? WHERE id = ?', [commission, user.referred_by]);
                    connection.run(
                        'INSERT INTO transactions (user_id, investment_id, type, amount, status, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))',
                        [user.referred_by, result.insertId || result.lastID, 'referral_commission', commission, 'completed']
                    );
                }
            }

            // Tasks
            ensureProjectTasks(connection, projectId, project.name);

            connection.run('COMMIT');
            transactionActive = false;
            
            console.log(`✅ Investment créé #${result.lastID || result.insertId} - ${formatCurrency(investAmount)}`);
            
            res.json({
                success: true,
                message: 'Investissement créé avec succès !',
                investmentId: result.lastID || result.insertId,
                amount: investAmount,
                project: project.name
            });
        } catch (txError) {
            if (transactionActive) {
                try {
                    connection.run('ROLLBACK');
                } catch (rollbackError) {
                    console.error('Erreur rollback:', rollbackError);
                }
            }
            throw txError;
        }
    } catch (error) {
        console.error(`💥 POST /create ERROR [${new Date().toISOString()}] (${Date.now() - startTime})ms:`, {
            message: error.message,
            stack: error.stack,
            code: error.code,
            userId: req.user?.id,
            projectId: req.body?.projectId,
            amount: req.body?.amount
        });
        
        // Only rollback if we have an active transaction
        if (connection && typeof transactionActive !== 'undefined' && transactionActive) {
            try {
                connection.run('ROLLBACK');
            } catch (rollbackError) {
                console.error('Erreur rollback:', rollbackError);
            }
        }
        
        res.status(error.code === 'SQLITE_BUSY' ? 503 : 500).json({
            success: false,
            message: error.message.includes('SQLITE') ? 'Base de données occupée/lockée. Réessayez.' : 'Erreur création investissement'
        });
    }
});

// GET User Investments (list)
router.get('/myinvestments', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = getConnection();

        const investments = connection.all(
            `SELECT i.id, i.amount, i.created_at, i.status, i.days_remaining,
                    p.name, p.daily_gain
             FROM investments i
             JOIN projects p ON i.project_id = p.id
             WHERE i.user_id = ?
             ORDER BY i.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            investments: investments.map(inv => ({
                id: inv.id,
                projectName: inv.name,
                amount: inv.amount,
                dailyGain: inv.daily_gain,
                daysRemaining: inv.days_remaining,
                status: inv.status,
                createdAt: inv.created_at
            }))
        });
    } catch (error) {
        console.error('Error fetching investments:', error);
        res.status(500).json({
            success: false,
            message: 'Impossible de charger les investissements'
        });
    }
});

module.exports = router;

