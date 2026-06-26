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
  const uploadFab = document.getElementById("upload-fab");
  if (uploadFab)
    uploadFab.style.display = name === "patient-detail" ? "block" : "none";
}

function loadProfileScreen() {
  const name = currentDoctor?.name || "Doctor";
  document.getElementById("profile-avatar-lg").textContent = name
    .charAt(0)
    .toUpperCase();
  document.getElementById("profile-name-lg").textContent = "Dr. " + name;
  document.getElementById("profile-spec-lg").textContent =
    currentDoctor?.specialization || "";
  document.getElementById("profile-phone-lg").textContent =
    currentDoctor?.phone_number || "";
  showScreen("doctor-profile");
}

function toggleNotifications() {
  const dropdown = document.getElementById("notif-dropdown");
  const isOpen = dropdown.style.display !== "none";
  if (isOpen) {
    dropdown.style.display = "none";
    return;
  }
  dropdown.style.display = "block";
  apiPatch("/doctor/notifications/read-all", {})
    .then(() => {
      document.getElementById("notif-badge").style.display = "none";
      document
        .querySelectorAll(".notif-item")
        .forEach((el) => el.classList.remove("unread"));
    })
    .catch(() => {});
}

document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("notif-dropdown");
  const bell = document.getElementById("notif-bell");
  if (
    dropdown &&
    bell &&
    !dropdown.contains(e.target) &&
    !bell.contains(e.target)
  ) {
    dropdown.style.display = "none";
  }
});

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
