/**
 * SY Wealth - Dashboard JavaScript
 * User dashboard functionality
 */

// ============================================
// DASHBOARD INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    setupFormHandlers();
    
    // Claim salary button
    const claimBtn = document.getElementById('claim-salary-btn');
    if (claimBtn) {
        claimBtn.addEventListener('click', claimSalary);
    }
});

async function loadDashboardData() {
    try {
        const data = await apiRequest('/api/dashboard');
        
        if (data.success) {
            updateDashboardUI(data);
            loadActiveInvestments(data.investments);
            loadTransactionHistory(data.transactions);
            loadProfile(data.user);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    } finally {
        loadInvestmentProducts();
    }
}

function updateDashboardUI(data) {
    // Update balance
    const balanceEl = document.getElementById('balance');
    if (balanceEl) {
        balanceEl.textContent = formatCurrency(data.balance);
    }

    // Update gain today
    const gainTodayEl = document.getElementById('gain-today');
    if (gainTodayEl) {
        gainTodayEl.textContent = '+' + formatCurrency(data.gainToday);
    }

    // Update active investments count
    const investmentsActiveEl = document.getElementById('investments-active');
    if (investmentsActiveEl) {
        investmentsActiveEl.textContent = (data.investments || []).length;
    }
}

function loadActiveInvestments(investments) {
    const container = document.getElementById('active-investments');
    if (!container) return;

    if (!investments || investments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #B0B0B0;">Aucun investissement actif</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Produit</th>
                    <th>Montant</th>
                    <th>Gain/jour</th>
                    <th>Jours restants</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
    `;

    investments.forEach(inv => {
        html += `
            <tr>
                <td>${inv.productName}</td>
                <td>${formatCurrency(inv.amount)}</td>
                <td><span style="color: #18C964;">+${formatCurrency(inv.dailyGain)}</span></td>
                <td>${inv.daysRemaining}</td>
                <td><span class="status-badge status-approved">Actif</span></td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function loadTransactionHistory(transactions) {
    const container = document.getElementById('transaction-history');
    if (!container) return;

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #B0B0B0;">Aucune transaction</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Date</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
    `;

    transactions.forEach(trans => {
        const statusClass = trans.status === 'pending'
            ? 'status-pending'
            : trans.status === 'completed'
                ? 'status-approved'
                : trans.status === 'failed'
                    ? 'status-rejected'
                    : `status-${trans.status}`;

        const statusText = trans.status === 'pending'
            ? 'En attente'
            : trans.status === 'completed'
                ? 'Approuvé'
                : trans.status === 'approved'
                    ? 'Approuvé'
                    : trans.status === 'failed'
                        ? 'Rejeté'
                        : trans.status;

        html += `
            <tr>
                <td>${trans.type === 'deposit' ? '📥 Dépôt' : trans.type === 'withdrawal' ? '📤 Retrait' : '💰 ' + trans.type}</td>
                <td>${formatCurrency(trans.amount)}</td>
                <td>${formatDate(trans.createdAt)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

async function claimSalary() {
    const btn = document.getElementById('claim-salary-btn');
    const messageEl = document.getElementById('claim-message');
    
    if (!btn || !messageEl) return;
    
    btn.disabled = true;
    btn.textContent = 'Traitement...';
    messageEl.textContent = '';
    
    try {
        const response = await apiRequest('/api/dashboard/claim-salary', 'POST');
        
        if (response.success) {
            messageEl.innerHTML = `<div class="success">${response.message}</div>`;
            // Reload dashboard data to update balance
            loadDashboardData();
        } else {
            messageEl.innerHTML = `<div class="error">${response.message}</div>`;
        }
    } catch (error) {
        messageEl.innerHTML = `<div class="error">Erreur lors de la réclamation</div>`;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Réclamer mon salaire';
    }
}

function loadProfile(user) {
    const nameEl = document.getElementById('profile-name');
    const phoneEl = document.getElementById('profile-phone');
    const dateEl = document.getElementById('profile-date');
    const referralEl = document.getElementById('profile-referral');
    const copyButton = document.getElementById('copy-referral');

    if (nameEl) nameEl.textContent = user.name;
    if (phoneEl) phoneEl.textContent = user.phone;
    if (dateEl) dateEl.textContent = formatDate(user.createdAt);

    if (referralEl) {
        const referralLink = `${window.location.origin}/signup.html?ref=${encodeURIComponent(user.referralCode || '')}`;
        referralEl.value = referralLink;
    }

    if (copyButton) {
        copyButton.onclick = async () => {
            if (!referralEl || !referralEl.value) return;
            try {
                await navigator.clipboard.writeText(referralEl.value);
                alert('Lien de parrainage copié !');
            } catch (error) {
                alert('Impossible de copier le lien.');
            }
        };
    }
}

// ============================================
// INVEST HANDLER
// ============================================

function attachInvestButtonHandlers() {
    const investBtns = document.querySelectorAll('.invest-btn');
    investBtns.forEach(btn => {
        btn.removeEventListener('click', investButtonClickHandler);
        btn.addEventListener('click', investButtonClickHandler);
    });
}

async function investButtonClickHandler(e) {
    e.preventDefault();

    const button = this;
    const originalText = button.textContent;
    const productId = button.dataset.product;
    const amount = button.dataset.amount;

    if (!productId || !amount) {
        alert('Données produit manquantes');
        return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir investir ${formatCurrency(amount)} ?`)) {
        return;
    }

    // Loading state
    button.disabled = true;
    button.innerHTML = '⏳ Investissement en cours...';
    button.style.opacity = '0.7';

    try {
        console.log('🚀 Démarrage investissement:', { productId, amount });
        const response = await apiRequest('/api/investments/create', 'POST', {
            projectId: parseInt(productId),
            amount: parseInt(amount)
        });

        if (response.success) {
            alert(`✅ Succès ! Investment #${response.investmentId || 'N/A'} créé.`);
            loadDashboardData();
        } else {
            console.error('❌ Échec investissement:', response.message);
            alert(`❌ ${response.message || 'Échec création investissement'}`);
        }
    } catch (error) {
        console.error('💥 Erreur investissement:', error);
        alert(`💥 ${error.message || 'Erreur inattendue'}`);
    } finally {
        // Reset button
        button.disabled = false;
        button.textContent = originalText;
        button.style.opacity = '1';
    }
}

async function loadInvestmentProducts(retryCount = 0) {
    const container = document.getElementById('products-grid');
    if (!container) return;

    const loadingHTML = '<div style="text-align:center; padding:40px;"><div style="font-size:48px; margin-bottom:20px;">⏳</div><p>Chargement des produits d\'investissement...</p></div>';
    container.innerHTML = loadingHTML;

    try {
        console.log('📦 Chargement produits (tentative ' + (retryCount + 1) + ')');
        const data = await apiRequest('/api/investments/products');

        if (!data.success || !Array.isArray(data.products)) {
            throw new Error(data.message || 'Réponse invalide du serveur');
        }

        if (data.products.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#B0B0B0;"><p>📭 Aucun produit disponible pour le moment.</p><p style="font-size:14px;">Revenez bientôt pour de nouvelles opportunités !</p></div>';
            return;
        }

        container.innerHTML = data.products.map(product => {
            const profitTotal = product.dailyGain * product.duration;
            return `
                <div class="product-card">
                    <div class="product-icon">💼</div>
                    <h3>${product.name}</h3>
                    <div class="product-details">
                        <div class="detail">
                            <span class="label">Investissement:</span>
                            <span class="value">${formatCurrency(product.investment)}</span>
                        </div>
                        <div class="detail">
                            <span class="label">Gain quotidien:</span>
                            <span class="value gain">${formatCurrency(product.dailyGain)}</span>
                        </div>
                        <div class="detail">
                            <span class="label">Durée:</span>
                            <span class="value">${product.duration} jours</span>
                        </div>
                        <div class="detail highlight">
                            <span class="label">Profit total:</span>
                            <span class="value profit-total">${formatCurrency(profitTotal)}</span>
                        </div>
                    </div>
                    <button class="btn btn-primary invest-btn" data-product="${product.id}" data-amount="${product.investment}">Investir maintenant</button>
                </div>
            `;
        }).join('');

        attachInvestButtonHandlers();
        console.log('✅ Produits chargés:', data.products.length);
    } catch (error) {
        console.error('❌ Échec chargement produits:', error);
        
        if (retryCount < 2) {
            console.log('🔄 Retry dans 2s...');
            setTimeout(() => loadInvestmentProducts(retryCount + 1), 2000);
            return;
        }
        
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:#E74C3C;">
                <div style="font-size:48px; margin-bottom:20px;">⚠️</div>
                <h3>Impossible de charger les produits</h3>
                <p>${error.message}</p>
                <button onclick="loadInvestmentProducts()" class="btn btn-primary" style="margin-top:20px;">Réessayer</button>
                <p style="font-size:14px; margin-top:15px; opacity:0.8;">
                    Vérifiez la console (F12) pour plus de détails
                </p>
            </div>
        `;
    }
}

// ============================================
// DEPOSIT FORM HANDLER
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const depositForm = document.getElementById('deposit-form');
    
    if (depositForm) {
        depositForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const amount = document.getElementById('deposit-amount').value;
            const method = document.getElementById('deposit-method').value;
            const phoneNumber = document.getElementById('sender-phone').value;
            const receipt = document.getElementById('receipt').files[0];
            const messageDiv = document.getElementById('deposit-message');

            if (!amount || !method || !phoneNumber || !receipt) {
                messageDiv.textContent = 'Veuillez remplir tous les champs';
                messageDiv.className = 'message error';
                return;
            }

            try {
                // Convert image to base64
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const receiptData = event.target.result;

                    const response = await apiRequest('/api/deposits/create', 'POST', {
                        amount: parseInt(amount),
                        method: method,
                        senderPhone: phoneNumber,
                        receipt: receiptData
                    });

                    if (response.success) {
                        messageDiv.textContent = '✅ Dépôt soumis avec succès. En attente de validation admin.';
                        messageDiv.className = 'message success';
                        depositForm.reset();
                        setTimeout(() => {
                            loadDashboardData();
                        }, 2000);
                    } else {
                        messageDiv.textContent = '❌ ' + (response.message || 'Erreur lors de la soumission');
                        messageDiv.className = 'message error';
                    }
                };
                reader.readAsDataURL(receipt);
            } catch (error) {
                messageDiv.textContent = '❌ Erreur: ' + error.message;
                messageDiv.className = 'message error';
            }
        });
    }
});

// ============================================
// WITHDRAWAL FORM HANDLER
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const withdrawalForm = document.getElementById('withdrawal-form');
    
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const amount = document.getElementById('withdrawal-amount').value;
            const method = document.getElementById('withdrawal-method').value;
            const phone = document.getElementById('phone-number').value;
            const messageDiv = document.getElementById('withdrawal-message');

            if (!amount || !method || !phone) {
                messageDiv.textContent = 'Veuillez remplir tous les champs';
                messageDiv.className = 'message error';
                return;
            }

            try {
                const response = await apiRequest('/api/withdrawals/create', 'POST', {
                    amount: parseInt(amount),
                    method: method,
                    phone: phone
                });

                if (response.success) {
                    const withdrawalNumber = response.withdrawalId || response.id;
                    messageDiv.innerHTML = `✅ Demande de retrait soumise avec succès !<br><strong>Numéro de retrait : ${withdrawalNumber}</strong><br>En attente de validation admin.`;
                    messageDiv.className = 'message success';
                    withdrawalForm.reset();
                    setTimeout(() => {
                        loadDashboardData();
                    }, 2000);
                } else {
                    messageDiv.textContent = '❌ ' + (response.message || 'Erreur lors de la soumission');
                    messageDiv.className = 'message error';
                }
            } catch (error) {
                messageDiv.textContent = '❌ Erreur: ' + error.message;
                messageDiv.className = 'message error';
            }
        });
    }
});

// ============================================
// FORM SETUP
// ============================================

function setupFormHandlers() {
    // Setup file input for deposit receipts
    const receiptInput = document.getElementById('receipt');
    if (receiptInput) {
        receiptInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxSize) {
                    alert('La taille du fichier ne doit pas dépasser 5MB');
                    this.value = '';
                } else if (!file.type.startsWith('image/')) {
                    alert('Veuillez sélectionner une image');
                    this.value = '';
                }
            }
        });
    }
}

// Auto-refresh dashboard data every 5 minutes
setInterval(loadDashboardData, 300000);
