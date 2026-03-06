// Configuration
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

// DOM Elements
const elements = {
    typeSelectorContainer: document.getElementById('type-selector-container'),

    errorNotif: document.getElementById('error-notification'),
    errorMsg: document.getElementById('error-message'),
    successNotif: document.getElementById('success-notification'),
    successMsg: document.getElementById('success-message'),

    nomorID: document.getElementById('nomorID'),
    nama: document.getElementById('nama'),
    btnCariID: document.getElementById('btn-cari-id'),
    spinnerCariID: document.getElementById('spinner-cari-id'),
    textCariID: document.getElementById('text-cari-id'),
    btnCariNama: document.getElementById('btn-cari-nama'),
    spinnerCariNama: document.getElementById('spinner-cari-nama'),
    textCariNama: document.getElementById('text-cari-nama'),

    kodeTransaksiContainer: document.getElementById('kode-transaksi-container'),
    kodeTransaksiText: document.getElementById('kode-transaksi-text'),

    buktiTransferContainer: document.getElementById('bukti-transfer-container'),
    buktiTransferLink: document.getElementById('bukti-transfer-link'),
    buktiTransferImg: document.getElementById('bukti-transfer-img'),
    buktiTransferTextLink: document.getElementById('bukti-transfer-text-link'),

    tanggal: document.getElementById('tanggal'),
    jam: document.getElementById('jam'),

    statusPelunasanContainer: document.getElementById('status-pelunasan-container'),
    tipePelunasan: document.getElementById('tipePelunasan'),

    selectedProgramsContainer: document.getElementById('selected-programs-container'),
    addProgramContainer: document.getElementById('add-program-container'),
    kelasSelect: document.getElementById('kelasSelect'),

    keterangan: document.getElementById('keterangan'),

    merchWisataContainer: document.getElementById('merch-wisata-container'),
    merch: document.getElementById('merch'),
    wisata: document.getElementById('wisata'),

    lunas: document.getElementById('lunas'),
    diskon: document.getElementById('diskon'),

    paymentsContainer: document.getElementById('payments-container'),
    btnAddPayment: document.getElementById('btn-add-payment'),

    refundInputsContainer: document.getElementById('refund-inputs-container'),
    totalRefund: document.getElementById('totalRefund'),
    paymentRefund: document.getElementById('paymentRefund'),

    sisaTagihanText: document.getElementById('sisa-tagihan-text'),

    posForm: document.getElementById('pos-form'),
    btnSubmit: document.getElementById('btn-submit'),
    iconSubmitIdle: document.getElementById('icon-submit-idle'),
    iconSubmitLoading: document.getElementById('icon-submit-loading'),
    textSubmit: document.getElementById('text-submit'),

    invoiceModal: document.getElementById('invoice-modal'),
    printableInvoice: document.getElementById('printable-invoice'),
    btnCloseInvoice: document.getElementById('btn-close-invoice'),
};

// Initial State
let isFetchingData = false;
let isLoading = false;
let caches = { validasi: [], payment: [], transactions: [], programs: [] };

let formData = {
    inputType: "Validasi Web",
    nomorID: "",
    nama: "",
    tanggal: new Date().toISOString().split('T')[0],
    jam: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'),

    payments: [{ amount: 0, method: "BNI GE" }],

    tipePelunasan: "-",
    kelas: [],
    keterangan: "",
    kodeTransaksi: "",
    merch: "",
    wisata: "-",

    // Phase 5 specific
    penjemputanAsal: "-",
    penjemputanQty: 1,
    penjemputanDari: "",
    hargaPenjemputan: 0,
    jmlOrang: 1,
    itemCost: 0,
    totalBayarWeb: 0,
    isTransaksiWeb: false,

    lunas: 0,
    diskon: 0,

    totalRefund: 0,
    paymentRefund: 0,
    buktiTransferUrl: "",
};


// Set Date Default
elements.tanggal.value = formData.tanggal;
elements.jam.value = formData.jam;

// Load Dropdown Options
function loadPrograms() {
    elements.kelasSelect.innerHTML = '<option value="" disabled selected>+ Tambah Program / Kelas</option>';
    caches.programs.forEach(prog => {
        const option = document.createElement('option');
        option.value = prog.nama;
        option.textContent = `${prog.nama} (Rp ${Number(prog.harga).toLocaleString("id-ID")})`;
        elements.kelasSelect.appendChild(option);
    });
}

// Utility API Call Function
async function fetchDataFromAppScript(payload) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow', // Make sure to follow gas redirects
            headers: {
                // To avoid strictly CORS preflight failure, usually text/plain is safer for GAS direct fetching if simple
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        return result;
    } catch (e) {
        console.error('Fetch error:', e);
        throw e;
    }
}

