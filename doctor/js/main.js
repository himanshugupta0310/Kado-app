window.addEventListener("load", async () => {
  const token = getToken();
  const saved = localStorage.getItem("kado_doctor");
  if (token && saved) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 > Date.now()) {
        currentDoctor = JSON.parse(saved);
        await loadPatientsScreen();
        return;
      }
    } catch {}
    clearToken();
    localStorage.removeItem("kado_doctor");
  }
});

document.getElementById("phone-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSendOtp();
});

document.getElementById("otp-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleVerifyOtp();
});
