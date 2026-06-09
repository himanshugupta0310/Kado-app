function showToast(msg, type) {
  const el = document.getElementById("kado-toast");
  if (!el) return;
  el.textContent = msg;
  el.style.background = type === "error" ? "#C0392B" : "#1A2D22";
  el.style.display = "block";
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.display = "none";
  }, 3000);
}

function triggerTileUpload(patientId, event) {
  event.stopPropagation();
  window._tileUploadPatientId = patientId;
  document.getElementById("tile-upload-input").click();
}

async function doTileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const patientId = window._tileUploadPatientId;
  if (!patientId) return;
  showToast("Uploading...", "info");
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", patientId);
    formData.append("document_type", "prescription");
    const res = await fetch(API + "/doctor/upload-report", {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      showToast("Report uploaded successfully!", "success");
      setTimeout(() => loadPatientRecords(), 1500);
    } else if (res.status === 409) {
      showToast("This report was already uploaded.", "error");
    } else {
      showToast(data.error || "Upload failed.", "error");
    }
  } catch (e) {
    showToast("Upload failed.", "error");
  }
  input.value = "";
}

async function uploadPrescription(input) {
  const file = input.files[0];
  if (!file) return;
  const status = document.getElementById("rx-upload-status");
  status.style.display = "block";
  status.textContent = "Uploading...";
  status.style.background = "#E8F5F0";
  status.style.color = "#2D8A6A";
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("patient_id", currentPatient.id);
    formData.append("doctor_id", currentDoctor.id);
    formData.append("document_type", "prescription");
    const res = await fetch(API + "/doctor/upload-report", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      status.textContent = "Uploaded!";
      setTimeout(() => {
        status.style.display = "none";
        loadPrescriptions();
      }, 2000);
    } else if (res.status === 409) {
      status.style.background = "#FFF0F0";
      status.style.color = "#C0392B";
      status.textContent = "This report was already uploaded.";
    } else {
      status.style.background = "#FFF0F0";
      status.style.color = "#C0392B";
      status.textContent = "Upload failed.";
    }
  } catch (e) {
    status.style.background = "#FFF0F0";
    status.style.color = "#C0392B";
    status.textContent = "Upload failed.";
  }
  input.value = "";
}

async function loadPrescriptions() {
  const container = document.getElementById("rx-list");
  if (!container) return;
  try {
    const reports = await apiFetch("/records?patient_id=" + currentPatient.id);
    const prescriptions = (reports || []).filter((r) => {
      const isRx =
        r.document_type === "prescription" ||
        (r.report_type || "").toLowerCase().includes("prescription") ||
        (r.report_type || "").toLowerCase().includes("consultation");
      const byMe =
        Array.isArray(r.uploaded_by_doctor_ids) &&
        r.uploaded_by_doctor_ids.includes(currentDoctor.id);
      return isRx && byMe;
    });
    if (prescriptions.length === 0) {
      container.innerHTML =
        '<div style="font-size:13px;color:#7A9A7A;padding:8px 0;">No prescriptions from you yet.</div>';
      return;
    }
    container.innerHTML = prescriptions
      .map((r) => {
        const date = r.report_date
          ? new Date(r.report_date + "T12:00:00").toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Date unknown";
        return (
          '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F0F2F0;cursor:pointer;" onclick="window.open(\'' +
          r.file_url +
          "', '_blank')\">" +
          '<div style="width:36px;height:36px;border-radius:10px;background:#FFF4E8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">&#128203;</div>' +
          '<div style="flex:1;"><div style="font-size:13px;font-weight:500;color:#1A2D22;">Prescription</div><div style="font-size:11px;color:#7A9A7A;">' +
          date +
          "</div></div>" +
          '<div style="font-size:18px;color:#C0D0C0;">&#8250;</div></div>'
        );
      })
      .join("");
  } catch (e) {
    container.innerHTML =
      '<div style="font-size:13px;color:#7A9A7A;">Could not load.</div>';
  }
}