// Initialization - Fetch Caches
async function initCaches() {
    const badge = document.getElementById('global-sync-badge');
    try {
        if (badge) {
            badge.className = "flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100 shadow-sm transition-opacity duration-500 opacity-100";
            badge.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>Menyinkronkan Server...</span>';
            lucide.createIcons();
        }

        // Parallel requests using the generic fetch helper above
        const [resV, resProg, resTxn] = await Promise.all([
            fetchDataFromAppScript({ action: "getRawData", sheetName: "Data Validasi" }).catch(() => ({ success: false })),
            fetchDataFromAppScript({ action: "getPrograms" }).catch(() => ({ success: false })),
            fetchDataFromAppScript({ action: "getTransactions" }).catch(() => ({ success: false }))
        ]);

        if (resV?.success) caches.validasi = resV.data;
        if (resProg?.success) {
            caches.programs = resProg.data;
            loadPrograms();
        }
        if (resTxn?.success) caches.transactions = resTxn.data;

        if (badge) {
            badge.className = "flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-100 shadow-sm transition-opacity duration-1000 opacity-100";
            badge.innerHTML = '<i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>Tersinkronisasi</span>';
            lucide.createIcons();
            setTimeout(() => {
                badge.classList.add('opacity-0', 'pointer-events-none');
            }, 3000);
        }

    } catch (e) {
        console.error("Failed to load local DB cache", e);
        if (badge) {
            badge.className = "flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-semibold border border-red-100 shadow-sm transition-opacity duration-500 opacity-100";
            badge.innerHTML = '<i data-lucide="alert-circle" class="w-3.5 h-3.5"></i><span>Gagal Sinkronisasi</span>';
            lucide.createIcons();
        }
    }
}

// Generate Kode Transaksi
async function generateKodeTransaksi(type, id) {
    const prefixMap = {
        "Validasi Web": "GEV",
        "Tambahan": "GET",
        "Refund": "GER",
    };
    const prefix = prefixMap[type] || "GE";
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const userIDRaw = id || "0000";

    if (type === "Pelunasan") {
        try {
            const res = await fetchDataFromAppScript({ action: "getLatestKode", prefix: "GEP" });
            if (res && res.success && res.kode) {
                return res.kode;
            }
        } catch (e) {
            console.error("Failed to fetch latest kode for Pelunasan", e);
        }
        // Fallback if offline
        return `GEP-${yy}${mm}-${dd}-${Math.floor(Math.random() * 9000) + 1000}`; // Random fallback to prevent clashing
    }

    if (type === "Validasi Web" && String(userIDRaw).startsWith("GE-")) {
        // the user wants GE-2603040001 to become GEV-2603-040001
        // Parse the GE- number string
        const numStr = String(userIDRaw).substring(3); // "2603040001"
        if (numStr.length >= 8) {
            const dateStr = numStr.substring(0, 4); // "2603"
            const restStr = numStr.substring(4); // "040001"
            return `GEV-${dateStr}-${restStr}`;
        }
    }

    return `${prefix}-${yy}${mm}-${dd}-${userIDRaw}`;
}

// Render Type Selector
function renderTypeSelector() {
    elements.typeSelectorContainer.innerHTML = '';
    const types = ["Validasi Web", "Tambahan", "Pelunasan", "Refund"];
    const colors = {
        "Validasi Web": "bg-purple-600 border-purple-600",
        "Pelunasan": "bg-emerald-700 border-emerald-700",
        "Tambahan": "bg-amber-500 border-amber-500 text-amber-900",
        "Refund": "bg-red-600 border-red-600",
    };

    types.forEach(type => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = type;

        let finalClass = "";
        const activeClass = formData.inputType === type
            ? `${colors[type]} text-white shadow-md`
            : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-gray-200";

        finalClass = (formData.inputType === type && type === "Tambahan")
            ? "bg-amber-500 border-amber-500 text-white shadow-md"
            : activeClass;

        btn.className = `px-6 py-2.5 rounded-lg font-semibold text-sm transition-all border ${finalClass}`;

        btn.addEventListener('click', async () => {
            formData.inputType = type;
            if (formData.nomorID) {
                elements.kodeTransaksiText.innerHTML = '<span class="text-indigo-300 italic">Generate Kode...</span>';
                formData.kodeTransaksi = await generateKodeTransaksi(type, formData.nomorID);
            }
            renderUI();
        });

        elements.typeSelectorContainer.appendChild(btn);
    });
}

// Calculate Sisa
function calculateSisa() {
    const sumPayments = formData.payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const sisa = (Number(formData.lunas) || 0) - (Number(formData.diskon) || 0) - sumPayments;
    return Math.max(0, sisa);
}

