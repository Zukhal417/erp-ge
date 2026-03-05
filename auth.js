// auth.js - Guard script included in <head> of protected pages

const PROTECTED_ROUTES = {
    "admin": ["app", "index", "admin-cs", "admin-txn", "payment-web"],
    "cs": ["app", "index", "admin-txn", "payment-web"] // CS can access POS, Semua Transaksi, and Payment Web view
};

function checkAuthAndRedirect() {
    const userStr = localStorage.getItem("pos_user");

    // Robust path extraction for Windows, File Protocols & Netlify Pretty URLs
    let currentPath = window.location.pathname.split('/').pop() || 'index';
    if (currentPath.includes('\\')) currentPath = currentPath.split('\\').pop();
    currentPath = currentPath.split('?')[0].split('#')[0].toLowerCase().replace('.html', '');
    if (!currentPath) currentPath = 'index';

    // 1. Not logged in
    if (!userStr) {
        if (currentPath !== 'login') {
            window.location.replace('login.html');
        }
        return null;
    }

    try {
        const user = JSON.parse(userStr);

        // 2. Already logged in but trying to access login
        if (currentPath === 'login') {
            if ((user.role || '').toLowerCase() === 'admin') {
                window.location.replace('app.html#admin-txn');
            } else {
                window.location.replace('app.html#index');
            }
            return user;
        }

        // 2.5 Allow shell passthrough silently
        if (currentPath === 'app') return user;

        // 3. Authorization Check
        const role = (user.role || '').toLowerCase(); // Normalize Role to lowercase
        const allowedRoutes = PROTECTED_ROUTES[role] || [];

        // If the current page isn't in their allowed list, redirect them to their default page
        if (!allowedRoutes.includes(currentPath)) {
            if (role === 'admin') {
                window.location.replace('app.html#admin-txn');
            } else {
                window.location.replace('app.html#index');
            }
        }

        return user;

    } catch (e) {
        // Bad JSON in localStorage
        localStorage.removeItem("pos_user");
        if (currentPath !== 'login') {
            window.location.replace('login.html');
        }
        return null;
    }
}

// Execute immediately to prevent page flicker
const currentUser = checkAuthAndRedirect();

// Provide a logout global function
window.logout = function () {
    localStorage.removeItem("pos_user");
    window.location.replace('login.html');
};

