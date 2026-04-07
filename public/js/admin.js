/**
 * SY Wealth - Admin JavaScript
 * Admin panel functionality
 */

// ============================================
// ADMIN INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    setupSidebarNavigation();
    loadAdminData();
    setupAdminFormHandlers();
    checkAdminAccess();
});

function setupSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get section ID from data attribute
            const sectionId = this.getAttribute('data-section');
            
            // Hide all sections
            const sections = document.querySelectorAll('.admin-section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

async function checkAdminAccess() {
    const user = getUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'dashboard.html';
    }
}

async function loadAdminData() {
    try {
        // Display admin name
        const user = getUser();
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl && user) {
            adminNameEl.textContent = user.name || 'Admin';
        }

        const data = await apiRequest('/api/admin/dashboard');
        
        if (data.success) {
            updateAdminStats(data);
            loadUsersTable(data.users);
            loadProjectsTable(data.projects);
            loadDepositsTable(data.deposits);
            loadWithdrawalsTable(data.withdrawals);
            loadAnnouncements(data.announcements);
        }

        await loadAdminHistory();
        
        // NEW: Load recent signups
        await loadRecentSignups();
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

async function loadAdminHistory() {
    try {
        const data = await apiRequest('/api/admin/history');
        if (data.success) {
            loadDepositHistoryTable(data.depositHistory);
            loadWithdrawalHistoryTable(data.withdrawalHistory);
        }
    } catch (error) {
        console.error('Error loading admin history:', error);
    }
}

function updateAdminStats(data) {
    const stats = {
        'total-users': data.totalUsers,
        'pending-deposits': data.pendingDeposits,
        'pending-withdrawals': data.pendingWithdrawals,
        'daily-profit': formatCurrency(data.dailyProfit)
    };

    Object.entries(stats).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
        }
    });
}

// ============================================
// USERS TABLE
// ============================================

function loadUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aucun utilisateur</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.phone}</td>
            <td>${formatCurrency(user.balance)}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewUserProfile(${user.id})">Voir</button>
                    <button class="action-btn approve" onclick="adjustUserBalance(${user.id}, 'add')">+ Fonds</button>
                    <button class="action-btn reject" onclick="adjustUserBalance(${user.id}, 'remove')">- Fonds</button>
                    <button class="action-btn view" onclick="changeUserPassword(${user.id})">Mot de passe</button>
                    <button class="action-btn reject" onclick="toggleUserStatus(${user.id}, 'suspend')">Suspendre</button>
                    <button class="action-btn reject" onclick="toggleUserStatus(${user.id}, 'block')">Bloquer</button>