// Rendering UI Function
function renderUI() {
    renderTypeSelector();

    // Update inputs with state
    elements.nomorID.value = formData.nomorID;
    elements.nama.value = formData.nama;
    elements.tanggal.value = formData.tanggal;
    elements.jam.value = formData.jam;
    elements.merch.value = formData.merch;
    elements.wisata.value = formData.wisata;
    elements.keterangan.value = formData.keterangan;
    elements.lunas.value = formData.lunas === 0 ? '' : formData.lunas;
    elements.diskon.value = formData.diskon === 0 ? '' : formData.diskon;
    elements.totalRefund.value = formData.totalRefund;
    elements.paymentRefund.value = formData.paymentRefund;
    elements.tipePelunasan.value = formData.tipePelunasan;

    // Notifications mapping
    if (formData.buktiTransferUrl) {
        const safeTransferUrl = toSafeHttpUrl(formData.buktiTransferUrl);
        if (!safeTransferUrl) {
            elements.buktiTransferContainer.classList.add('hidden');
        } else {
            elements.buktiTransferContainer.classList.remove('hidden');
            elements.buktiTransferImg.src = safeTransferUrl;
            elements.buktiTransferLink.href = safeTransferUrl;
            elements.buktiTransferTextLink.href = safeTransferUrl;
        }
    } else {
        elements.buktiTransferContainer.classList.add('hidden');
    }

    if (formData.inputType === "Validasi Web" || formData.kodeTransaksi) {
        elements.kodeTransaksiContainer.classList.remove('hidden');
        elements.kodeTransaksiContainer.classList.add('flex');
        if (formData.kodeTransaksi) {
            elements.kodeTransaksiText.textContent = formData.kodeTransaksi;
        } else {
            elements.kodeTransaksiText.innerHTML = '<span class="text-indigo-300 italic">Menunggu Cari Data...</span>';
        }
    } else {
        elements.kodeTransaksiContainer.classList.add('hidden');
        elements.kodeTransaksiContainer.classList.remove('flex');
    }

    // Program Visibility rules based on type
    if (formData.inputType === 'Pelunasan') {
        elements.statusPelunasanContainer.classList.remove('hidden');
    } else {
        elements.statusPelunasanContainer.classList.add('hidden');
    }

    if (formData.inputType !== 'Validasi Web') {
        elements.addProgramContainer.classList.remove('hidden');
    } else {
        elements.addProgramContainer.classList.add('hidden');
    }

    if (formData.inputType !== "Tambahan" && formData.inputType !== "Pelunasan") {
        elements.merchWisataContainer.classList.remove('hidden');
    } else {
        elements.merchWisataContainer.classList.add('hidden');
    }

    if (formData.inputType === "Refund") {
        elements.refundInputsContainer.classList.remove('hidden');
        elements.refundInputsContainer.classList.add('grid');
    } else {
        elements.refundInputsContainer.classList.add('hidden');
        elements.refundInputsContainer.classList.remove('grid');
    }

    // Render Selected Programs 
    elements.selectedProgramsContainer.innerHTML = '';
    formData.kelas.forEach((prog, idx) => {
        const div = document.createElement('div');
        div.className = "flex items-center gap-1 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium";

        const span = document.createElement('span');
        span.textContent = prog;
        div.appendChild(span);

        if (formData.inputType !== "Validasi Web") {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = "hover:bg-indigo-200 rounded-full p-0.5 ml-1 flex items-center justify-center";
            btn.innerHTML = `<i data-lucide="x" class="w-3.5 h-3.5"></i>`;
            btn.addEventListener('click', () => {
                // remove program
                formData.kelas.splice(idx, 1);
                // recalculate lunas
                const foundProg = caches.programs.find(p => p.nama === prog);
                const subPrice = foundProg ? Number(foundProg.harga) : 0;
                formData.lunas = Math.max(0, formData.lunas - subPrice);
                renderUI();
            });
            div.appendChild(btn);
        }

        elements.selectedProgramsContainer.appendChild(div);
    });

    if (formData.kelas.length === 0) {
        elements.selectedProgramsContainer.innerHTML = '<span class="text-gray-400 text-sm italic">Belum ada program dipilih</span>';
    }

    // Render Payments Row
    elements.paymentsContainer.innerHTML = '';
    formData.payments.forEach((payment, idx) => {
        const row = document.createElement('div');
        row.className = "flex gap-2 relative";

        // Select Make
        const select = document.createElement('select');
        select.className = "block w-1/3 px-3 py-3 border-2 border-indigo-200 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:ring-indigo-500";
        ['CASH', 'BNI GE', 'BRI GE', 'QRIS BRI GE', 'QRIS Mandiri GE', 'Mandiri KB', 'QRIS Mandiri KB', 'BRI KB', 'QRIS BRI KB'].forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            if (m === payment.method) opt.selected = true;
            select.appendChild(opt);
        });
        select.addEventListener('change', (e) => {
            formData.payments[idx].method = e.target.value;
        });

        // Input Wrapper
        const inputWrap = document.createElement('div');
        inputWrap.className = 'relative flex-grow';
        const spanPrefix = document.createElement('span');
        spanPrefix.className = "absolute left-4 top-3 text-indigo-700 font-bold text-xl";
        spanPrefix.textContent = 'Rp';

        const input = document.createElement('input');
        input.type = 'number';
        input.value = payment.amount === 0 ? '' : payment.amount;
        input.className = "block w-full pl-12 pr-4 py-3 border-2 border-indigo-400 rounded-lg text-xl font-bold bg-white focus:ring-4 focus:ring-indigo-100 text-indigo-900 transition-all shadow-sm";
        input.placeholder = "0";
        input.required = true;
        input.addEventListener('input', (e) => {
            formData.payments[idx].amount = e.target.value === '' ? '' : Number(e.target.value);
            renderCalculations();
        });

        inputWrap.appendChild(spanPrefix);
        inputWrap.appendChild(input);

        row.appendChild(select);
        row.appendChild(inputWrap);

        if (formData.payments.length > 1) {
            const btnRemove = document.createElement('button');
            btnRemove.type = 'button';
            btnRemove.className = "text-red-400 hover:text-red-600 p-2 flex items-center";
            btnRemove.innerHTML = `<i data-lucide="x" class="w-5 h-5"></i>`;
            btnRemove.addEventListener('click', () => {
                formData.payments.splice(idx, 1);
                renderUI();
            });
            row.appendChild(btnRemove);
        }

        elements.paymentsContainer.appendChild(row);
    });

    lucide.createIcons();
    renderCalculations();
}

