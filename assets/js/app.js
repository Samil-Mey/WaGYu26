const GB_PALETTE = ['#B4483C','#C7912E','#3F8F5F','#3B6E91','#7A5FA6','#B87BA0','#5A7A3F','#8C6A45'];
const GB_BULAN = ['JANUARI','FEBRUARI','MAC','APRIL','MEI','JUN','JULAI','OGOS','SEPTEMBER','OKTOBER','NOVEMBER','DISEMBER'];
const GB_DEFAULT_STATUS = [
  { name: 'Belum Proses', color: '#B4483C', done: false },
  { name: 'Dalam Proses', color: '#C7912E', done: false },
  { name: 'Siap',         color: '#3F8F5F', done: true  }
];

function app() {
  return {

    // ── Auth ──
    loggedIn: false,
    loginPass: "",
    loginError: "",
    loginLoading: false,

    // ── Tab ──
    activeTab: "isi",

    // ── Form ──
    form: {
      namaPemohon: "", noIC: "", noPer: "",
      jenis: "", dari: "", ke: "",
      orderBy: "", sesi: "", tarikhMohon: "",
      kategori: "", status: "Menunggu"
    },
    formLoading: false,
    formMsg: "",
    formMsgType: "",

    // ── Dashboard ──
    records: [],
    dashLoading: false,
    searchQ: "",
    filterStatus: "",
    filterKategori: "",

    // ── Options ──
    opts: OPTS,

    // ────────────────────────────
    // LOGIN
    // ────────────────────────────
    async doLogin() {
      if (!this.loginPass) {
        this.loginError = "Sila masukkan kata laluan.";
        return;
      }
      this.loginLoading = true;
      this.loginError = "";
      try {
        const res = await api.login(this.loginPass);
        if (res.success) {
          this.loggedIn = true;
        } else {
          this.loginError = "Kata laluan salah.";
        }
      } catch (e) {
        this.loginError = "Ralat: " + e.message;
      }
      this.loginLoading = false;
    },

    logout() {
      this.loggedIn = false;
      this.loginPass = "";
      this.loginError = "";
      this.records = [];
      this.gbRecords = [];
      this.activeTab = "isi";
    },

    // ────────────────────────────
    // FORM
    // ────────────────────────────
    async submitForm() {
      if (!this.form.namaPemohon || !this.form.kategori || !this.form.orderBy || !this.form.sesi) {
        this.showMsg("Sila isi semua medan bertanda *.", "error");
        return;
      }
      this.formLoading = true;
      try {
        const res = await api.saveData(this.form);
        if (res.success) {
          this.showMsg("✓ Rekod berjaya disimpan. (Bil: " + res.bil + ")", "success");
          this.resetForm();
        } else {
          this.showMsg("Gagal: " + res.error, "error");
        }
      } catch (e) {
        this.showMsg("Ralat: " + e.message, "error");
      }
      this.formLoading = false;
    },

    resetForm() {
      this.form = {
        namaPemohon: "", noIC: "", noPer: "",
        jenis: "", dari: "", ke: "",
        orderBy: "", sesi: "", tarikhMohon: "",
        kategori: "", status: "Menunggu"
      };
    },

    showMsg(msg, type) {
      this.formMsg = msg;
      this.formMsgType = type;
      setTimeout(() => { this.formMsg = ""; }, 4000);
    },

    // ────────────────────────────
    // DASHBOARD
    // ────────────────────────────
    async loadData() {
      this.dashLoading = true;
      try {
        const res = await api.getData();
        if (res.success) this.records = res.data;
      } catch (e) {
        console.error(e);
      }
      this.dashLoading = false;
    },

    async updateStatus(bil, status) {
      try {
        const res = await api.updateStatus(bil, status);
        if (!res.success) alert("Gagal update: " + res.error);
      } catch (e) {
        alert("Ralat: " + e.message);
      }
    },

    // ────────────────────────────
    // COMPUTED (Tracking Arahan)
    // ────────────────────────────
    get filteredRecords() {
      const q = this.searchQ.toLowerCase();
      return this.records.filter(r => {
        const matchQ = !q ||
          (r.namaPemohon || "").toLowerCase().includes(q) ||
          (r.noIC || "").toLowerCase().includes(q) ||
          (r.noPer || "").toLowerCase().includes(q);
        const matchS = !this.filterStatus   || r.status   === this.filterStatus;
        const matchK = !this.filterKategori || r.kategori === this.filterKategori;
        return matchQ && matchS && matchK;
      });
    },

    get statSelesai()  { return this.records.filter(r => r.status === "Selesai").length; },
    get statProses()   { return this.records.filter(r => r.status === "Dalam Proses").length; },
    get statMenunggu() { return this.records.filter(r => r.status === "Menunggu").length; },


    // ════════════════════════════════════════════════════════
    // SISTEM GURU BARU (add-on)
    // ════════════════════════════════════════════════════════

    gbRecords: [],
    gbStatusOptions: [],
    gbLoading: false,
    gbSearchQ: "",
    gbFilterStatus: "",
    gbShowRecordModal: false,
    gbShowStatusModal: false,
    gbEditId: null,
    gbForm: { nama: "", ic: "", tarikhKeyIn: "", bulanProses: "", arahanBy: "", status: "", catatan: "" },
    gbNewStatusName: "",

    // ── Load ──
    async loadGuruBaru() {
      this.gbLoading = true;
      try {
        const [recRes, statRes] = await Promise.all([
          api.getGuruBaru(),
          api.getStatusGuruBaru()
        ]);
        if (recRes.success) this.gbRecords = recRes.data;
        else alert("Gagal muatkan rekod: " + recRes.error);

        this.gbStatusOptions = (statRes.success && statRes.data.length) ? statRes.data : GB_DEFAULT_STATUS;
      } catch (e) {
        alert("Ralat sambungan ke pelayan: " + e.message);
      }
      this.gbLoading = false;
    },

    // ── Record modal ──
    gbOpenAdd() {
      this.gbEditId = null;
      this.gbForm = {
        nama: "", ic: "",
        tarikhKeyIn: new Date().toISOString().slice(0, 10),
        bulanProses: "", arahanBy: "",
        status: this.gbStatusOptions[0]?.name || "",
        catatan: ""
      };
      this.gbShowRecordModal = true;
    },

    gbOpenEdit(r) {
      this.gbEditId = r.id;
      this.gbForm = {
        nama: r.nama, ic: r.ic,
        tarikhKeyIn: r.tarikhKeyIn || "",
        bulanProses: r.bulanProses || "",
        arahanBy: r.arahanBy || "",
        status: r.status,
        catatan: r.catatan || ""
      };
      this.gbShowRecordModal = true;
    },

    async gbSaveRecord() {
      if (!this.gbForm.nama || !this.gbForm.ic) {
        alert("Sila isi Nama dan No. IC.");
        return;
      }
      this.gbLoading = true;
      try {
        if (this.gbEditId) {
          const existing = this.gbRecords.find(r => r.id === this.gbEditId);
          const res = await api.updateGuruBaru({ ...existing, ...this.gbForm, id: this.gbEditId });
          if (res.success) {
            const idx = this.gbRecords.findIndex(r => r.id === this.gbEditId);
            this.gbRecords[idx] = { ...this.gbRecords[idx], ...this.gbForm };
          } else {
            alert("Gagal simpan: " + res.error);
            this.gbLoading = false;
            return;
          }
        } else {
          const res = await api.saveGuruBaru(this.gbForm);
          if (res.success) {
            this.gbRecords.push({ id: res.id, hidden: false, ...this.gbForm });
          } else {
            alert("Gagal simpan: " + res.error);
            this.gbLoading = false;
            return;
          }
        }
        this.gbShowRecordModal = false;
      } catch (e) {
        alert("Ralat sambungan: " + e.message);
      }
      this.gbLoading = false;
    },

    async gbDeleteRecord(id) {
      if (!confirm("Padam rekod ini?")) return;
      this.gbLoading = true;
      try {
        const res = await api.deleteGuruBaru(id);
        if (res.success) this.gbRecords = this.gbRecords.filter(r => r.id !== id);
        else alert("Gagal padam: " + res.error);
      } catch (e) {
        alert("Ralat sambungan: " + e.message);
      }
      this.gbLoading = false;
    },

    async gbToggleHidden(r) {
      const newHidden = !r.hidden;
      try {
        const res = await api.updateGuruBaru({ ...r, hidden: newHidden });
        if (res.success) r.hidden = newHidden;
        else alert("Gagal kemaskini: " + res.error);
      } catch (e) {
        alert("Ralat sambungan: " + e.message);
      }
    },

    gbPrint() {
      window.print();
    },

    // ── Status helpers ──
    gbStatusColor(name) {
      const s = this.gbStatusOptions.find(s => s.name === name);
      return s ? s.color : '#9AA0AC';
    },

    gbIsDone(r) {
      const s = this.gbStatusOptions.find(s => s.name === r.status);
      return s ? !!s.done : false;
    },

    gbFmtDate(d) {
      if (!d) return "—";
      const p = String(d).split("-");
      return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
    },

    gbFmtBulan(m) {
      if (!m) return "—";
      const p = String(m).split("-");
      if (p.length !== 2) return m;
      return `${GB_BULAN[parseInt(p[1], 10) - 1] || p[1]} ${p[0]}`;
    },

    // ── Manage status ──
    async gbAddStatus() {
      const name = this.gbNewStatusName.trim();
      if (!name) return;
      if (this.gbStatusOptions.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert("Status ini sudah wujud.");
        return;
      }
      const color = GB_PALETTE[this.gbStatusOptions.length % GB_PALETTE.length];
      this.gbStatusOptions.push({ name, color, done: /siap|selesai/i.test(name) });
      const ok = await this.gbPersistStatus();
      if (ok) this.gbNewStatusName = "";
      else this.gbStatusOptions.pop();
    },

    async gbRemoveStatus(idx) {
      if (this.gbStatusOptions.length <= 1) {
        alert("Perlu ada sekurang-kurangnya satu status.");
        return;
      }
      const name = this.gbStatusOptions[idx].name;
      const inUse = this.gbRecords.some(r => r.status === name);
      if (inUse && !confirm(`Status "${name}" digunakan oleh rekod sedia ada. Buang juga?`)) return;
      const removed = this.gbStatusOptions.splice(idx, 1);
      const ok = await this.gbPersistStatus();
      if (!ok) this.gbStatusOptions.splice(idx, 0, removed[0]);
    },

    async gbToggleStatusDone(idx) {
      this.gbStatusOptions[idx].done = !this.gbStatusOptions[idx].done;
      await this.gbPersistStatus();
    },

    async gbRenameStatus(idx, newName) {
      const oldName = this.gbStatusOptions[idx].name;
      newName = (newName || "").trim();
      if (!newName) { this.gbStatusOptions[idx].name = oldName; return; }
      this.gbStatusOptions[idx].name = newName;
      const ok = await this.gbPersistStatus();
      if (ok) this.gbRecords.forEach(r => { if (r.status === oldName) r.status = newName; });
    },

    async gbPersistStatus() {
      try {
        const res = await api.saveStatusGuruBaru(this.gbStatusOptions);
        if (!res.success) alert("Gagal simpan status: " + res.error);
        return res.success;
      } catch (e) {
        alert("Ralat sambungan: " + e.message);
        return false;
      }
    },

    // ── Computed ──
    get gbFilteredRecords() {
      const q = this.gbSearchQ.toLowerCase();
      return this.gbRecords
        .filter(r => {
          const matchQ = !q || (r.nama || "").toLowerCase().includes(q) || (r.ic || "").toLowerCase().includes(q);
          const matchS = !this.gbFilterStatus || r.status === this.gbFilterStatus;
          return matchQ && matchS;
        })
        .sort((a, b) => (b.tarikhKeyIn || "").localeCompare(a.tarikhKeyIn || ""));
    },

    get gbActiveRecords() { return this.gbFilteredRecords.filter(r => !this.gbIsDone(r)); },
    get gbDoneRecords()   { return this.gbFilteredRecords.filter(r =>  this.gbIsDone(r)); }

  };
}