async function loadPatientRecords() {
  const container = document.getElementById("tab-content-records");
  container.innerHTML =
    '<div class="loading"><div class="spinner"></div></div>';
  try {
    allReports = await apiFetch("/records?patient_id=" + currentPatient.id);
    if (!allReports || allReports.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><div class="empty-state-icon">&#128193;</div><div class="empty-state-title">No records yet</div></div>';
      return;
    }
    renderRecordsBucket(activeBucket);
  } catch (e) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">&#9888;&#65039;</div><div class="empty-state-title">Could not load records</div></div>';
  }
}

function getBucket(r) {
  const t = (r.document_type || r.report_type || "").toLowerCase();
  if (
    t.includes("blood") ||
    t.includes("lab") ||
    t.includes("pathology") ||
    t.includes("haematology") ||
    t.includes("biochemistry")
  )
    return "blood";
  if (
    t === "imaging" ||
    t.includes("mri") ||
    t.includes("ct scan") ||
    t === "x-ray" ||
    t.includes("xray") ||
    t.includes("ultrasound") ||
    t.includes("usg") ||
    t.includes("pet scan") ||
    t.includes("dexa") ||
    t.includes("mammogram") ||
    t.includes("angiograph") ||
    t.includes("radiolog")
  )
    return "imaging";
  if (
    t === "prescription" ||
    t.includes("prescription") ||
    t.includes("consultation")
  )
    return "prescription";
  return "other";
}

function renderRecordsBucket(bucket) {
  activeBucket = bucket;
  const container = document.getElementById("tab-content-records");
  const filtered =
    bucket === "all"
      ? allReports
      : allReports.filter((r) => getBucket(r) === bucket);
  const bucketHtml =
    '<div class="bucket-tabs">' +
    ["all", "blood", "imaging", "prescription", "other"]
      .map((b) => {
        const labels = {
          all: "All",
          blood: "Blood Tests",
          imaging: "Imaging",
          prescription: "Prescriptions",
          other: "Others",
        };
        return (
          '<div class="bucket-tab ' +
          (bucket === b ? "active" : "") +
          '" onclick="renderRecordsBucket(\'' +
          b +
          "')\">" +
          labels[b] +
          "</div>"
        );
      })
      .join("") +
    "</div>";
  if (!filtered || filtered.length === 0) {
    container.innerHTML =
      bucketHtml +
      '<div class="empty-state"><div class="empty-state-icon">&#128193;</div><div class="empty-state-title">No records here</div></div>';
    return;
  }
  const grouped = {};
  filtered.forEach((r) => {
    const key = r.report_date
      ? new Date(r.report_date + "T12:00:00").toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })
      : "Date unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });
  let html = bucketHtml;
  Object.entries(grouped)
    .sort((a, b) => {
      if (a[0] === "Date unknown") return 1;
      if (b[0] === "Date unknown") return -1;
      return (
        new Date(b[1][0].report_date || b[1][0].created_at) -
        new Date(a[1][0].report_date || a[1][0].created_at)
      );
    })
    .forEach(([month, reps]) => {
      html +=
        '<div class="section"><div class="section-title">' + month + "</div>";
      reps.forEach((r) => {
        const date = r.report_date
          ? new Date(r.report_date + "T12:00:00").toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })
          : "Date unknown";
        const tags = (r.disease_tags || [])
          .slice(0, 2)
          .map((t) => '<span class="tag tag-disease">' + t + "</span>")
          .join("");
        const unconfirmedTag =
          r.identity_confirmed === false
            ? '<span class="tag tag-unconfirmed">Unconfirmed</span>'
            : "";
        html +=
          '<div class="record" onclick="window.open(\'' +
          r.file_url +
          "','_blank')\">" +
          '<div class="record-icon ' +
          getIconBg(r.report_type) +
          '">' +
          getReportIcon(r.report_type) +
          "</div>" +
          '<div class="record-body"><div class="record-top"><div class="record-name">' +
          capitalize(r.report_type || "Health Report") +
          '</div><div class="record-date">' +
          date +
          "</div></div>" +
          '<div class="record-meta"><span class="tag tag-type">' +
          (r.report_type || "Report") +
          "</span>" +
          tags +
          unconfirmedTag +
          "</div></div>" +
          '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;">' +
          "<button onclick=\"event.stopPropagation();openReportEditModal('" +
          r.id +
          "')\" style=\"background:none;border:none;font-size:11px;color:#2D6BE4;cursor:pointer;font-family:'DM Sans',sans-serif;padding:0;\">Edit</button>" +
          '<span style="font-size:18px;color:#C0D0C0;">&#8250;</span>' +
          "</div></div>";
      });
      html += "</div>";
    });
  container.innerHTML = html;
}