function renderCalculations() {
    const sisa = calculateSisa();
    elements.sisaTagihanText.textContent = `Rp ${sisa.toLocaleString('id-ID')}`;
    if (sisa <= 0) {
        elements.sisaTagihanText.classList.replace('text-red-500', 'text-green-600');
    } else {
        elements.sisaTagihanText.classList.replace('text-green-600', 'text-red-500');
    }
}

// Show Alerts
function showSuccess(msg) {
    elements.successNotif.classList.remove('hidden');
    elements.successNotif.classList.add('flex');
    elements.successMsg.textContent = msg;
    elements.errorNotif.classList.add('hidden');
    elements.errorNotif.classList.remove('flex');
}
function showError(msg) {
    elements.errorNotif.classList.remove('hidden');
    elements.errorNotif.classList.add('flex');
    elements.errorMsg.textContent = msg;
    elements.successNotif.classList.add('hidden');
    elements.successNotif.classList.remove('flex');
}

// Listeners for standard inputs
const bindings = ['nomorID', 'nama', 'tanggal', 'jam', 'merch', 'wisata', 'keterangan', 'tipePelunasan', 'lunas', 'diskon', 'totalRefund', 'paymentRefund'];
bindings.forEach(id => {
    elements[id].addEventListener('input', (e) => {
        let val = e.target.value;
        if (id === 'lunas' || id === 'diskon' || id === 'totalRefund' || id === 'paymentRefund') {
            val = val === '' ? 0 : Number(val);
        }
        formData[id] = val;

        if (id === 'lunas' || id === 'diskon') {
            renderCalculations();
        }
    });
});

elements.kelasSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
        const found = caches.programs.find(p => p.nama === val);
        if (found) {
            formData.kelas.push(val);
            formData.lunas += Number(found.harga);
        }
        e.target.value = "";
        renderUI();
    }
});

elements.btnAddPayment.addEventListener('click', () => {
    formData.payments.push({ amount: 0, method: "BNI GE" });
    renderUI();
});

