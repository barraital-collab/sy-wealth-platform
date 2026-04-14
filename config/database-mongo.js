/**
 * Database Configuration - MongoDB Atlas Version
 * For Vercel deployment (serverless environment)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let isConnected = false;

async function connectToDatabase() {
    if (isConnected) {
        return;
    }

    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = true;
        console.log('✓ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

// Define Schemas
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended', 'blocked'], default: 'active' },
    referral_code: { type: String, unique: true },
    referred_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    investment: { type: Number, required: true },
    daily_gain: { type: Number, required: true },
    duration: { type: Number, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: true });

const investmentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    amount: { type: Number, required: true },
    daily_gain: { type: Number, required: true },
    days_remaining: { type: Number, required: true },
    status: { type: String, enum: ['active', 'completed', 'withdrawn'], default: 'active' },
    completed_at: { type: Date },
}, { timestamps: true });

const depositSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    sender_phone: { type: String },
    receipt_path: { type: String },
    approved_at: { type: Date },
}, { timestamps: true });

const withdrawalSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    phone: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approved_at: { type: Date },
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    investment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
}, { timestamps: true });

const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    active: { type: Boolean, default: true },
}, { timestamps: true });

const userTaskSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    completed_at: { type: Date, default: Date.now },
}, { timestamps: true });

// Create Models
const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const Investment = mongoose.model('Investment', investmentSchema);
const Deposit = mongoose.model('Deposit', depositSchema);
const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Announcement = mongoose.model('Announcement', announcementSchema);
const Task = mongoose.model('Task', taskSchema);
const UserTask = mongoose.model('UserTask', userTaskSchema);

// Helper functions to mimic SQLite API
function getProductTasksTemplates(projectName) {
    const name = projectName.toLowerCase();
    if (name.includes('desktop') || name.includes('ordinateur') || name.includes('pc')) {
        return [
            { title: 'Vérifier la carte mère', description: 'Inspectez les composants et branchez le PC correctement.' },
            { title: 'Installer la mémoire RAM', description: 'Ajouter la mémoire vive et vérifier qu'elle est reconnue.' },
            { title: 'Tester l'alimentation', description: 'Démarrer l'ordinateur et vérifier la stabilité du courant.' }
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
            { title: 'Sécuriser l'accès serveur', description: 'Appliquez les bonnes règles de pare-feu et mots de passe.' }
        ];
    }
    if (name.includes('laptop') || name.includes('portable')) {
        return [
            { title: 'Vérifier la batterie', description: 'Testez l'autonomie et le chargement du portable.' },
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
        { title: 'Soumettre un rapport de maintenance', description: 'Envoyez un compte-rendu sur l'état du matériel.' }
    ];
}

async function ensureProjectTasks(projectId, projectName) {
    const existingTasks = await Task.find({ project_id: projectId });
    if (existingTasks.length === 0) {
        const templates = getProductTasksTemplates(projectName);
        const tasksToInsert = templates.map(task => ({
            ...task,
            project_id: projectId,
            active: true
        }));
        await Task.insertMany(tasksToInsert);
    }
}

async function initializeDatabase() {
    try {
        await connectToDatabase();

        console.log('Initializing MongoDB database...');

        // Create admin user if doesn't exist
        const adminUser = await User.findOne({ phone: '0707070707' });
        if (!adminUser) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Admin SY Wealth',
                phone: '0707070707',
                password: hashedPassword,
                role: 'admin',
                balance: 0,
                status: 'active'
            });
            console.log('✓ Admin user created: 0707070707 / admin123');
        }

        // Create test projects if don't exist
        const projectCount = await Project.countDocuments();
        if (projectCount === 0) {
            const testProjects = [
                { name: 'Desktop PC', investment: 150000, daily_gain: 25000, duration: 30 },
                { name: 'Gaming PC', investment: 300000, daily_gain: 55000, duration: 30 },
                { name: 'Server System', investment: 500000, daily_gain: 100000, duration: 30 },
                { name: 'Laptop Pro', investment: 200000, daily_gain: 35000, duration: 30 },
                { name: 'Workstation', investment: 400000, daily_gain: 80000, duration: 30 }
            ];

            await Project.insertMany(testProjects.map(p => ({ ...p, active: true })));
            console.log('✓ Test projects created');
        }

        // Create default tasks if none exist
        const taskCount = await Task.countDocuments();
        if (taskCount === 0) {
            const defaultTasks = [
                { title: 'Compléter votre profil', description: 'Remplissez toutes les informations de votre profil.' },
                { title: 'Partager votre lien de parrainage', description: 'Invitez un ami avec votre lien de parrainage.' },
                { title: 'Confirmer votre dépôt', description: 'Faites un dépôt valide pour continuer à gagner.' }
            ];
            await Task.insertMany(defaultTasks.map(t => ({ ...t, active: true })));
        }

        // Generate referral codes for users without them
        const usersWithoutReferral = await User.find({
            $or: [
                { referral_code: { $exists: false } },
                { referral_code: '' }
            ]
        });

        for (const user of usersWithoutReferral) {
            user.referral_code = `SY${user._id.toString().slice(-5).padStart(5, '0')}`;
            await user.save();
        }

        console.log('✓ MongoDB database initialization complete\n');
    } catch (error) {
        console.error('MongoDB initialization error:', error);
        throw error;
    }
}

// Export models and functions
module.exports = {
    connectToDatabase,
    initializeDatabase,
    User,
    Project,
    Investment,
    Deposit,
    Withdrawal,
    Transaction,
    Announcement,
    Task,
    UserTask,
    ensureProjectTasks
};