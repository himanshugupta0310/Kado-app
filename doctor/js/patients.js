async function loadPatientsScreen() {
  document.getElementById("avatar-main").textContent = (
    currentDoctor.name || "D"
  )
    .charAt(0)
    .toUpperCase();
  document.getElementById("patients-greeting").textContent = getGreeting();
  document.getElementById("patients-title").textContent =
    "Dr. " + (currentDoctor.name || "").split(" ").pop() + "'s Patients";
  showScreen("patients");
  document.getElementById("invite-fab").style.display = "block";
  await loadPatients();
}

async function loadPatients() {
  const container = document.getElementById("patients-list");
  container.innerHTML =
    '<div class="loading"><div class="spinner"></div><div class="loading-text">Loading patients...</div></div>';
  try {
    const patients = await apiFetch(
      "/doctor/patients?doctor_id=" + currentDoctor.id,
    );
    document.getElementById("patients-sub").textContent =
      patients.length +
      " patient" +
      (patients.length !== 1 ? "s" : "") +
      " linked";
    if (!patients || patients.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">&#128101;</div><div class="empty-state-title">No patients yet</div><div class="empty-state-sub">Tap "+ Add patient" to get started</div></div>';
      return;
    }

    const [reportCounts, notesArr] = await Promise.all([
      Promise.all(
        patients.map(async (p) => {
          try {
            const r = await apiFetch("/records?patient_id=" + p.id);
            return r ? r.length : 0;
          } catch {
            return 0;
          }
        }),
      ),
      Promise.all(
        patients.map(async (p) => {
          try {
            return await apiFetch(
              "/patients/" +
                p.id +
                "/doctor-notes?doctor_id=" +
                currentDoctor.id,
            );
          } catch {
            return {};
          }
        }),
      ),
    ]);

    container.innerHTML =
      '<div class="patient-list">' +
      patients
        .map((p, i) => {
          const initial = (p.name || "?").charAt(0).toUpperCase();
          const agegender = [
            p.age ? p.age + "yrs" : null,
            p.gender ? p.gender.charAt(0).toUpperCase() : null,
          ]
            .filter(Boolean)
            .join(", ");
          const meta = agegender || "—";
          const count = reportCounts[i];
          const notes = notesArr[i] || {};
          const badge =
            count > 0
              ? '<div style="background:#EEF4FF;color:#2D6BE4;font-size:10px;font-weight:600;padding:3px 10px;border-radius:100px;flex-shrink:0;">' +
                count +
                " report" +
                (count !== 1 ? "s" : "") +
                "</div>"
              : '<div style="background:#E8F5F0;color:#2D8A6A;font-size:10px;font-weight:600;padding:3px 10px;border-radius:100px;flex-shrink:0;">No reports</div>';

          const diagTags = notes.diagnosis
            ? notes.diagnosis
                .split(",")
                .map(
                  (d) =>
                    '<span class="tag tag-diagnosis">' + d.trim() + "</span>",
                )
                .join("")
            : "";

          return (
            '<div class="patient-card" onclick="openPatient(' +
            i +
            ')">' +
            '<div class="patient-avatar">' +
            initial +
            "</div>" +
            '<div class="patient-info">' +
            '<div style="display:flex;align-items:baseline;gap:6px;">' +
            '<div class="patient-name">' +
            (p.name || "Unknown") +
            "</div>" +
            '<div style="font-size:11px;color:#7A9A7A;">' +
            meta +
            "</div>" +
            "</div>" +
            (diagTags
              ? '<div class="patient-tags">' + diagTags + "</div>"
              : "") +
            "</div>" +
            '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:80px;flex-shrink:0;">' +
            badge +
            '<button onclick="event.stopPropagation();openPatientNotesModalFromList(' +
            i +
            ')" style="background:none;border:none;font-size:11px;color:#2D6BE4;cursor:pointer;font-family:\'DM Sans\',sans-serif;padding:0;">Edit</button>' +
            "</div>" +
            '<div class="patient-arrow">&#8250;</div>' +
            "</div>"
          );
        })
        .join("") +
      "</div>";
    window._patients = patients;
    window._patientNotes = notesArr;
  } catch (e) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">&#9888;&#65039;</div><div class="empty-state-title">Could not load patients</div></div>';
  }
}

async function openPatient(i) {
  currentPatient = window._patients[i];
  currentPatientNotes = window._patientNotes
    ? window._patientNotes[i] || {}
    : {};
  activeBucket = "all";
  document.getElementById("detail-patient-name").textContent =
    currentPatient.name || "Patient";
  window._tileUploadPatientId = currentPatient.id;
  showScreen("patient-detail");
  renderPatientDetailBars();
  switchTab("records");
}
