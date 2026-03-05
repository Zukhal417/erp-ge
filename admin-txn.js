const API_URL = "https://script.google.com/macros/s/AKfycbwVR0p_Sc2sH-yA2zcCqLRh7SwqQeQYue-dmmxp-nWmR6yX_OgweCSlITCOnMxE366-0g/exec";

// DOM
const searchInput = document.getElementById('search-input');
const dateInput = document.getElementById('date-input');
const tbody = document.getElementById('transactions-tbody');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const dataCount = document.getElementById('data-count');
const refreshIcon = document.getElementById('refresh-icon');

// Modal DOM
const editModal = document.getElementById('edit-modal');
const modalAlert = document.getElementById('modal-alert');
const btnSaveEdit = document.getElementById('btn-save-edit');
const textEdit = document.getElementById('text-edit');
const spinnerEdit = document.getElementById('spinner-edit');

// Edit Inputs
const eKodeTrx = document.getElementById('edit-kode-transaksi');
const modalTitleTrx = document.getElementById('modal-title-trx');
const eNama = document.getElementById('edit-nama');
const eTipeInput = document.getElementById('edit-tipe-input');
const eCs = document.getElementById('edit-cs');
const eProgram = document.getElementById('edit-program');
const eKeterangan = document.getElementById('edit-keterangan');
const eTotalLunas = document.getElementById('edit-total-lunas');
const ePembayaran = document.getElementById('edit-pembayaran');
const eSlisih = document.getElementById('edit-slisih');
const eTipePemby = document.getElementById('edit-tipe-pembayaran');
const eMetode = document.getElementById('edit-metode');

// State
let allTxns = [];
let filteredTxns = [];

// Auth Check
const userStr = localStorage.getItem("pos_user");
let isAdmin = false;

if (userStr) {
    try {
        const user = JSON.parse(userStr);
        isAdmin = (user.role || '').toLowerCase() === 'admin';
    } catch { }
}

if (!isAdmin) {
    const headerAksi = document.getElementById('header-aksi');
    if (headerAksi) headerAksi.style.display = 'none';
}

// Utils
function formatDateObj(dateStr) {
    if (!dateStr) return "-";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        const pad = n => n < 10 ? '0' + n : n;
        const yy = d.getFullYear(), mm = pad(d.getMonth() + 1), dd = pad(d.getDate());
        const hh = pad(d.getHours()), mn = pad(d.getMinutes());
        return {
            date: `${dd}-${mm}-${yy}`,
            time: `${hh}:${mn}`
        };
    } catch {
        return { date: "-", time: "-" };
    }
}

function getBadgeColor(type) {
    if (!type) return 'bg-gray-100 text-gray-700';
    const t = type.toLowerCase();
    if (t.includes('web')) return 'bg-purple-100 text-purple-700 border border-purple-200';
    if (t.includes('pelunasan')) return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    if (t.includes('tambahan')) return 'bg-amber-100 text-amber-700 border border-amber-200';
    if (t.includes('refund')) return 'bg-red-100 text-red-700 border border-red-200';
    return 'bg-blue-100 text-blue-700 border border-blue-200';
}

function formatRupiah(num) {
    return 'Rp ' + (Number(num) || 0).toLocaleString('id-ID');
}

// Fetch Logic
async function fetchTransactions() {
    refreshIcon.classList.add('animate-spin');
    tbody.innerHTML = '';
    loadingState.classList.remove('hidden');
    loadingState.classList.add('flex');
    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');
    dataCount.textContent = "Loading...";

    try {
        const payload = { action: "getTransactions" };
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success && result.data) {
            // Newest first
            allTxns = result.data.reverse();
            applyFilters();
        } else {
            console.error("Fetch returned false:", result);
            dataCount.textContent = "Gagal memuat Data";
        }
    } catch (e) {
        console.error("Fetch transactions error:", e);
        dataCount.textContent = "Error Jaringan";
    } finally {
        loadingState.classList.add('hidden');
        loadingState.classList.remove('flex');
        refreshIcon.classList.remove('animate-spin');

        if (allTxns.length === 0) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        }
    }
}

