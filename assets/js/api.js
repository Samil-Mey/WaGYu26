async function post(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return res.json();
}
const api = {
  login:        (password)       => post({ action: "login", password }),
  saveData:     (data)           => post({ action: "saveData", data }),
  getData:      ()               => post({ action: "getData" }),
  updateStatus: (bil, status)    => post({ action: "updateStatus", bil, status }),

  // ── Sistem Guru Baru ──
  getGuruBaru:       ()     => post({ action: "getGuruBaru" }),
  saveGuruBaru:      (data) => post({ action: "saveGuruBaru", data }),
  updateGuruBaru:    (data) => post({ action: "updateGuruBaru", data }),
  deleteGuruBaru:    (id)   => post({ action: "deleteGuruBaru", id }),
  getStatusGuruBaru: ()     => post({ action: "getStatusGuruBaru" }),
  saveStatusGuruBaru:(data) => post({ action: "saveStatusGuruBaru", data })
};
