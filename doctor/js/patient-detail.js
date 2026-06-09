function renderPatientDetailBars() {
  const barsDiv = document.getElementById("patient-detail-bars");
  const noteDiv = document.getElementById("patient-detail-note");
  if (!barsDiv || !noteDiv) return;
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
    "Edit " + (currentPatient?.name || "Patient");
  document.getElementById("edit-patient-name").value =
    currentPatient?.name || "";
  document.getElementById("edit-patient-age").value = currentPatient?.age || "";
  document.getElementById("edit-patient-gender").value =
    currentPatient?.gender || "";
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
  const name = document.getElementById("edit-patient-name").value.trim();
  const age = document.getElementById("edit-patient-age").value.trim();
  const gender = document.getElementById("edit-patient-gender").value;
  const diagnosis = document.getElementById("notes-diagnosis").value.trim();
  const procedure = document.getElementById("notes-procedure").value.trim();
  const note = document.getElementById("notes-note").value.trim();
  try {
    await Promise.all([
      fetch(API + "/patients/" + currentPatient.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age: age ? Number(age) : null, gender }),
      }),
      fetch(API + "/patients/" + currentPatient.id + "/doctor-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: currentDoctor.id,
          diagnosis,
          procedure,
          note,
        }),
      }),
    ]);
    currentPatient = {
      ...currentPatient,
      name,
      age: age ? Number(age) : null,
      gender,
    };
    currentPatientNotes = { diagnosis, procedure, note };
    if (window._patients) {
      const idx = window._patients.findIndex((p) => p.id === currentPatient.id);
      if (idx >= 0) {
        window._patients[idx] = {
          ...window._patients[idx],
          name,
          age: age ? Number(age) : null,
          gender,
        };
        if (window._patientNotes)
          window._patientNotes[idx] = currentPatientNotes;
      }
    }
    closePatientNotesModal();
    renderPatientDetailBars();
    await loadPatients();
  } catch (e) {
    alert("Could not save.");
  }
}

async function deletePatientProfile() {
  if (
    !confirm(
      "Delete " +
        (currentPatient?.name || "this patient") +
        "? This cannot be undone.",
    )
  )
    return;
  try {
    const res = await fetch(API + "/patients/" + currentPatient.id, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Delete failed");
    closePatientNotesModal();
    showScreen("patients");
    await loadPatients();
  } catch (e) {
    alert("Could not delete patient.");
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