// Render Table
function renderTable() {
    tbody.innerHTML = '';

    if (filteredTxns.length === 0 && allTxns.length > 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-10 text-center text-gray-500">Pencarian tidak menemukan hasil.</td></tr>`;
        return;
    }

    filteredTxns.forEach((row, i) => {
        const fDto = formatDateObj(row["Time Stamp"] || row["Tanggal"]);
        const badgeClass = getBadgeColor(row["Tipe Input"]);

        const tr = document.createElement('tr');
        tr.className = "hover:bg-indigo-50/50 transition-colors group";

        // Render values safely
        const vTimeStamp = `
            <div class="font-medium text-gray-800">${fDto.date}</div>
            <div class="text-xs text-gray-500">${fDto.time}</div>
        `;
        const vCS = `<span class="inline-flex py-1 px-2.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">${row["CS"] || "-"}</span>`;

        const vMember = `
            <div class="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">${row["Nama"] || "-"}</div>
            <div class="text-xs font-mono text-gray-500 flex flex-col gap-0.5 mt-1">
                <span>ID: ${row["Nomor ID"] || "-"}</span>
                <span class="text-indigo-500">TRX: ${row["Kode Transaksi"] || "-"}</span>
            </div>
            <span class="mt-2 inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${badgeClass}">${row["Tipe Input"] || "-"}</span>
        `;

        const programLineArray = (row["Program"] || "-").split('\n');
        const vProgram = `
            <div class="text-sm text-gray-800 max-w-[250px] whitespace-pre-line leading-relaxed">${programLineArray.map(p => `• ${p}`).join('<br>')
            }</div>
        `;

        const vPembayaran = `
            <div class="flex flex-col gap-1">
                <div class="flex justify-between text-xs text-gray-500">
                    <span>Tagihan:</span> <span class="font-medium text-gray-700">${formatRupiah(row["Total Lunas"])}</span>
                </div>
                <div class="flex justify-between text-sm py-1 border-t border-b border-gray-100 my-1">
                    <span class="font-medium text-indigo-700">Bayar <span class="bg-indigo-100 text-indigo-800 px-1 rounded text-[10px]">${row["Metode Pembayaran"] || "-"}</span></span>
                    <span class="font-bold text-indigo-700">${formatRupiah(row["Pembayaran"])}</span>
                </div>
                <div class="flex justify-between text-xs text-gray-500">
                    <span>Sisa:</span> <span class="font-medium ${Number(row["Slisih"]) <= 0 ? 'text-green-600' : 'text-red-500'}">${formatRupiah(row["Slisih"])}</span>
                </div>
                ${row["Tipe Pembayaran"] && row["Tipe Pembayaran"] !== "-" ? `<span class="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded w-fit">${row["Tipe Pembayaran"]}</span>` : ""}
            </div>
        `;

        const vKeterangan = `
            <div class="text-sm text-gray-600 italic max-w-xs truncate" title="${row["Keterangan"] || "-"}">${row["Keterangan"] || "-"}</div>
        `;

        // Pass the row data encoded safely
        const safeRowObj = JSON.stringify(row).replace(/"/g, '&quot;');

        let vAksi = "";
        let tdAksi = "";

        if (isAdmin) {
            vAksi = `
                <div class="flex gap-2 justify-end">
                    <button type="button" onclick="openEditModal(${safeRowObj})" class="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors" title="Edit Transaksi">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button type="button" onclick="deleteTransaction('${row["Kode Transaksi"]}')" class="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors" title="Hapus Transaksi">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            tdAksi = `<td class="px-5 py-4 align-top w-24">${vAksi}</td>`;
        }

        tr.innerHTML = `
            <td class="px-5 py-4 align-top">${vTimeStamp}</td>
            <td class="px-5 py-4 align-top">${vCS}</td>
            <td class="px-5 py-4 align-top">${vMember}</td>
            <td class="px-5 py-4 align-top">${vProgram}</td>
            <td class="px-5 py-4 align-top w-56">${vPembayaran}</td>
            <td class="px-5 py-4 align-top w-48">${vKeterangan}</td>
            ${tdAksi}
        `;

        tbody.appendChild(tr);
    });

    // Run icon replacement off the main rendering thread to prevent lag
    requestAnimationFrame(() => {
        lucide.createIcons();
    });
}

function applyFilters() {
    const term = searchInput.value.toLowerCase();
    const ds = dateInput.value; // YYYY-MM-DD



    filteredTxns = allTxns.filter(row => {
        let matchTerm = true;
        let matchDate = true;

        if (term) {
            const vals = [
                row["Nama"],
                row["Nomor ID"],
                row["Kode Transaksi"],
                row["Keterangan"],
                row["CS"]
            ].map(v => String(v || "").toLowerCase());

            matchTerm = vals.some(v => v.includes(term));
        }

        if (ds) {
            matchDate = false;
            const tgl = row["Tanggal"] || row["Time Stamp"];
            if (tgl) {
                const rowDate = new Date(tgl);
                if (!isNaN(rowDate.getTime())) {
                    const py = rowDate.getFullYear();
                    const pm = String(rowDate.getMonth() + 1).padStart(2, '0');
                    const pd = String(rowDate.getDate()).padStart(2, '0');
                    const rowDateStr = `${py}-${pm}-${pd}`;
                    matchDate = (rowDateStr === ds);
                }
            }
        }

        return matchTerm && matchDate;
    });

    dataCount.textContent = `Total Filtered: ${filteredTxns.length} / ${allTxns.length}`;
    renderTable();
}

// Bindings
searchInput.addEventListener('input', applyFilters);
dateInput.addEventListener('change', applyFilters);

// CRUD Actions
window.openEditModal = function (row) {
    if (!row || !row["Kode Transaksi"]) {
        alert("Data transaksi tidak valid.");
        return;
    }

    // Populate Form
    eKodeTrx.value = row["Kode Transaksi"];
    modalTitleTrx.textContent = row["Kode Transaksi"];
    eNama.value = row["Nama"] || "";
    eTipeInput.value = row["Tipe Input"] || "Validasi Web";
    eCs.value = row["CS"] || "";
    eProgram.value = row["Program"] || "";
    eKeterangan.value = row["Keterangan"] || "";

    eTotalLunas.value = row["Total Lunas"] || 0;
    ePembayaran.value = row["Pembayaran"] || 0;
    eSlisih.value = row["Slisih"] || 0;

    if (row["Tipe Pembayaran"]) eTipePemby.value = row["Tipe Pembayaran"];
    if (row["Metode Pembayaran"]) eMetode.value = row["Metode Pembayaran"];

    modalAlert.classList.add('hidden');
    editModal.classList.remove('hidden');
    lucide.createIcons();
};

window.closeEditModal = function () {
    editModal.classList.add('hidden');
};

window.calculateEditSisa = function () {
    const lunas = Number(eTotalLunas.value) || 0;
    const bayar = Number(ePembayaran.value) || 0;
    eSlisih.value = lunas - bayar;
};

window.submitEditTransaction = async function () {
    const kodeTrx = eKodeTrx.value;
    if (!kodeTrx) return;

    modalAlert.classList.add('hidden');
    btnSaveEdit.disabled = true;
    textEdit.textContent = "Menyimpan...";
    spinnerEdit.classList.remove('hidden');

    try {
        const payload = {
            action: "updateTransaction",
            kodeTransaksi: kodeTrx,
            updatedData: {
                "Tipe Input": eTipeInput.value,
                "Program": eProgram.value,
                "Total Lunas": eTotalLunas.value,
                "Pembayaran": ePembayaran.value,
                "Slisih": eSlisih.value,
                "Tipe Pembayaran": eTipePemby.value,
                "Metode Pembayaran": eMetode.value,
                "Keterangan": eKeterangan.value
            }
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            closeEditModal();
            fetchTransactions(); // Reload data
        } else {
            modalAlert.textContent = result.message || "Gagal memperbarui transaksi.";
            modalAlert.className = "mb-4 p-3 rounded text-sm font-medium border-l-4 bg-red-50 text-red-700 border-red-500 block";
        }
    } catch (err) {
        modalAlert.textContent = "Terjadi kesalahan koneksi ke server.";
        modalAlert.className = "mb-4 p-3 rounded text-sm font-medium border-l-4 bg-red-50 text-red-700 border-red-500 block";
    } finally {
        btnSaveEdit.disabled = false;
        textEdit.textContent = "Simpan Perubahan";
        spinnerEdit.classList.add('hidden');
    }
};

window.deleteTransaction = async function (kodeTrx) {
    if (!kodeTrx) return;
    if (!confirm(`Konfirmasi menghapus transaksi ${kodeTrx}? Data yang terhapus tidak bisa dikembalikan.`)) return;

    refreshIcon.classList.add('animate-spin');

    try {
        const payload = {
            action: "deleteTransaction",
            kodeTransaksi: kodeTrx
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            fetchTransactions();
        } else {
            alert(result.message || "Gagal menghapus transaksi.");
            refreshIcon.classList.remove('animate-spin');
        }
    } catch (err) {
        alert("Terjadi kesalahan jaringan.");
        refreshIcon.classList.remove('animate-spin');
    }
};

// Initial Load
fetchTransactions();
