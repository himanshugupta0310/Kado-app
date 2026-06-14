const API = window.__KADO_API__ || "https://api.kado.care";

const titleEl = document.getElementById("title");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("start-btn");
const endBtn = document.getElementById("end-btn");
const statusEl = document.getElementById("status");
const orbWrap = document.getElementById("orb-wrap");
const orb = document.getElementById("orb");

let activeConversation = null;
let orbFrame = null;

function startOrbAnimation(conversation) {
  orbWrap.style.display = "block";

  function tick() {
    const mode = orb.classList.contains("speaking") ? "output" : "input";
    const volume =
      mode === "output"
        ? conversation.getOutputVolume()
        : conversation.getInputVolume();
    const level = 0.85 + Math.min(1, volume * 3) * 0.35;
    orb.style.setProperty("--level", level.toFixed(3));
    orbFrame = requestAnimationFrame(tick);
  }
  orbFrame = requestAnimationFrame(tick);
}

function stopOrbAnimation() {
  if (orbFrame) cancelAnimationFrame(orbFrame);
  orbFrame = null;
  orbWrap.style.display = "none";
  orb.classList.remove("speaking", "listening");
  orb.style.removeProperty("--level");
}

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
  // UMD build exposes `window.client.Conversation`
  const ConversationApi = window.client?.Conversation;
  if (!ConversationApi) {
    setStatus(
      "Voice module failed to load. Please refresh and try again.",
      "error",
    );
    startBtn.disabled = false;
    return;
  }

  try {
    activeConversation = await ConversationApi.startSession({
      signedUrl: tokenData.signedUrl,
      dynamicVariables: tokenData.dynamicVariables,
      onConnect: () => {
        setStatus("Connected — say hello!", "live");
        endBtn.style.display = "block";
        startOrbAnimation(activeConversation);
      },
      onDisconnect: () => {
        setStatus("Session ended. Thank you!");
        titleEl.textContent = "All done!";
        messageEl.textContent =
          "Thanks for sharing — your responses have been sent to your doctor.";
        startBtn.style.display = "none";
        endBtn.style.display = "none";
        stopOrbAnimation();
        activeConversation = null;
      },
      onModeChange: ({ mode }) => {
        setStatus(mode === "speaking" ? "Speaking…" : "Listening…", "live");
        orb.classList.toggle("speaking", mode === "speaking");
        orb.classList.toggle("listening", mode === "listening");
      },
      onError: () => {
        setStatus("Something went wrong during the session.", "error");
        startBtn.disabled = false;
        endBtn.style.display = "none";
        stopOrbAnimation();
      },
    });
    startBtn.style.display = "none";
  } catch {
    setStatus("Could not connect to the voice assistant.", "error");
    startBtn.disabled = false;
  }
}

endBtn.addEventListener("click", () => {
  if (activeConversation) activeConversation.endSession();
});

init();
