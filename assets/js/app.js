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
    // COMPUTED
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
    get statMenunggu() { return this.records.filter(r => r.status === "Menunggu").length; }

  };
}