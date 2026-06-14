const API = window.__KADO_API__ || "https://api.kado.care";

const titleEl = document.getElementById("title");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("start-btn");
const statusEl = document.getElementById("status");

function getSessionId() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("id")) return params.get("id");

  // Support /history/<session-id>
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length >= 2 && parts[0] === "history") return parts[1];
  return null;
}

function setStatus(text, cls = "") {
  statusEl.textContent = text;
  statusEl.className = `status ${cls}`;
}

const sessionId = getSessionId();

async function init() {
  if (!sessionId) {
    titleEl.textContent = "Link not found";
    messageEl.textContent =
      "This link looks incomplete. Please use the link sent on WhatsApp.";
    return;
  }

  try {
    const res = await fetch(`${API}/history-sessions/${sessionId}`);
    if (!res.ok) throw new Error("not found");
    const data = await res.json();

    if (data.status === "completed") {
      titleEl.textContent = "All done!";
      messageEl.textContent =
        "Thanks — your responses have already been shared with your doctor.";
      return;
    }

    const doctorName = data.doctorName
      ? `Dr. ${data.doctorName}`
      : "Your doctor";
    titleEl.textContent = `Hi ${data.patientName || "there"}!`;
    messageEl.textContent = `${doctorName} would like to ask you a few quick questions about your health history. This will only take a few minutes — just talk naturally, like a phone call.`;
    startBtn.style.display = "block";
    startBtn.addEventListener("click", startSession);
  } catch (err) {
    titleEl.textContent = "Link not found";
    messageEl.textContent = "This session link is invalid or has expired.";
  }
}

async function startSession() {
  startBtn.disabled = true;
  setStatus("Requesting microphone access…");

  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    setStatus("Microphone access is required to continue.", "error");
    startBtn.disabled = false;
    return;
  }

  setStatus("Connecting…");

  let tokenData;
  try {
    const res = await fetch(`${API}/history-sessions/${sessionId}/start`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("start failed");
    tokenData = await res.json();
  } catch {
    setStatus("Could not start the session. Please try again.", "error");
    startBtn.disabled = false;
    return;
  }

  // ElevenLabs browser client — see https://www.npmjs.com/package/@elevenlabs/client
  // NOTE: confirm the global name exposed by the UMD build at setup time.
  const ConversationApi =
    window.ElevenLabsClient?.Conversation || window.Conversation;
  if (!ConversationApi) {
    setStatus(
      "Voice module failed to load. Please refresh and try again.",
      "error",
    );
    startBtn.disabled = false;
    return;
  }

  try {
    await ConversationApi.startSession({
      signedUrl: tokenData.signedUrl,
      dynamicVariables: tokenData.dynamicVariables,
      onConnect: () => setStatus("Connected — say hello!", "live"),
      onDisconnect: () => {
        setStatus("Session ended. Thank you!");
        titleEl.textContent = "All done!";
        messageEl.textContent =
          "Thanks for sharing — your responses have been sent to your doctor.";
        startBtn.style.display = "none";
      },
      onModeChange: ({ mode }) => {
        setStatus(mode === "speaking" ? "Speaking…" : "Listening…", "live");
      },
      onError: () => {
        setStatus("Something went wrong during the session.", "error");
        startBtn.disabled = false;
      },
    });
    startBtn.style.display = "none";
  } catch {
    setStatus("Could not connect to the voice assistant.", "error");
    startBtn.disabled = false;
  }
}

init();
