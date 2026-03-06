const API_URL = "https://script.google.com/macros/s/AKfycbwVR0p_Sc2sH-yA2zcCqLRh7SwqQeQYue-dmmxp-nWmR6yX_OgweCSlITCOnMxE366-0g/exec";

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const textLogin = document.getElementById('text-login');
const spinnerLogin = document.getElementById('spinner-login');
const errorAlert = document.getElementById('error-alert');

function showError(msg) {
    errorAlert.textContent = msg;
    errorAlert.classList.remove('hidden');
}

function hideError() {
    errorAlert.classList.add('hidden');
}

function setLoading(isLoading) {
    if (isLoading) {
        btnLogin.disabled = true;
        textLogin.textContent = "Signing in...";
        spinnerLogin.classList.remove('hidden');
    } else {
        btnLogin.disabled = false;
        textLogin.textContent = "Sign in";
        spinnerLogin.classList.add('hidden');
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    setLoading(true);

    const username = usernameInput.value;
    const password = passwordInput.value;

    try {
        const payload = { action: "login", username, password };
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success && result.user) {
            const targetUser = result.user;
            localStorage.setItem("pos_user", JSON.stringify(targetUser));

            if ((targetUser.role || '').toLowerCase() === "admin") {
                window.location.replace("admin-txn.html");
            } else {
                window.location.replace("index.html");
            }
        } else {
            showError(result.message || "Username atau password salah / Gagal mengambil data.");
        }
    } catch (err) {
        console.error("Login fetch error:", err);
        showError("Terjadi kesalahan koneksi. Pastikan script URL benar dan CORS diizinkan.");
    } finally {
        setLoading(false);
    }
});
