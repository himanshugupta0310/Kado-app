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

function _getPatientFormValues() {
  return {
    name: document.getElementById("edit-patient-name").value.trim(),
    age: document.getElementById("edit-patient-age").value.trim(),
    gender: document.getElementById("edit-patient-gender").value,
    phone: document.getElementById("edit-patient-phone").value.trim(),
    diagnosis: document.getElementById("notes-diagnosis").value.trim(),
    procedure: document.getElementById("notes-procedure").value.trim(),
    note: document.getElementById("notes-note").value.trim(),
  };
}

function _checkPatientFormDirty() {
  const cur = _getPatientFormValues();
  const o = window._originalPatientFormValues;
  const dirty =
    cur.name !== o.name ||
    cur.age !== o.age ||
    cur.gender !== o.gender ||
    cur.phone !== o.phone ||
    cur.diagnosis !== o.diagnosis ||
    cur.procedure !== o.procedure ||
    cur.note !== o.note;
  document.getElementById("patient-notes-save-btn").disabled = !dirty;
}

async function openPatientNotesModal() {
  document.getElementById("notes-modal-title").textContent =
    "Edit " + (currentPatient?.name || "Patient");
  document.getElementById("edit-patient-name").value =
    currentPatient?.name || "";
  document.getElementById("edit-patient-age").value = currentPatient?.age || "";
  document.getElementById("edit-patient-gender").value =
    currentPatient?.gender || "";
  window._originalPatientPhone = "";
  document.getElementById("edit-patient-phone").value = "";
  document.getElementById("notes-diagnosis").value =
    currentPatientNotes.diagnosis || "";
  document.getElementById("notes-procedure").value =
    currentPatientNotes.procedure || "";
  document.getElementById("notes-note").value = currentPatientNotes.note || "";

  window._originalPatientFormValues = _getPatientFormValues();
  document.getElementById("patient-notes-save-btn").disabled = true;

  document.getElementById("patient-notes-modal").classList.add("open");

  try {
    const caregivers = await apiFetch(
      "/patients/" + currentPatient.id + "/caregivers",
    );
    const owner = (caregivers || []).find((c) => c.role === "owner");
    if (owner?.phone_number) {
      const display = owner.phone_number.replace("+91", "");
      document.getElementById("edit-patient-phone").value = display;
      window._originalPatientPhone = display;
      window._originalPatientFormValues.phone = display;
      _checkPatientFormDirty();
    }
  } catch (e) {}
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

function openPatientActionSheetForCurrent() {
  const i = window._patients
    ? window._patients.findIndex((p) => p.id === currentPatient?.id)
    : -1;
  openPatientActionSheet(i >= 0 ? i : window._actionPatientIndex);
}

function openPatientActionSheet(i) {
  window._actionPatientIndex = i;
  document.getElementById("patient-action-overlay").classList.add("open");
}

function closePatientActionSheet() {
  document.getElementById("patient-action-overlay").classList.remove("open");
}

function openEditPatientFromAction() {
  closePatientActionSheet();
  openPatientNotesModalFromList(window._actionPatientIndex);
}

function openTriggerAgentSheet() {
  closePatientActionSheet();
  document.getElementById("trigger-agent-overlay").classList.add("open");
}

function closeTriggerAgentSheet() {
  document.getElementById("trigger-agent-overlay").classList.remove("open");
}

async function triggerPostConsultAgent() {
  const patient = window._patients
    ? window._patients[window._actionPatientIndex]
    : currentPatient;
  if (!patient) return;

  closeTriggerAgentSheet();

  const card = document.querySelector(
    "#trigger-agent-overlay .sheet-option-card:nth-of-type(2)",
  );
  if (card) {
    card.style.opacity = "0.6";
    card.style.pointerEvents = "none";
  }

  try {
    const res = await fetch(API + "/patients/" + patient.id + "/postconsult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_id: currentDoctor.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Could not trigger agent.");
      return;
    }
    alert(
      "Post consult agent triggered! WhatsApp message sent to " +
        (patient.name || "patient") +
        ".",
    );
  } catch (e) {
    alert("Could not trigger agent. Please try again.");
  } finally {
    if (card) {
      card.style.opacity = "";
      card.style.pointerEvents = "";
    }
  }
}

async function triggerPreconsultAgent() {
  const patient = window._patients
    ? window._patients[window._actionPatientIndex]
    : currentPatient;
  if (!patient) return;

  closeTriggerAgentSheet();

  const btn = document.querySelector(
    "#trigger-agent-overlay .sheet-option-card:first-of-type",
  );
  if (btn) {
    btn.style.opacity = "0.6";
    btn.style.pointerEvents = "none";
  }

  try {
    const res = await fetch(API + "/patients/" + patient.id + "/preconsult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctor_id: currentDoctor.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Could not trigger agent.");
      return;
    }
    alert(
      "Agent triggered! WhatsApp message sent to " +
        (patient.name || "patient") +
        ".",
    );
  } catch (e) {
    alert("Could not trigger agent. Please try again.");
  } finally {
    if (btn) {
      btn.style.opacity = "";
      btn.style.pointerEvents = "";
    }
  }
}

async function savePatientNotes() {
  const name = document.getElementById("edit-patient-name").value.trim();
  const age = document.getElementById("edit-patient-age").value.trim();
  const gender = document.getElementById("edit-patient-gender").value;
  const phone = document.getElementById("edit-patient-phone").value.trim();
  const diagnosis = document.getElementById("notes-diagnosis").value.trim();
  const procedure = document.getElementById("notes-procedure").value.trim();
  const note = document.getElementById("notes-note").value.trim();
  try {
    const requests = [
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
    ];
    if (phone && phone !== window._originalPatientPhone) {
      requests.push(
        fetch(API + "/patients/" + currentPatient.id + "/phone", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phone }),
        }),
      );
    }
    await Promise.all(requests);
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
  if (tab === "recs") loadConsultationsTab();
  if (tab === "summary") loadDoctorSummary();
}