function openReportEditModal(reportId) {
  const r = allReports.find((rep) => rep.id === reportId);
  if (!r) return;
  currentEditReport = r;
  _reportPatientSelected = null;
  document.getElementById("report-modal-title").textContent = "Edit Report";
  document.getElementById("edit-report-name").value = r.report_type || "";
  document.getElementById("edit-report-date").value = r.report_date || "";
  document.getElementById("report-patient-search").value = "";
  document.getElementById("report-patient-dropdown").innerHTML = "";
  document.getElementById("report-edit-modal").classList.add("open");
}

function closeReportEditModal() {
  document.getElementById("report-edit-modal").classList.remove("open");
  currentEditReport = null;
  _reportPatientSelected = null;
}

function fuzzyMatchPatient(query, name) {
  if (!query.trim()) return true;
  const words = query.toLowerCase().trim().split(/\s+/);
  const s = (name || "").toLowerCase();
  return words.every((w) => s.includes(w));
}

function filterReportPatients() {
  const q = document.getElementById("report-patient-search").value;
  renderReportPatientList(q);
}

function renderReportPatientList(query) {
  const container = document.getElementById("report-patient-dropdown");
  if (!container) return;
  if (!query.trim()) {
    container.innerHTML = "";
    return;
  }
  const patients = window._patients || [];
  const filtered = patients.filter((p) => fuzzyMatchPatient(query, p.name));
  if (filtered.length === 0) {
    container.innerHTML =
      '<div style="font-size:12px;color:#7A9A7A;padding:8px 12px;">No patients found</div>';
    return;
  }
  container.innerHTML = filtered
    .map((p) => {
      const isSelected =
        _reportPatientSelected && _reportPatientSelected.id === p.id;
      return (
        "<div onclick=\"selectReportPatient('" +
        p.id +
        '\')" style="padding:8px 12px;cursor:pointer;border-radius:8px;background:' +
        (isSelected ? "#EEF4FF" : "transparent") +
        ";color:" +
        (isSelected ? "#2D6BE4" : "#1A2D22") +
        ";font-size:13px;font-weight:" +
        (isSelected ? "600" : "400") +
        ';">' +
        (p.name || "Unknown") +
        (isSelected ? ' <span style="font-size:10px;">&#10003;</span>' : "") +
        "</div>"
      );
    })
    .join("");
}

function selectReportPatient(patientId) {
  const patients = window._patients || [];
  const p = patients.find((x) => x.id === patientId) || null;
  if (_reportPatientSelected && _reportPatientSelected.id === patientId) {
    _reportPatientSelected = null;
  } else {
    _reportPatientSelected = p;
  }
  const q = document.getElementById("report-patient-search").value;
  renderReportPatientList(q);
}

async function saveReportEdit() {
  if (!currentEditReport) return;
  const name = document.getElementById("edit-report-name").value.trim();
  const date = document.getElementById("edit-report-date").value;
  const updates = {};
  if (name) updates.report_type = name;
  if (date) updates.report_date = date;
  if (_reportPatientSelected) updates.patient_id = _reportPatientSelected.id;
  if (Object.keys(updates).length === 0) {
    closeReportEditModal();
    return;
  }
  try {
    const res = await fetch(API + "/reports/" + currentEditReport.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Save failed");
    closeReportEditModal();
    loadPatientRecords();
  } catch (e) {
    alert("Could not save report.");
  }
}
