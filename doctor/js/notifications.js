let _notifPollInterval = null;
let _notifications = [];

function startNotificationPolling() {
  loadNotifications();
  _notifPollInterval = setInterval(loadNotifications, 30000);
}

async function loadNotifications() {
  try {
    const notifs = await apiFetch("/doctor/notifications");
    _notifications = notifs || [];
    renderNotifications(_notifications);
  } catch (e) {
    // silent — non-fatal
  }
}

function renderNotifications(notifs) {
  const badge = document.getElementById("notif-badge");
  const list = document.getElementById("notif-list");
  if (!badge || !list) return;

  const unread = notifs.filter((n) => !n.is_read).length;
  if (unread > 0) {
    badge.textContent = unread > 99 ? "99+" : String(unread);
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }

  if (notifs.length === 0) {
    list.innerHTML = '<div class="notif-empty">No notifications</div>';
    return;
  }

  list.innerHTML = notifs
    .map((n, i) => {
      return `<div class="notif-item ${n.is_read ? "" : "unread"}" onclick="handleNotificationClick(${i})">
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${relativeTime(n.created_at)}</div>
      </div>`;
    })
    .join("");
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

async function handleNotificationClick(index) {
  const notif = _notifications[index];
  if (!notif) return;

  const dropdown = document.getElementById("notif-dropdown");
  if (dropdown) dropdown.style.display = "none";

  // Mark all read optimistically
  _notifications.forEach((n) => (n.is_read = true));
  renderNotifications(_notifications);
  apiPatch("/doctor/notifications/read-all", {}).catch(() => {});

  const tab = notif.metadata?.tab || "records";
  const patientId = notif.patient_id;

  let idx = (window._patients || []).findIndex((p) => p.id === patientId);
  if (idx === -1) {
    await loadPatients();
    idx = (window._patients || []).findIndex((p) => p.id === patientId);
  }
  if (idx !== -1) {
    openPatient(idx);
    switchTab(tab);
  }
}