// Event Cari Data
async function handleCariData() {
    if (!formData.nomorID && !formData.nama) {
        showError("Masukkan ID atau Nama terlebih dahulu.");
        return;
    }

    isFetchingData = true;
    elements.spinnerCariID.classList.remove('hidden');
    elements.spinnerCariNama.classList.remove('hidden');
    elements.errorNotif.classList.add('hidden');
    elements.successNotif.classList.add('hidden');

    try {
        const q = (formData.nomorID || formData.nama).toLowerCase();
        let foundData = null;
        let source = "";

        if (formData.inputType === "Validasi Web" || formData.inputType === "Tambahan") {
            source = "Data Payment";
            if (caches.payment.length === 0) {
                const res = await fetchDataFromAppScript({ action: "getRawData", sheetName: "Data Payment" });
                if (res.success) caches.payment = res.data;
            }
            const dataV = caches.payment;
            for (let i = dataV.length - 1; i >= 0; i--) {
                const r = dataV[i];
                if (String(r["Order Number"] || "").toLowerCase() === q || String(r["Name"] || r["Nama Lengkap"] || "").toLowerCase().includes(q)) {
                    foundData = r; break;
                }
            }
        } else {
            // Pelunasan, Refund -> all read from Transaksi history
            source = "Transaksi";
            if (caches.transactions.length === 0) {
                const res = await fetchDataFromAppScript({ action: "getRawData", sheetName: "Transaksi" });
                if (res?.success) caches.transactions = res.data;
            }
            const dataV = caches.transactions;
            for (let i = dataV.length - 1; i >= 0; i--) {
                const r = dataV[i];
                // Support searching by ID, Nama, or Kode Transaksi
                if (String(r["Nomor ID"] || "").toLowerCase() === q || String(r["Nama"] || "").toLowerCase().includes(q) || String(r["Kode Transaksi"] || "").toLowerCase() === q) {
                    foundData = r; break;
                }
            }
        }

        if (foundData) {
            const d = foundData;
            const rawId = d["User ID"] || d["Nomor ID"] || d["Order Number"] || "0000";
            const generatedKode = await generateKodeTransaksi(formData.inputType, rawId);

            if (formData.inputType === "Validasi Web" || formData.inputType === "Tambahan") {
                const hrgJpt = Number(d["Harga Penjemputan"]) || 0;
                const jml = Number(d["Jml Orang"]) || 1;
                const cost = Number(d["Item Cost"]) || 0;
                const totalHp = cost + (hrgJpt * jml);

                formData.nomorID = d["Order Number"] || formData.nomorID;
                formData.nama = d["Nama Lengkap"] || d["Name"] || formData.nama;
                formData.lunas = totalHp > 0 ? totalHp : (Number(d["Total Bayar"]) || formData.lunas);
                formData.kelas = d["Item Name"] ? [d["Item Name"]] : formData.kelas;
                formData.merch = d["Merchandise"] || formData.merch;
                formData.wisata = d["Pilihan Wisata"] || formData.wisata;
                formData.buktiTransferUrl = d["Bukti Transfer"] || d["Bukti"] || "";

                // Specific fields 
                formData.penjemputanDari = d["Penjemputan Dari"] || formData.penjemputanDari;
                formData.hargaPenjemputan = hrgJpt;
                formData.jmlOrang = jml;
                formData.itemCost = cost;
                formData.totalBayarWeb = Number(d["Total Bayar"]) || 0;
                formData.isTransaksiWeb = formData.inputType === "Validasi Web"; // Tambahan is essentially manual
                formData.kodeTransaksi = generatedKode;

                showSuccess(`Data ditemukan di ${source}!`);
            } else {
                // Pelunasan, Refund mapping from Transaksi
                const sisa = Number(d["Slisih"]);
                const tl = (sisa > 0 && !isNaN(sisa)) ? sisa : Number(d["Total Lunas"]);

                formData.nomorID = d["Nomor ID"] || formData.nomorID;
                formData.nama = d["Nama"] || formData.nama;
                formData.lunas = tl || formData.lunas;

                const progLines = String(d["Program"] || "").split("\n").filter(p => !!p);
                formData.kelas = progLines.length > 0 ? progLines : formData.kelas;

                formData.merch = ""; // Reset or read if you store it
                formData.wisata = "-";
                formData.kodeTransaksi = generatedKode;

                showSuccess(`Data ditemukan berdasarkan riwayat Transaksi!`);
            }
            renderUI();
        } else {
            showError(`Data tidak ditemukan di ${source}.`);
        }
    } catch {
        showError("Terjadi kesalahan saat mencari data lokal / server.");
    } finally {
        isFetchingData = false;
        elements.spinnerCariID.classList.add('hidden');
        elements.spinnerCariNama.classList.add('hidden');
    }
}

elements.btnCariID.addEventListener('click', handleCariData);
elements.btnCariNama.addEventListener('click', handleCariData);

