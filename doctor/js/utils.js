function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.remove("active");
    s.style.display = "none";
  });
  const el = document.getElementById("screen-" + name);
  el.classList.add("active");
  el.style.display = name === "login" ? "flex" : "block";
}

function setMode(mode) {
  if (mode === "professional") {
    showScreen("patients");
    document.getElementById("invite-fab").style.display = "block";
  } else {
    showScreen("personal");
    document.getElementById("invite-fab").style.display = "none";
  }
}

function logoutDoctor() {
  currentDoctor = null;
  localStorage.removeItem("kado_doctor");
  showScreen("login");
}

function getReportIcon(type) {
  if (!type) return "📋";
  const t = type.toLowerCase();
  if (t.includes("blood") || t.includes("lab") || t.includes("pathology"))
    return "🩸";
  if (
    t.includes("mri") ||
    t.includes("ct") ||
    t.includes("xray") ||
    t.includes("x-ray") ||
    t.includes("ultrasound") ||
    t.includes("usg") ||
    t.includes("pet") ||
    t.includes("dexa")
  )
    return "🫁";
  if (t.includes("prescription") || t.includes("consultation")) return "💊";
  return "📄";
}

function getIconBg(type) {
  if (!type) return "icon-other";
  const t = type.toLowerCase();
  if (t.includes("blood") || t.includes("lab") || t.includes("pathology"))
    return "icon-blood";
  if (
    t.includes("mri") ||
    t.includes("ct") ||
    t.includes("xray") ||
    t.includes("x-ray") ||
    t.includes("ultrasound") ||
    t.includes("usg") ||
    t.includes("pet") ||
    t.includes("dexa")
  )
    return "icon-scan";
  if (t.includes("prescription") || t.includes("consultation"))
    return "icon-prescription";
  return "icon-other";
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
