// layout-shell.js - Injects the sidebar/navbar into app.html (the SPA shell)
function injectShellLayout(contentElementId = "app-shell-container", activePage = "") {
    const userStr = localStorage.getItem("pos_user");
    if (!userStr) return; // auth.js will handle redirect

    const user = JSON.parse(userStr);
    const body = document.body;

    // Create Layout Container
    const layoutWrapper = document.createElement("div");
    layoutWrapper.className = "min-h-screen bg-gray-50 flex";

    // Sidebar
    const sidebar = document.createElement("div");
    sidebar.className = "w-64 bg-blue-900 border-r border-blue-900 hidden md:flex flex-col h-screen sticky top-0 no-print";

    // Mobile Topbar
    const mobileTopbar = document.createElement("div");
    mobileTopbar.className = "md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-50 no-print";
    mobileTopbar.innerHTML = `
        <div class="flex items-center gap-2">
            <img src="https://globalenglish.id/wp-content/uploads/2023/09/image20-min.png" alt="Logo" class="h-8">
            <span class="font-bold text-gray-800">POS DM</span>
        </div>
        <button id="mobile-menu-btn" class="p-2 text-gray-600">
            <i data-lucide="menu"></i>
        </button>
    `;

    // Navigation Links
    let navLinksHtml = '';

    const linkClasses = (isActive) => isActive
        ? "flex items-center gap-3 px-4 py-3 bg-blue-800 text-white shadow-inner rounded-lg font-medium transition-colors"
        : "flex items-center gap-3 px-4 py-3 text-blue-100 hover:bg-blue-800 hover:text-white rounded-lg font-medium transition-colors border border-transparent hover:border-blue-700";

    // Sidebar links action
    const shellAction = (pageName) => `onclick="window.location.hash='${pageName}'; document.getElementById('content-frame').src='${pageName}.html'; document.querySelectorAll('a[data-page]').forEach(el => el.className='${linkClasses(false)}'); this.className='${linkClasses(true)}'; document.getElementById('mobile-menu')?.classList.add('hidden');" data-page="${pageName}"`;

    if (user.role === 'admin') {
        navLinksHtml += `
            <a href="javascript:void(0)" ${shellAction('index')} class="${linkClasses(activePage === 'index')}">
                <i data-lucide="calculator" class="w-5 h-5"></i> Kasir POS
            </a>
            <a href="javascript:void(0)" ${shellAction('admin-txn')} class="${linkClasses(activePage === 'admin-txn')}">
                <i data-lucide="file-text" class="w-5 h-5"></i> Semua Transaksi
            </a>
            <a href="javascript:void(0)" ${shellAction('admin-cs')} class="${linkClasses(activePage === 'admin-cs')}">
                <i data-lucide="users" class="w-5 h-5"></i> Kelola CS
            </a>
            <a href="javascript:void(0)" ${shellAction('payment-web')} class="${linkClasses(activePage === 'payment-web')}">
                <i data-lucide="globe" class="w-5 h-5"></i> Log Payment Web
            </a>
        `;
    } else {
        navLinksHtml += `
            <a href="javascript:void(0)" ${shellAction('index')} class="${linkClasses(activePage === 'index')}">
                <i data-lucide="layout-dashboard" class="w-5 h-5"></i> Kasir POS
            </a>
            <a href="javascript:void(0)" ${shellAction('payment-web')} class="${linkClasses(activePage === 'payment-web')}">
                <i data-lucide="globe" class="w-5 h-5"></i> Data Web (Validasi)
            </a>
            <a href="javascript:void(0)" ${shellAction('admin-txn')} class="${linkClasses(activePage === 'admin-txn')}">
                <i data-lucide="receipt" class="w-5 h-5"></i> Semua Transaksi
            </a>
        `;
    }

    const sidebarContent = `
        <div class="p-6 border-b border-blue-800 flex items-center justify-center">
            <img src="https://globalenglish.id/wp-content/uploads/2023/09/image20-min.png" alt="Global English" class="h-12 object-contain hidden md:block brightness-0 invert" />
        </div>
        <div class="flex-grow p-4 space-y-2">
            ${navLinksHtml}
        </div>
        <div class="p-4 border-t border-blue-800">
            <div class="flex items-center gap-3 mb-4 px-2">
                <div class="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold border border-blue-600">
                    ${user.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <div class="text-sm font-bold text-white">${user.username}</div>
                    <div class="text-xs text-blue-200 capitalize">${user.role}</div>
                </div>
            </div>
            <button onclick="window.logout()" class="w-full flex items-center gap-3 px-4 py-2 text-red-200 hover:bg-red-800 hover:text-white rounded-lg font-medium transition-colors border border-transparent hover:border-red-700">
                <i data-lucide="log-out" class="w-5 h-5"></i> Logout
            </button>
        </div>
    `;

    sidebar.innerHTML = sidebarContent;

    // Mobile Menu Overlay
    const mobileMenu = document.createElement("div");
    mobileMenu.id = "mobile-menu";
    mobileMenu.className = "fixed inset-0 z-40 bg-gray-900 bg-opacity-50 hidden no-print";
    const mobileSidebar = document.createElement("div");
    mobileSidebar.className = "absolute left-0 top-0 bottom-0 w-64 bg-blue-900 flex flex-col shadow-xl";
    mobileSidebar.innerHTML = `
        <div class="flex justify-between items-center p-4 border-b">
            <span class="font-bold text-gray-800">Menu</span>
            <button id="close-mobile-menu" class="p-2 text-gray-500 hover:bg-gray-100 rounded">
                <i data-lucide="x"></i>
            </button>
        </div>
        ${sidebarContent} <!-- Reusing the same inner layout -->
    `;
    mobileMenu.appendChild(mobileSidebar);

    // Find the shell container
    const shellContainer = document.getElementById(contentElementId);
    if (!shellContainer) return;

    // Main Container wrapping iframe
    const mainContainer = document.createElement("div");
    mainContainer.className = "flex-1 flex flex-col h-screen overflow-hidden";

    mainContainer.appendChild(mobileTopbar);

    // Move original iframe child into the flex wrapper
    while (shellContainer.firstChild) {
        mainContainer.appendChild(shellContainer.firstChild);
    }

    shellContainer.appendChild(sidebar);
    shellContainer.appendChild(mainContainer);
    shellContainer.className = "flex w-full h-screen";

    // Append Mobile Menu to body
    document.body.appendChild(mobileMenu);

    // Init Icons in newly injected HTML
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Event Listeners for Mobile Menu
    document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
        mobileMenu.classList.remove("hidden");
    });
    document.getElementById("close-mobile-menu")?.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
    });
}
