// auth.js - Guard script included in <head> of protected pages

const PROTECTED_ROUTES = {
    "admin": ["app", "index", "admin-cs", "admin-txn", "payment-web"],
    "cs": ["app", "index", "admin-txn", "payment-web"] // CS can access POS, Semua Transaksi, and Payment Web view
};

function parseStoredUser() {
    const userStr = localStorage.getItem("pos_user");
    if (!userStr) return null;

    try {
        const user = JSON.parse(userStr);
        const role = String(user?.role || "").toLowerCase();
        const username = String(user?.username || "").trim();

        if (!username || !PROTECTED_ROUTES[role]) return null;
        return { ...user, role, username };
    } catch {
        return null;
    }
}

function checkAuthAndRedirect() {
    const user = parseStoredUser();

    // Robust path extraction for Windows, File Protocols & Netlify Pretty URLs
    let currentPath = window.location.pathname.split('/').pop() || 'index';
    if (currentPath.includes('\\')) currentPath = currentPath.split('\\').pop();
    currentPath = currentPath.split('?')[0].split('#')[0].toLowerCase().replace('.html', '');
    if (!currentPath) currentPath = 'index';

    // 1. Not logged in
    if (!user) {
        localStorage.removeItem("pos_user");
        if (currentPath !== 'login') {
            window.location.replace('login.html');
        }
        return null;
    }

    // 2. Already logged in but trying to access login
    if (currentPath === 'login') {
        if (user.role === 'admin') {
            window.location.replace('admin-txn.html');
        } else {
            window.location.replace('index.html');
        }
        return user;
    }

    // 2.5 Allow shell passthrough silently
    if (currentPath === 'app') return user;

    // 3. Authorization Check
    const allowedRoutes = PROTECTED_ROUTES[user.role] || [];

    // If the current page isn't in their allowed list, redirect them to their default page
    if (!allowedRoutes.includes(currentPath)) {
        if (user.role === 'admin') {
            window.location.replace('admin-txn.html');
        } else {
            window.location.replace('index.html');
        }
    }

    return user;
}

// Execute immediately to prevent page flicker
const currentUser = checkAuthAndRedirect();
window.currentUser = currentUser;
window.getAuthenticatedUser = parseStoredUser;

// Provide a logout global function
window.logout = function () {
    localStorage.removeItem("pos_user");
    window.location.replace('login.html');
};