${(user.status === 'blocked' || user.status === 'suspended') ? `<button class="action-btn approve" onclick="toggleUserStatus(${user.id}, 'unblock')">✓ Débloquer</button>` : ''}<button class="action-btn reject" onclick="deleteUser(${user.id})" style="background: #dc3545; color: white;">Supprimer</button><button class="action-btn" onclick="resetUser(${user.id})" style="background: #ffc107; color: #000;">Réinitialiser</button>

                </div>
            </td>
        </tr>
    `).join('');
}

async function viewUserProfile(userId) {
    const data = await apiRequest(`/api/admin/users/${userId}`);
    if (data.success) {
        alert(`Profil: ${data.user.name}\nTéléphone: ${data.user.phone}\nSolde: ${formatCurrency(data.user.balance)}\nStatut: ${data.user.status}\nInscrit le: ${formatDate(data.user.created_at)}`);
    }
}

async function adjustUserBalance(userId, operation) {
    const amountInput = prompt(`Montant à ${operation === 'add' ? 'ajouter' : 'retirer'} (en FCFA)`);
    if (!amountInput) return;

    const amount = parseFloat(amountInput.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) {
        alert('Veuillez saisir un montant valide');
        return;
    }

    const response = await apiRequest(`/api/admin/users/${userId}/balance`, 'PUT', {
        amount,
        operation
    });

    if (response.success) {
        alert('Solde utilisateur mis à jour');
        loadAdminData();
    } else {
        alert('Erreur: ' + response.message);
    }
}

async function changeUserPassword(userId) {
    const newPassword = prompt('Entrez le nouveau mot de passe (au moins 6 caractères):');
    if (!newPassword || newPassword.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    const response = await apiRequest(`/api/admin/users/${userId}/password`, 'PUT', {
        password: newPassword
    });

    if (response.success) {
        alert('Mot de passe utilisateur mis à jour');
    } else {
        alert('Erreur: ' + response.message);
    }
}

async function toggleUserStatus(userId, action) {
    if (!confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) return;

    const response = await apiRequest(`/api/admin/users/${userId}/${action}`, 'PUT');
    if (response.success) {
        alert('Utilisateur mis à jour');
        loadAdminData();
    } else {
        alert('Erreur: ' + response.message);
    }
}

async function deleteUser(userId) {
    if (!confirm('Supprimer définitivement ce compte utilisateur ? Cette action est irréversible !')) return;

    const response = await apiRequest(`/api/admin/users/${userId}`, 'DELETE');
    if (response.success) {
        alert('Compte utilisateur supprimé avec succès');
        loadAdminData();
    } else {
        alert('Erreur: ' + response.message);
    }
}

async function resetUser(userId) {
    if (!confirm('Réinitialiser ce compte utilisateur ? (solde=0, mot de passe=user123, statut=actif)')) return;

    const response = await apiRequest(`/api/admin/users/${userId}/reset`, 'PUT');
    if (response.success) {
        alert(response.message);
        loadAdminData();
    } else {
        alert('Erreur: ' + response.message);
    }
}


// ============================================
// PROJECTS TABLE
// ============================================

function loadProjectsTable(projects) {
    const tbody = document.getElementById('projects-table-body');
    if (!tbody) return;

    if (!projects || projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aucun produit</td></tr>';
        return;
    }

    tbody.innerHTML = projects.map(project => `
        <tr>
            <td>${project.name}</td>
            <td>${formatCurrency(project.investment)}</td>
            <td>${formatCurrency(project.daily_gain || project.dailyGain)}</td>
            <td>${project.duration} jours</td>
            <td>
                <span class="status-badge ${project.active ? 'status-approved' : 'status-pending'}">
                    ${project.active ? 'Actif' : 'Inactif'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="editProject(${project.id})">Éditer</button>
                    <button class="action-btn approve" onclick="adjustProjectDailyGain(${project.id}, 'add')">+ Gain</button>
                    <button class="action-btn reject" onclick="adjustProjectDailyGain(${project.id}, 'remove')">- Gain</button>
                    <button class="action-btn ${project.active ? 'reject' : 'approve'}" onclick="toggleProject(${project.id})">
                        ${project.active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button class="action-btn reject" onclick="deleteProject(${project.id})">Supprimer</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function toggleProject(projectId) {
    const response = await apiRequest(`/api/admin/projects/${projectId}/toggle`, 'PUT');
    if (response.success) {
        alert('Produit mis à jour');
        loadAdminData();
    } else {
        alert('Erreur: ' + response.message);
    }
}

async function editProject(projectId) {
    const name = prompt('Nom du produit:');
    if (!name) return;

    const response = await apiRequest(`/api/admin/projects/${projectId}`, 'PUT', { name });
    if (response.success) {
        alert('Produit mis à jour');
        loadAdminData();
    } else {
        alert('Erreur: ' + response.message);
    }
}

async function adjustProjectDailyGain(projectId, operation) {
    const promptText = operation === 'add'
        ? 'Montant à ajouter au gain quotidien (en FCFA)'
        : 'Montant à retirer du gain quotidien (en FCFA)';

    const amountInput = prompt(promptText);
    if (!amountInput) return;

    const amount = parseFloat(amountInput.replace(/[^0-9.]/g, ''));
    if (isNaN(amount) || amount <= 0) {
        alert('Veuillez saisir un montant valide');
        return;
    }

    const response = await apiRequest(`/api/admin/projects/${projectId}/daily-gain`, 'PUT', {
        amount,
        operation
    });

    if (response.success) {
        alert('Gain quotidien mis à jour');
        loadAdminData();
    } else {
        alert('Erreur: ' + response.message);
    }
}

async function deleteProject(projectId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.')) return;

    const response = await apiRequest(`/api/admin/projects/delete/${projectId}`, 'DELETE');
    if (response.success) {
        alert('Produit supprimé avec succès');
        loadAdminData();
    } else {
        alert('Erreur suppression produit: ' + response.message);
    }
}

// ============================================
// DEPOSITS TABLE
// ============================================

function loadDepositsTable(deposits) {
    const tbody = document.getElementById('deposits-table-body');
    if (!tbody) return;

    if (!deposits || deposits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aucun dépôt en attente</td></tr>';
        return;
    }

    tbody.innerHTML = deposits.map(deposit => `
        <tr>
            <td>${deposit.userName}</td>
            <td>${formatCurrency(deposit.amount)}</td>
            <td>${deposit.method}</td>
            <td>${formatDate(deposit.created_at)}</td>
            <td>
                <span class="status-badge status-pending">En attente</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn approve" onclick="approveDeposit(${deposit.id})">Valider</button>
                    <button class="action-btn reject" onclick="rejectDeposit(${deposit.id})">Rejeter</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function approveDeposit(depositId) {
    if (!confirm('Êtes-vous sûr de vouloir valider ce dépôt ?')) return;

    const response = await apiRequest(`/api/admin/deposits/${depositId}/approve`, 'PUT');
    if (response.success) {
        alert('Dépôt validé et solde crédité');
        await loadAdminHistory();
        loadAdminData();
    } else {
        alert('Erreur: ' + response.message);
    }
}

async function rejectDeposit(depositId) {
    if (!confirm('Êtes-vous sûr de vouloir rejeter ce dépôt ?')) return;

    const response = await apiRequest(`/api/admin/deposits/${depositId}/reject`, 'PUT');
    if (response.success) {
        alert('Dépôt rejeté');
        await loadAdminHistory();
        loadAdminData();
    } else {
        alert('Erreur: ' + response.message);
    }
}

// ============================================
// WITHDRAWALS TABLE
// ============================================

function loadWithdrawalsTable(withdrawals) {
    const tbody = document.getElementById('withdrawals-table-body');
    if (!tbody) return;

    if (!withdrawals || withdrawals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Aucun retrait en attente</td></tr>';
        return;
    }

    tbody.innerHTML = withdrawals.map(withdrawal => `
        <tr>
            <td>${withdrawal.userName}</td>
            <td>${formatCurrency(withdrawal.amount)}</td>
            <td>${withdrawal.method}</td>
            <td>${withdrawal.phone}</td>
            <td>${formatDate(withdrawal.created_at)}</td>
            <td>
                <span class="status-badge status-pending">En attente</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn approve" onclick="approveWithdrawal(${withdrawal.id})">Valider</button>
                    <button class="action-btn reject" onclick="rejectWithdrawal(${withdrawal.id})">Rejeter</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function approveWithdrawal(withdrawalId) {
    if (!confirm('Êtes-vous sûr de vouloir valider ce retrait ?')) return;

    const response = await apiRequest(`/api/admin/withdrawals/${withdrawalId}/approve`, 'PUT');
    if (response.success) {
        alert('Retrait validé');
        await loadAdminHistory();
        loadAdminData();
    } else {
        alert('Erreur: ' + response.message);
    }
}

async function rejectWithdrawal(withdrawalId) {
    if (!confirm('Êtes-vous sûr de vouloir rejeter ce retrait ?')) return;

    const response = await apiRequest(`/api/admin/withdrawals/${withdrawalId}/reject`, 'PUT');
    if (response.success) {
        alert('Retrait rejeté');
        await loadAdminHistory();
        loadAdminData();
    } else {
        alert('Erreur: ' + response.message);
    }
}

// ============================================
// HISTORY TABLES
// ============================================

function loadDepositHistoryTable(deposits) {
    const tbody = document.getElementById('deposit-history-table-body');
    if (!tbody) return;

    if (!deposits || deposits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Aucun dépôt enregistré</td></tr>';
        return;
    }

    tbody.innerHTML = deposits.map(deposit => `
        <tr>
            <td>${deposit.userName}</td>
            <td>${formatCurrency(deposit.amount)}</td>
            <td>${deposit.method}</td>
            <td>${deposit.status}</td>
            <td>${formatDate(deposit.created_at)}</td>
        </tr>
    `).join('');
}

function loadWithdrawalHistoryTable(withdrawals) {
    const tbody = document.getElementById('withdrawal-history-table-body');
    if (!tbody) return;

    if (!withdrawals || withdrawals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aucun retrait enregistré</td></tr>';
        return;
    }

    tbody.innerHTML = withdrawals.map(withdrawal => `
        <tr>
            <td>${withdrawal.userName}</td>
            <td>${formatCurrency(withdrawal.amount)}</td>
            <td>${withdrawal.method}</td>
            <td>${withdrawal.phone}</td>
            <td>${withdrawal.status}</td>
            <td>${formatDate(withdrawal.created_at)}</td>
        </tr>
    `).join('');
}

// ============================================
// ANNOUNCEMENTS
// ============================================

function loadAnnouncements(announcements) {
    const container = document.getElementById('announcements-list');
    if (!container) return;

    if (!announcements || announcements.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #B0B0B0;">Aucune annonce publiée</p>';
        return;
    }

    container.innerHTML = announcements.map(announcement => `
        <div style="background-color: #F5F5F5; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
            <h4>${announcement.title}</h4>
            <p>${announcement.content}</p>
            <small style="color: #B0B0B0;">${formatDate(announcement.created_at)}</small>
            <button class="action-btn reject" style="float: right;" onclick="deleteAnnouncement(${announcement.id})">Supprimer</button>
        </div>
    `).join('');
}

// ============================================
// FORM HANDLERS
// ============================================

function setupAdminFormHandlers() {
    // Add Project Button
    const addProjectBtn = document.getElementById('add-project-btn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', function() {
            const form = document.getElementById('project-form');
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });
    }

    // Cancel Project Button
    const cancelBtn = document.getElementById('cancel-project');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            document.getElementById('project-form').style.display = 'none';
        });
    }

    // Add Project Form
    const addProjectForm = document.getElementById('add-project-form');
    if (addProjectForm) {
        addProjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('project-name').value;
            const investment = document.getElementById('project-investment').value;
            const daily = document.getElementById('project-daily').value;
            const duration = document.getElementById('project-duration').value;

            const response = await apiRequest('/api/admin/projects', 'POST', {
                name,
                investment: parseInt(investment),
                dailyGain: parseInt(daily),
                duration: parseInt(duration)
            });

            if (response.success) {
                alert('Produit créé avec succès');
                addProjectForm.reset();
                document.getElementById('project-form').style.display = 'none';
                loadAdminData();
            } else {
                alert('Erreur: ' + response.message);
            }
        });
    }

    // Announcement Form
    const announcementForm = document.getElementById('announcement-form');
    if (announcementForm) {
        announcementForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('announcement-title').value;
            const content = document.getElementById('announcement-content').value;

            const response = await apiRequest('/api/admin/announcements', 'POST', {
                title,
                content
            });

            if (response.success) {
                alert('Annonce publiée avec succès');
                announcementForm.reset();
                loadAdminData();
            } else {
                alert('Erreur: ' + response.message);
            }
        });
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

async function deleteAnnouncement(id) {
    if (!confirm('Êtes-vous sûr ?')) return;

    const response = await apiRequest(`/api/admin/announcements/${id}`, 'DELETE');
    if (response.success) {
        alert('Annonce supprimée');
        loadAdminData();
    }
}

// NEW: Recent Signups Section
async function loadRecentSignups() {
    try {
        const data = await apiRequest('/api/admin/recent-signups');
        if (data.success && data.recentSignups.length > 0) {
            const container = document.getElementById('recent-signups-container');
            if (container) {
                container.innerHTML = data.recentSignups.map(user => `
                    <div class="recent-user">
                        <strong>${user.name}</strong> (${user.phone}) 
                        <small>${formatDate(user.created_at)}</small>
                        ${user.referral_code ? `<span style="color: #28a745;">REF</span>` : ''}
                    </div>
                `).join('') || '<p>Aucune nouvelle inscription récente</p>';
            }
        }
    } catch (error) {
        console.error('Error loading recent signups:', error);
    }
}

// Auto-refresh admin data every 5 minutes (now includes signups)
setInterval(loadAdminData, 300000);
