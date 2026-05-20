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
  updateStatus: (bil, status)    => post({ action: "updateStatus", bil, status })
};