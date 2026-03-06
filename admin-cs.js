const API_URL = "https://script.google.com/macros/s/AKfycbwVR0p_Sc2sH-yA2zcCqLRh7SwqQeQYue-dmmxp-nWmR6yX_OgweCSlITCOnMxE366-0g/exec";

// Form DOM
const form = document.getElementById('user-form');
const inpId = document.getElementById('edit-id');
const inpUsername = document.getElementById('username');
const inpPassword = document.getElementById('password');
const inpRole = document.getElementById('role');
const passHelp = document.getElementById('password-help');

const btnSubmit = document.getElementById('btn-submit');
const textSubmit = document.getElementById('text-submit');
const spinnerSubmit = document.getElementById('spinner-submit');
const btnCancel = document.getElementById('btn-cancel');

// Alerts DOM
const alertError = document.getElementById('error-alert');
const alertSuccess = document.getElementById('success-alert');

// Table DOM
const tbody = document.getElementById('users-tbody');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const refreshIcon = document.getElementById('refresh-icon');

const formTitle = document.getElementById('form-title');

// State
let users = [];
const currentUser = window.getAuthenticatedUser ? window.getAuthenticatedUser() : null;

function ensureAdmin() {
    return (currentUser?.role || "").toLowerCase() === "admin";
}

function showSuccess(msg) {
    alertSuccess.textContent = msg;
    alertSuccess.classList.remove('hidden');
    alertError.classList.add('hidden');
    setTimeout(() => alertSuccess.classList.add('hidden'), 5000);
}

function showError(msg) {
    alertError.textContent = msg;
    alertError.classList.remove('hidden');
    alertSuccess.classList.add('hidden');
}

// Fetch Users
async function fetchUsers() {
    refreshIcon.classList.add('animate-spin');
    tbody.innerHTML = '';
    loadingState.classList.remove('hidden');
    loadingState.classList.add('flex');
    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');

    try {
        const payload = { action: "getUsers" };
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success && result.data) {
            users = result.data;
            renderTable();
        } else {
            console.error("Fetch returned false", result);
        }
    } catch (e) {
        console.error("Fetch users error:", e);
    } finally {
        loadingState.classList.add('hidden');
        loadingState.classList.remove('flex');
        refreshIcon.classList.remove('animate-spin');
        if (users.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        }
    }
}

