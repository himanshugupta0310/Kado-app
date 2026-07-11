// Doctor playback of preconsult/postconsult call recordings.
// Shared by summary.js (preconsult) and records.js (postconsult).

function _recTurnRow(turn) {
  const isAgent = turn.role === "assistant";
  const label = isAgent ? "Agent" : "Patient";
  const color = isAgent ? "#2D8A6A" : "#1A2D22";
  return (
    '<div style="margin-bottom:10px;">' +
    '<div style="font-size:11px;font-weight:600;color:' +
    color +
    ';margin-bottom:2px;">' +
    label +
    "</div>" +
    '<div style="font-size:13px;color:#3A4A3E;line-height:1.5;">' +
    (turn.text || "") +
    "</div></div>"
  );
}

function renderRecordingTranscript(transcript) {
  const el = document.getElementById("recording-transcript");
  if (!Array.isArray(transcript) || !transcript.length) {
    el.innerHTML =
      '<div style="font-size:12px;color:#7A9A7A;">No transcript available.</div>';
    return;
  }
  el.innerHTML = transcript.map(_recTurnRow).join("");
}

let _recordingObjectUrl = null;

async function openRecordingSheet({ apiPath, transcript }) {
  const overlay = document.getElementById("recording-overlay");
  const audio = document.getElementById("recording-audio-player");
  overlay.classList.add("open");
  audio.removeAttribute("src");
  renderRecordingTranscript(transcript);

  try {
    const res = await fetch(API + apiPath, { headers: authHeaders() });
    if (!res.ok) throw new Error("Recording fetch failed: " + res.status);
    const blob = await res.blob();
    if (_recordingObjectUrl) URL.revokeObjectURL(_recordingObjectUrl);
    _recordingObjectUrl = URL.createObjectURL(blob);
    audio.src = _recordingObjectUrl;
  } catch (err) {
    console.error("Could not load recording:", err.message);
  }
}

function closeRecordingSheet() {
  const overlay = document.getElementById("recording-overlay");
  const audio = document.getElementById("recording-audio-player");
  overlay.classList.remove("open");
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
  if (_recordingObjectUrl) {
    URL.revokeObjectURL(_recordingObjectUrl);
    _recordingObjectUrl = null;
  }
}
