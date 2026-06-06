window.addEventListener("load", async () => {
  const saved = localStorage.getItem("kado_doctor");
  if (saved) {
    currentDoctor = JSON.parse(saved);
    await loadPatientsScreen();
  }
});

document.getElementById("phone-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleLogin();
});