// Render Table
function renderTable() {
    tbody.innerHTML = '';
    const currentUsername = currentUser?.username || "";

    users.forEach((user, idx) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors";

        const isSelf = user.username === currentUsername;
        const roleClass = user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700';

        const tdId = document.createElement('td');
        tdId.className = "px-6 py-4 font-mono text-gray-500";
        tdId.textContent = String(user.id || (idx + 1));

        const tdUsername = document.createElement('td');
        tdUsername.className = "px-6 py-4 font-bold text-gray-800";
        const usernameWrap = document.createElement('div');
        usernameWrap.className = "flex items-center gap-2";
        const usernameText = document.createElement('span');
        usernameText.textContent = user.username || "-";
        usernameWrap.appendChild(usernameText);
        if (isSelf) {
            const selfBadge = document.createElement('span');
            selfBadge.className = "px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-semibold uppercase";
            selfBadge.textContent = "Anda";
            usernameWrap.appendChild(selfBadge);
        }
        tdUsername.appendChild(usernameWrap);

        const tdRole = document.createElement('td');
        tdRole.className = "px-6 py-4";
        const roleBadge = document.createElement('span');
        roleBadge.className = `inline-flex px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider ${roleClass}`;
        roleBadge.textContent = user.role || "-";
        tdRole.appendChild(roleBadge);

        const tdActions = document.createElement('td');
        tdActions.className = "px-6 py-4 text-right";
        const actionWrap = document.createElement('div');
        actionWrap.className = "flex justify-end gap-2";

        const btnEdit = document.createElement('button');
        btnEdit.type = "button";
        btnEdit.className = "p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors";
        btnEdit.title = "Edit";
        btnEdit.textContent = "Edit";
        btnEdit.addEventListener('click', () => window.editUser(user.id, user.username, user.role));

        const btnDelete = document.createElement('button');
        btnDelete.type = "button";
        btnDelete.className = "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30";
        btnDelete.title = "Delete";
        btnDelete.textContent = "Hapus";
        btnDelete.disabled = isSelf;
        btnDelete.addEventListener('click', () => window.deleteUser(user.id));

        actionWrap.appendChild(btnEdit);
        actionWrap.appendChild(btnDelete);
        tdActions.appendChild(actionWrap);

        tr.appendChild(tdId);
        tr.appendChild(tdUsername);
        tr.appendChild(tdRole);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

function setLoading(isLoading) {
    if (isLoading) {
        btnSubmit.disabled = true;
        textSubmit.textContent = "Menyimpan...";
        spinnerSubmit.classList.remove('hidden');
    } else {
        btnSubmit.disabled = false;
        textSubmit.textContent = inpId.value ? "Update Pengguna" : "Simpan Pengguna";
        spinnerSubmit.classList.add('hidden');
    }
}

function resetForm() {
    inpId.value = "";
    inpUsername.value = "";
    inpPassword.value = "";
    inpPassword.required = true;
    inpRole.value = "cs";

    formTitle.textContent = "Tambah Pengguna Baru";
    textSubmit.textContent = "Simpan Pengguna";
    passHelp.classList.add('hidden');
    btnCancel.classList.add('hidden');

    alertError.classList.add('hidden');
}

// Global scope functions for onclick DOM bindings
window.editUser = function (id, username, role) {
    inpId.value = id;
    inpUsername.value = username;
    inpRole.value = role;
    inpPassword.value = "";
    inpPassword.required = false; // Optional password update

    formTitle.textContent = "Edit Pengguna";
    textSubmit.textContent = "Update Pengguna";
    passHelp.classList.remove('hidden');
    btnCancel.classList.remove('hidden');

    // Scroll smoothly to form
    document.getElementById('user-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.deleteUser = async function (id) {
    if (!ensureAdmin()) {
        showError("Akses ditolak. Hanya admin yang bisa menghapus pengguna.");
        return;
    }
    if (!confirm("Konfirmasi penghapusan pengguna ini? Tindakan ini tidak dapat dibatalkan.")) return;

    try {
        const payload = {
            action: "manageUser",
            manageAction: "delete",
            id: id
        };

        // Optimistic UI Removal
        tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4">Menghapus...</td></tr>';

        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();

        if (result.success) {
            showSuccess("Pengguna berhasil dihapus.");
            fetchUsers();
            if (inpId.value == id) resetForm();
        } else {
            showError(result.message || "Gagal menghapus pengguna.");
            fetchUsers();
        }
    } catch (e) {
        showError("Terjadi kesalahan jaringan saat menghapus.");
        fetchUsers();
    }
};

// Form Handlers
btnCancel.addEventListener('click', resetForm);

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!ensureAdmin()) {
        showError("Akses ditolak. Hanya admin yang bisa mengelola pengguna.");
        return;
    }
    setLoading(true);
    alertError.classList.add('hidden');
    alertSuccess.classList.add('hidden');

    const manageAction = inpId.value ? "edit" : "add";

    try {
        const payload = {
            action: "manageUser",
            manageAction: manageAction,
            id: inpId.value || undefined,
            username: inpUsername.value,
            password: inpPassword.value || undefined,
            role: inpRole.value
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            showSuccess(manageAction === "add" ? "Pengguna baru berhasil ditambahkan." : "Pengguna berhasil diperbarui.");
            resetForm();
            fetchUsers();
        } else {
            showError(result.message || "Gagal menyimpan pengguna.");
        }
    } catch (err) {
        showError("Terjadi kesalahan jaringan.");
    } finally {
        setLoading(false);
    }
});

// Init
fetchUsers();