// Form Submit
elements.posForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isLoading) return;
    isLoading = true;

    elements.iconSubmitIdle.classList.add('hidden');
    elements.iconSubmitLoading.classList.remove('hidden');
    elements.textSubmit.textContent = "Menyimpan & Mengirim...";
    elements.btnSubmit.classList.add('opacity-70', 'cursor-not-allowed');

    const sumPayments = formData.payments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    if (!formData.nomorID || !formData.nama || !formData.tanggal || sumPayments <= 0) {
        showError("Mohon lengkapi ID, Nama, Tanggal, dan Nominal Payment saat ini.");
        resetLoading();
        return;
    }

    try {
        const safeUser = window.getAuthenticatedUser ? window.getAuthenticatedUser() : null;
        const csName = safeUser?.username || "Unknown (HTML)";

        const timestamp = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
        const [yyyy, mm, dd] = formData.tanggal.split('-');
        const simpleDateStr = `${dd}/${mm}/${yyyy}`; // Format DD/MM/YYYY

        const sisa = calculateSisa();

        let pString = "";
        if (formData.penjemputanAsal && formData.penjemputanAsal !== "-") {
            pString = `Penjemputan ${formData.penjemputanAsal} - ${formData.penjemputanQty} Orang`;
        }

        const progDataArr = [...formData.kelas, formData.merch, pString, formData.wisata];
        const programData = progDataArr.filter(i => i && i !== "-" && i !== "").join("\n");

        const cleanedDataArray = [];

        formData.payments.forEach((paymentObj, idx) => {
            const isFirst = idx === 0;
            cleanedDataArray.push([
                formData.kodeTransaksi || formData.nomorID,
                timestamp,
                simpleDateStr,
                formData.jam,
                csName,
                formData.inputType,
                formData.nomorID,
                formData.nama,
                programData,
                formData.lunas || 0,
                Number(paymentObj.amount) || 0,
                isFirst ? sisa : 0,
                formData.tipePelunasan || "-",
                paymentObj.method,
                formData.keterangan || "-"
            ]);
        });

        const finalPayload = {
            action: "submit",
            inputType: formData.inputType,
            nomorID: formData.nomorID,
            cleanedDataArray: cleanedDataArray,
        };

        // POST to direct GAS Endpoint
        const response = await fetch(API_URL, {
            method: 'POST',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(finalPayload)
        });

        const resParsed = await response.json();
        if (resParsed.success) {
            showSuccess("Data berhasil disimpan!");
            generateInvoiceHTML(formData); // Show invoice
            resetForm();
        } else {
            showError("Gagal menyimpan: " + (resParsed.message || "Unknown error"));
        }
    } catch (e) {
        showError("Gagal menyimpan transaksi. Silakan cek koneksi dan coba lagi.");
    } finally {
        resetLoading();
    }
});

function resetLoading() {
    isLoading = false;
    elements.iconSubmitIdle.classList.remove('hidden');
    elements.iconSubmitLoading.classList.add('hidden');
    elements.textSubmit.textContent = "Submit Transaksi";
    elements.btnSubmit.classList.remove('opacity-70', 'cursor-not-allowed');
}

function resetForm() {
    const defaultDate = new Date().toISOString().split('T')[0];
    const defaultTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

    formData = {
        inputType: "Validasi Web",
        nomorID: "",
        nama: "",
        tanggal: defaultDate,
        jam: defaultTime,
        payments: [{ amount: 0, method: "BNI GE" }],
        tipePelunasan: "-",
        kelas: [],
        keterangan: "",
        kodeTransaksi: "",
        merch: "",
        wisata: "-",
        penjemputanAsal: "-",
        penjemputanQty: 1,
        penjemputanDari: "",
        hargaPenjemputan: 0,
        jmlOrang: 1,
        itemCost: 0,
        totalBayarWeb: 0,
        isTransaksiWeb: false,
        lunas: 0,
        diskon: 0,
        totalRefund: 0,
        paymentRefund: 0,
        buktiTransferUrl: "",
    };
    renderUI();
}

