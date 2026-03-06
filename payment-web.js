const API_URL = "https://script.google.com/macros/s/AKfycbwVR0p_Sc2sH-yA2zcCqLRh7SwqQeQYue-dmmxp-nWmR6yX_OgweCSlITCOnMxE366-0g/exec";

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function toSafeHttpUrl(value) {
    if (!value) return "";
    try {
        const parsed = new URL(String(value), window.location.origin);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return parsed.href;
        }
    } catch { }
    return "";
}

// DOM
const tbody = document.getElementById('payment-tbody');
const searchInput = document.getElementById('search-input');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const dataCount = document.getElementById('data-count');
const refreshIcon = document.getElementById('refresh-icon');

// State
let allData = [];
let filteredData = [];

// Format Date string
function formatShortDate(dateStr) {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const yy = d.getFullYear(), mm = months[d.getMonth()], dd = d.getDate();
        return `${dd < 10 ? '0' + dd : dd} ${mm} ${yy}`;
    } catch {
        return "-";
    }
}

// Format IDR
function formatRupiah(num) {
    return 'Rp ' + (Number(num) || 0).toLocaleString('id-ID');
}

// Fetch Logic
async function fetchPaymentData() {
    refreshIcon.classList.add('animate-spin');
    tbody.innerHTML = '';
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    dataCount.textContent = "Loading...";

    try {
        const payload = { action: "getRawData", sheetName: "Data Payment" };
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success && result.data) {
            allData = result.data.reverse(); // newest first
            applyFilter();
        } else {
            console.error("Fetch returned false", result);
            dataCount.textContent = "Gagal memuat Data";
        }
    } catch (e) {
        console.error("Fetch Data Payment error:", e);
        dataCount.textContent = "Error Jaringan";
    } finally {
        loadingState.classList.add('hidden');
        refreshIcon.classList.remove('animate-spin');

        if (allData.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        }
    }
}

// Render Logic
function renderTable() {
    tbody.innerHTML = '';

    if (filteredData.length === 0 && allData.length > 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Pencarian tidak menemukan hasil.</td></tr>`;
        return;
    }

    // Limit to 100 for performance like original
    const toRender = filteredData.slice(0, 100);

    toRender.forEach((row) => {
        const tr = document.createElement('tr');
        tr.className = "border-b last:border-0 hover:bg-gray-50 transition-colors";

        const orderDate = formatShortDate(row["Order Date"]);
        const orderNum = row["Order Number"] || "-";
        const nama = row["Nama Lengkap"] || row["Name"] || "-";

        let programStr = `<div class="text-xs font-semibold text-gray-700">${escapeHtml(row["Item Name"] || "-")}</div>`;
        if (row["Penjemputan Dari"] && row["Penjemputan Dari"] !== "-") {
            programStr += `<div class="text-xs text-blue-600 font-medium mt-1">+ Jemput ${escapeHtml(row["Penjemputan Dari"])}</div>`;
        }

        const totalBayar = formatRupiah(row["Total Bayar"]);
        const buktiUrl = toSafeHttpUrl(row["Bukti Transfer"] || row["Bukti"]);
        const buktiStr = buktiUrl
            ? `<a href="${escapeHtml(buktiUrl)}" target="_blank" rel="noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded w-fit"><i data-lucide="image" class="w-4 h-4"></i> Lihat Foto</a>`
            : `<span class="text-gray-400 bg-gray-100 px-2 py-1 rounded">Belum ada</span>`;

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-gray-600">${escapeHtml(orderDate)}</td>
            <td class="px-6 py-4 font-mono font-bold text-indigo-600 whitespace-nowrap">${escapeHtml(orderNum)}</td>
            <td class="px-6 py-4 font-bold text-gray-800">${escapeHtml(nama)}</td>
            <td class="px-6 py-4">${programStr}</td>
            <td class="px-6 py-4 font-bold text-emerald-600 whitespace-nowrap">${totalBayar}</td>
            <td class="px-6 py-4 text-xs">${buktiStr}</td>
        `;

        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

function applyFilter() {
    const term = searchInput.value.toLowerCase();

    filteredData = allData.filter(row => {
        if (!term) return true;
        const vals = [
            row["Order Number"],
            row["Nama Lengkap"],
            row["Name"]
        ].map(v => String(v || "").toLowerCase());

        return vals.some(v => v.includes(term));
    });

    dataCount.textContent = `Total Data: ${filteredData.length}${filteredData.length > 100 ? ' (Menampilkan 100)' : ''}`;
    renderTable();
}

// Bindings
searchInput.addEventListener('input', applyFilter);

// Init
fetchPaymentData();
