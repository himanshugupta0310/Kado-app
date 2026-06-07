function renderPatientDetailBars() {
  const barsDiv = document.getElementById("patient-detail-bars");
  const noteDiv = document.getElementById("patient-detail-note");
  const tags = [];
  if (currentPatientNotes.diagnosis) {
    currentPatientNotes.diagnosis.split(",").forEach((d) => {
      tags.push('<span class="tag tag-diagnosis">' + d.trim() + "</span>");
    });
  }
  if (currentPatientNotes.procedure) {
    currentPatientNotes.procedure.split(",").forEach((d) => {
      tags.push('<span class="tag tag-procedure">' + d.trim() + "</span>");
    });
  }
  if (tags.length > 0) {
    barsDiv.innerHTML = tags.join("");
    barsDiv.style.display = "flex";
  } else {
    barsDiv.style.display = "none";
  }
  if (currentPatientNotes.note) {
    noteDiv.textContent = currentPatientNotes.note;
    noteDiv.style.display = "block";
  } else {
    noteDiv.style.display = "none";
  }
}

function openPatientNotesModal() {
  document.getElementById("notes-modal-title").textContent =
    (currentPatient?.name || "Patient") + " — Notes";
  document.getElementById("notes-diagnosis").value =
    currentPatientNotes.diagnosis || "";
  document.getElementById("notes-procedure").value =
    currentPatientNotes.procedure || "";
  document.getElementById("notes-note").value = currentPatientNotes.note || "";
  document.getElementById("patient-notes-modal").classList.add("open");
}

function openPatientNotesModalFromList(i) {
  currentPatient = window._patients[i];
  currentPatientNotes = window._patientNotes
    ? window._patientNotes[i] || {}
    : {};
  openPatientNotesModal();
}

function closePatientNotesModal() {
  document.getElementById("patient-notes-modal").classList.remove("open");
}

async function savePatientNotes() {
  const diagnosis = document.getElementById("notes-diagnosis").value.trim();
  const procedure = document.getElementById("notes-procedure").value.trim();
  const note = document.getElementById("notes-note").value.trim();
  try {
    await fetch(API + "/patients/" + currentPatient.id + "/doctor-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor_id: currentDoctor.id,
        diagnosis,
        procedure,
        note,
      }),
    });
    currentPatientNotes = { diagnosis, procedure, note };
    if (window._patientNotes && window._patients) {
      const idx = window._patients.findIndex((p) => p.id === currentPatient.id);
      if (idx >= 0) window._patientNotes[idx] = currentPatientNotes;
    }
    closePatientNotesModal();
    renderPatientDetailBars();
    await loadPatients();
  } catch (e) {
    alert("Could not save notes.");
  }
}

function switchTab(tab) {
  currentTab = tab;
  ["records", "recs", "summary"].forEach((t) => {
    document.getElementById("tab-" + t).classList.toggle("active", t === tab);
    document.getElementById("tab-content-" + t).style.display =
      t === tab ? "block" : "none";
  });
  if (tab === "records") loadPatientRecords();
  if (tab === "recs") loadPrescriptions();
  if (tab === "summary") loadDoctorSummary();
}
