/**
 * Dashboard Routes
 */

const express = require('express');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper function for currency formatting
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount);
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

// GET Dashboard Data
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = getConnection();

        // Get user data
        const user = connection.get(
            'SELECT id, name, phone, balance, referral_code, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user balance
        const balance = user.balance || 0;

        // Get today's earnings and claimed daily gains
        const today = new Date().toISOString().split('T')[0];
        const earnings = connection.get(
            `SELECT SUM(amount) as total FROM transactions
             WHERE user_id = ? AND type IN ('earnings', 'daily_claim')
             AND DATE(created_at) = ?`,
            [userId, today]
        );

        const gainToday = (earnings?.total || 0);

        // Get active investments
        const investments = connection.all(
            `SELECT i.id, i.amount, p.id as project_id, p.name as product_name, p.daily_gain, i.days_remaining
             FROM investments i
             JOIN projects p ON i.project_id = p.id
             WHERE i.user_id = ? AND i.status = 'active'`,
            [userId]
        );

        // Get recent transactions
        const transactions = connection.all(
            `SELECT t.id, t.type, t.amount, t.status, t.created_at
             FROM transactions t
             WHERE t.user_id = ?
             ORDER BY t.created_at DESC
             LIMIT 10`,
            [userId]
        );

        res.json({
            success: true,
            balance,
            gainToday,
            investments: investments.map(inv => ({
                id: inv.id,
                amount: inv.amount,
                productName: inv.product_name,
                dailyGain: inv.daily_gain,
                daysRemaining: inv.days_remaining
            })),
            transactions: transactions.map(trans => ({
                id: trans.id,
                type: trans.type,
                amount: trans.amount,
                status: trans.status,
                createdAt: trans.created_at
            })),
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                referralCode: user.referral_code,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard'
        });
    }
});

// POST Claim Salary
router.post('/claim-salary', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = getConnection();

        // Check if user has already claimed today
        const today = new Date().toISOString().split('T')[0];
        const alreadyClaimed = connection.get(
            `SELECT id FROM transactions 
             WHERE user_id = ? AND type = 'daily_claim' 
             AND DATE(created_at) = ?`,
            [userId, today]
        );

        if (alreadyClaimed) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà réclamé votre salaire aujourd\'hui.'
            });
        }

        // Get active investments and calculate total daily earnings
        const investments = connection.all(
            `SELECT i.amount, p.daily_gain, i.days_remaining
             FROM investments i
             JOIN projects p ON i.project_id = p.id
             WHERE i.user_id = ? AND i.status = 'active' AND i.days_remaining > 0`,
            [userId]
        );

        if (investments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucun investissement actif pour réclamer des gains.'
            });
        }

        // Calculate total daily earnings
        const totalEarnings = investments.reduce((sum, inv) => sum + parseFloat(inv.daily_gain), 0);

        if (totalEarnings <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Aucun gain disponible pour aujourd\'hui.'
            });
        }

        // Use transaction to ensure consistency
        const db = getConnection();
        db.beginTransaction();

        try {
            // Add earnings to user balance
            db.run(
                'UPDATE users SET balance = balance + ? WHERE id = ?',
                [totalEarnings, userId]
            );

            // Record the transaction
            db.run(
                'INSERT INTO transactions (user_id, type, amount, status, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))',
                [userId, 'daily_claim', totalEarnings, 'completed']
            );

            // Decrease days remaining for each investment
            for (const inv of investments) {
                const newDays = inv.days_remaining - 1;
                if (newDays <= 0) {
                    // Investment completed
                    db.run(
                        'UPDATE investments SET days_remaining = 0, status = ?, completed_at = datetime(\'now\') WHERE user_id = ? AND project_id = (SELECT id FROM projects WHERE daily_gain = ?)',
                        ['completed', userId, inv.daily_gain]
                    );
                } else {
                    db.run(
                        'UPDATE investments SET days_remaining = ? WHERE user_id = ? AND project_id = (SELECT id FROM projects WHERE daily_gain = ?)',
                        [newDays, userId, inv.daily_gain]
                    );
                }
            }

            db.commit();

            res.json({
                success: true,
                message: `✅ Salaire réclamé avec succès! +${formatCurrency(totalEarnings)} FCFA ajouté à votre solde.`
            });
        } catch (error) {
            db.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Claim salary error:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la réclamation du salaire'
        });
    }
});

module.exports = router;
