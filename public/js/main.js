/**
 * SY Wealth - Main JavaScript
 * Shared functionality across all pages
 */

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function isLoggedIn() {
    return !!localStorage.getItem('token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Logout button handler
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Check authentication
    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.includes('admin.html');
    const isDashboardPage = currentPath.includes('dashboard.html');
    const authPages = ['login.html', 'signup.html', 'admin-login.html', 'how-it-works.html', 'about.html', 'contact.html', 'index.html'];
    
    const user = getUser();
    const isLoggedInUser = isLoggedIn();

    // Protect admin pages
    if (isAdminPage) {
        if (!isLoggedInUser) {
            window.location.href = 'login.html';
            return;
        }
        if (user && user.role !== 'admin') {
            // Non-admin users trying to access admin page go to dashboard
            window.location.href = 'dashboard.html';
            return;
        }
    }

    // Protect dashboard pages
    if (isDashboardPage) {
        if (!isLoggedInUser) {
            window.location.href = 'login.html';
            return;
        }
        if (user && user.role === 'admin') {
            // Admin users go to admin panel instead
            window.location.href = 'admin.html';
            return;
        }
    }

    // If logged in and on public pages, redirect to appropriate dashboard
    const isPublicPage = authPages.some(page => currentPath.includes(page));
    if (isLoggedInUser && isPublicPage && !isAdminPage && !isDashboardPage) {
        if (user && user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }

    // Load user info
    loadUserInfo();

    // Load statistics
    loadStatistics();

    // Show announcements if on dashboard
    if (isDashboardPage) {
        showAnnouncements();
    }
});

// ============================================
// USER INFO LOADING
// ============================================

function loadUserInfo() {
    const user = getUser();
    if (user) {
        const userNameElement = document.getElementById('user-name') || 
                               document.getElementById('admin-name');
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }
    }
}

// ============================================
// ANNOUNCEMENTS DISPLAY
// ============================================

function showAnnouncements() {
    const announcements = localStorage.getItem('announcements');
    if (!announcements) return;

    try {
        const announcementsList = JSON.parse(announcements);
        if (!announcementsList || announcementsList.length === 0) return;

        // Create notification container
        const notificationContainer = document.createElement('div');
        notificationContainer.className = 'announcement-notification';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        `;

        const announcementContent = document.createElement('div');
        announcementContent.innerHTML = `
            <h3 style="margin: 0 0 10px 0; font-size: 18px;">📢 Nouvelle annonce</h3>
            <p style="margin: 0 0 8px 0; font-weight: bold;">${announcementsList[0].title}</p>
            <p style="margin: 0; font-size: 14px; opacity: 0.95;">${announcementsList[0].content}</p>
        `;

        notificationContainer.appendChild(announcementContent);
        notificationContainer.appendChild(closeBtn);
        document.body.appendChild(notificationContainer);

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(500px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        closeBtn.addEventListener('click', () => {
            notificationContainer.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notificationContainer.remove(), 300);
            localStorage.removeItem('announcements');
        });

        // Auto-close after 8 seconds
        setTimeout(() => {
            if (notificationContainer.parentElement) {
                notificationContainer.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notificationContainer.remove(), 300);
            }
        }, 8000);

    } catch (error) {
        console.error('Error showing announcements:', error);
    }
}

// ============================================
// STATISTICS LOADING
// ============================================

async function loadStatistics() {
    try {
        const response = await fetch('/api/statistics');
        const data = await response.json();

        if (data.success) {
            const usersEl = document.getElementById('stat-users');
            const investmentsEl = document.getElementById('stat-investments');
            const gainsEl = document.getElementById('stat-gains');

            if (usersEl) usersEl.textContent = data.activeUsers;
            if (investmentsEl) investmentsEl.textContent = formatCurrency(data.totalInvestments);
            if (gainsEl) gainsEl.textContent = formatCurrency(data.totalGains);
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-SN', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('fr-SN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// ============================================
// API HELPER FUNCTIONS
// ============================================

async function apiRequest(url, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        console.log(`🔄 API Request: ${method} ${url}`, body ? { body } : '');
        const response = await fetch(url, options);
        
        console.log(`📡 API Response: ${response.status} ${response.statusText} pour ${url}`);
        
        if (response.status === 401) {
            console.warn('🔑 Token expiré, déconnexion');
            logout();
            throw new Error('Session expirée. Veuillez vous reconnecter.');
        }
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
                console.error('❌ Erreur métier API:', errorData);
            } catch (jsonError) {
                console.error('❌ Réponse non-JSON:', response.status, response.statusText);
                errorData = { message: `${response.statusText} (${response.status})` };
            }
            return {
                success: false,
                message: errorData.message || `Erreur ${response.status}: ${response.statusText}`
            };
        }
        
        const data = await response.json();
        console.log('✅ API Réussie:', data);
        return data;
    } catch (error) {
        console.error('🌐 Erreur Réseau/Timeout:', {
            url,
            method,
            error: error.message,
            stack: error.stack?.split('\n')[0]
        });
        return { 
            success: false, 
            message: '❌ Erreur réseau - Serveur indisponible ou timeout. Vérifiez si le serveur tourne (node server.js) et votre connexion.' 
        };
    }
}

// ============================================
// FORM ATTACHMENT HANDLING
// ============================================

function setupFileInput(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (file.size > maxSize) {
                    alert('La taille du fichier ne doit pas dépasser 5MB');
                    this.value = '';
                }
            }
        });
    }
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
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
            const sections = document.querySelectorAll('.dashboard-section, .admin-section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
});

// ============================================
// CURRENCY INPUT FORMATTING
// ============================================

function setupCurrencyInput(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.addEventListener('blur', function() {
            if (this.value) {
                this.value = parseInt(this.value);
            }
        });
    }
}

// Setup on page load
document.addEventListener('DOMContentLoaded', function() {
    setupCurrencyInput('deposit-amount');
    setupCurrencyInput('withdrawal-amount');
    setupFileInput('receipt');
});