// ---- Invoice Generation Module ----
function generateInvoiceHTML(data) {
    const paymentMethods = data.payments.map(p => p.method).join(" + ");

    // Auto format date text to indonesian format (e.g., 20 September 2024)
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const dateObj = new Date(data.tanggal);
    const dateFormatted = isNaN(dateObj) ? data.tanggal : dateObj.toLocaleDateString('id-ID', options);

    // Programs List computation
    const progArr = [];
    if (data.kelas.length > 0) progArr.push({ desc: data.kelas.join(', '), qty: data.jmlOrang > 0 ? data.jmlOrang : 1, price: "" }); // Price left blank because bundled
    if (data.merch && data.merch !== "-") progArr.push({ desc: `Merchandise: ${data.merch}`, qty: 1, price: "" });
    if (data.wisata && data.wisata !== "-") progArr.push({ desc: `Pilihan Wisata: ${data.wisata}`, qty: 1, price: "" });
    if (data.penjemputanAsal && data.penjemputanAsal !== "-") {
        progArr.push({ desc: `Penjemputan: ${data.penjemputanAsal}`, qty: data.penjemputanQty, price: "" }); // Bundle pricing
    }

    let itemsHTML = '';
    progArr.forEach((item, idx) => {
        const bgClass = idx % 2 === 0 ? "bg-white" : "bg-sky-50";
        itemsHTML += `
            <tr class="${bgClass} text-center text-sm font-semibold text-gray-700">
                <td class="py-4 px-2 border-r border-white">${String(idx + 1).padStart(2, '0')}</td>
                <td class="py-4 px-4 text-left border-r border-white">${escapeHtml(item.desc)}</td>
                <td class="py-4 px-2 border-r border-white">${item.qty}</td>
                <td class="py-4 px-4 border-r border-white">-</td>
                <td class="py-4 px-4">-</td>
            </tr>
        `;
    });

    const lunasAmount = Number(data.lunas) || 0;
    const diskonAmount = Number(data.diskon) || 0;
    const currentPaymentTtl = data.payments.reduce((a, c) => a + Number(c.amount), 0);

    // Paid Stamp Logic
    const isPaid = (lunasAmount - diskonAmount - currentPaymentTtl) <= 0;
    const stampHTML = isPaid
        ? `<div class="absolute top-10 right-4 border-[6px] border-green-500 text-green-500 font-black tracking-widest px-6 py-2 rounded-xl transform -rotate-[15deg] opacity-80 z-10 text-5xl uppercase shadow-sm bg-white/50 backdrop-blur-sm">PAID</div>`
        : `<div class="absolute top-10 right-4 border-[6px] border-red-500 text-red-500 font-black tracking-widest px-6 py-2 rounded-xl transform -rotate-[15deg] opacity-80 z-10 text-4xl uppercase shadow-sm bg-white/50 backdrop-blur-sm">UNPAID</div>`;

    // Retrieve Admin Name for Signature
    const safeUser = window.getAuthenticatedUser ? window.getAuthenticatedUser() : null;
    const csName = safeUser?.username || "Unknown";
    const invoiceNumber = escapeHtml(data.kodeTransaksi || data.nomorID || "GE-XX-XXXX");
    const safeNama = escapeHtml(data.nama || "Nama Client");
    const safeNomorId = escapeHtml(data.nomorID || "-");
    const safeDate = escapeHtml(`${dateFormatted} ${data.jam || ""}`.trim());
    const safePaymentMethods = escapeHtml(paymentMethods || "-");
    const safeTerbilang = escapeHtml(`${terbilang(currentPaymentTtl)} RUPIAH.`);
    const safeCsName = escapeHtml(csName);

    elements.printableInvoice.innerHTML = `
        <div class="relative bg-white w-full mx-auto" style="min-height: auto; padding: 40px; font-family: 'Inter', sans-serif;">
            
            ${stampHTML}

            <!-- Header Line -->
            <div class="flex items-center justify-center mb-8 relative">
                <div class="w-full h-1 bg-sky-400 absolute top-1/2 left-0 -translate-y-1/2 z-0"></div>
                <div class="bg-white px-4 z-10">
                    <img src="https://globalenglish.id/wp-content/uploads/2023/09/image20-min.png" alt="Global English" class="h-10 object-contain" />
                </div>
            </div>

            <div class="flex justify-between items-start mb-12">
                <div class="w-1/2">
                    <h1 class="text-[5rem] font-black text-gray-900 leading-none tracking-tighter mb-8">Invoice</h1>
                    
                    <div class="text-xs font-bold text-sky-500 uppercase tracking-widest mb-1">INVOICE NUMBER:</div>
                    <div class="text-2xl font-bold text-gray-900">${invoiceNumber}</div>
                </div>
                
                <div class="w-1/2 pl-12">
                    <div class="text-xs font-bold text-sky-500 uppercase tracking-widest mb-1">CLIENT:</div>
                    <div class="text-2xl font-black text-gray-900 mb-1 uppercase">${safeNama}</div>
                    <div class="text-sm font-bold text-gray-800 mb-6">ID: ${safeNomorId}</div>
                    
                    <div class="text-xs font-bold text-sky-500 uppercase tracking-widest mb-1">TRANSACTION DATE:</div>
                    <div class="text-sm font-bold text-gray-800 mb-2">${safeDate}</div>
                    
                    <div class="text-xs font-bold text-sky-500 uppercase tracking-widest mb-1">PAYMENT METHOD:</div>
                    <div class="text-sm font-bold text-gray-800">${safePaymentMethods}</div>
                </div>
            </div>

            <table class="w-full mb-2 border-collapse">
                <thead>
                    <tr class="bg-sky-400 text-white text-xs font-bold tracking-widest uppercase">
                        <th class="py-3 px-2 border-r border-sky-300 w-12 rounded-tl-lg">NO</th>
                        <th class="py-3 px-4 text-left border-r border-sky-300">ITEM DESCRIPTION</th>
                        <th class="py-3 px-2 border-r border-sky-300 w-24">QUANTITY</th>
                        <th class="py-3 px-4 border-r border-sky-300 w-32">PRICE</th>
                        <th class="py-3 px-4 w-40 rounded-tr-lg">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                    
                    <!-- Spacing Row -->
                    <tr>
                        <td colspan="5" class="py-2"></td>
                    </tr>
                    
                    <!-- Subtotals -->
                    <tr class="text-sm font-bold text-gray-700">
                        <td colspan="3" class="text-right py-2 pr-6">HARGA BUNDLE PROGRAM :</td>
                        <td colspan="2" class="text-right py-2 px-4 bg-sky-50">Rp ${lunasAmount.toLocaleString('id-ID')}</td>
                    </tr>
                    ${diskonAmount > 0 ? `
                        <tr class="text-sm font-bold text-gray-700">
                            <td colspan="3" class="text-right py-2 pr-6 text-red-500">DISKON :</td>
                            <td colspan="2" class="text-right py-2 px-4 bg-red-50 text-red-600">- Rp ${diskonAmount.toLocaleString('id-ID')}</td>
                        </tr>
                    ` : ""}
                    <tr class="bg-sky-400 text-white font-bold text-xl uppercase tracking-wider">
                        <td colspan="4" class="py-4 px-6 rounded-bl-lg">TOTAL PEMBAYARAN</td>
                        <td class="text-right py-4 px-4 rounded-br-lg">Rp ${currentPaymentTtl.toLocaleString('id-ID')}</td>
                    </tr>
                </tbody>
            </table>

            <div class="mt-2 text-right mb-12">
                <span class="text-xs font-bold text-sky-500 tracking-wide uppercase">TERBILANG: </span>
                <span class="text-sm font-black text-gray-800 ml-1 uppercase border-b-2 border-sky-200">${safeTerbilang}</span>
            </div>

            <div class="flex justify-between items-end">
                <div class="w-1/2 opacity-20 pointer-events-none">
                    <!-- Placeholder for monument graphic if desired -->
                </div>
                <div class="text-center w-64">
                    <p class="text-sm font-bold text-gray-800 mb-8">Pare, ${dateFormatted}</p>
                    <div class="border-b border-gray-800 w-full mb-1"></div>
                    <p class="text-sm font-bold text-gray-800">Marketing,</p>
                    <p class="text-sm font-bold text-gray-800">( ${safeCsName} )</p>
                </div>
            </div>
            
            <!-- Bottom blue line -->
            <div class="mt-8 w-full h-1 bg-sky-400"></div>
        </div>

        <!-- Non-Printable Controls inside Modal but outside printable area -->
        <div class="print:hidden mt-6 flex justify-end">
             <button type="button" onclick="sendInvoiceEmail()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold flex items-center shadow">
                 <i data-lucide="mail" class="w-4 h-4 mr-2"></i> Send Invoice Email
             </button>
        </div>
    `;

    elements.invoiceModal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

// Global Invoice Memory for Emailing
let currentInvoiceData = null;

// Hook to save data reference when generating
const ogGen = generateInvoiceHTML;
generateInvoiceHTML = function (data) {
    currentInvoiceData = data;
    ogGen(data);
};

// Send Email Logic
async function sendInvoiceEmail() {
    if (!currentInvoiceData) return alert("System Error: No Invoice Data Memory.");

    const email = prompt("Masukkan alamat Email Pembeli/Member:", "");
    if (email === null) return; // Cancelled
    if (!email.includes('@')) return alert("Format Email tidak valid.");

    const btn = document.querySelector('button[onclick="sendInvoiceEmail()"]');
    const ogHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i> Sending...`;
    btn.disabled = true;
    if (window.lucide) lucide.createIcons();

    try {
        const payload = {
            action: "sendEmail",
            data: currentInvoiceData,
            targetEmail: email
        };
        const res = await fetchDataFromAppScript(payload);
        if (res && res.success) {
            alert("Email Invoice berhasil dikirim!");
        } else {
            alert("Gagal mengirim email: " + (res?.message || "Hubungi Admin"));
        }
    } catch (err) {
        console.error(err);
        alert("Gagal koneksi ke server Apps Script.");
    } finally {
        btn.innerHTML = ogHtml;
        btn.disabled = false;
        if (window.lucide) lucide.createIcons();
    }
}

// Terbilang functionality for Indonesian Rupiah
function terbilang(angka) {
    var bilangan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    if (angka < 12) {
        return bilangan[angka];
    } else if (angka < 20) {
        return terbilang(angka - 10) + " Belas";
    } else if (angka < 100) {
        return terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
    } else if (angka < 200) {
        return "Seratus " + terbilang(angka - 100);
    } else if (angka < 1000) {
        return terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
    } else if (angka < 2000) {
        return "Seribu " + terbilang(angka - 1000);
    } else if (angka < 1000000) {
        return terbilang(Math.floor(angka / 1000)) + " Ribu " + terbilang(angka % 1000);
    } else if (angka < 1000000000) {
        return terbilang(Math.floor(angka / 1000000)) + " Juta " + terbilang(angka % 1000000);
    } else if (angka < 1000000000000) {
        return terbilang(Math.floor(angka / 1000000000)) + " Milyar " + terbilang(angka % 1000000000);
    } else {
        return "Trilyun";
    }
}

// Close Modal
elements.btnCloseInvoice.addEventListener('click', () => {
    elements.invoiceModal.classList.add('hidden');
});

// Boot Application
renderUI();
initCaches();
