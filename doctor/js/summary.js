async function loadDoctorSummary() {
  const container = document.getElementById("tab-content-summary");
  container.innerHTML =
    '<div class="loading"><div class="spinner"></div><div class="loading-text">Checking summary...</div></div>';
  try {
    const summaryData = await apiFetch(
      "/patients/" +
        currentPatient.id +
        "/summary?type=doctor&speciality=general",
    );
    const staleNotice =
      summaryData.is_stale && summaryData.summary
        ? '<div style="background:#FFF4E8;border-radius:12px;padding:12px;font-size:12px;color:#B86A1A;margin-bottom:16px;">' +
          (summaryData.current_report_count -
            summaryData.summary.report_count) +
          " new report(s) since last summary.</div>"
        : "";
    const specLabel = currentDoctor.specialization
      ? currentDoctor.specialization + " Summary"
      : "Speciality Summary";

    let historyHtml = "";
    try {
      const historyData = await apiFetch(
        "/patients/" + currentPatient.id + "/history-sessions/latest",
      );
      if (historyData.collected_data) {
        historyHtml = renderHistoryData(historyData.collected_data);
      }
    } catch (e) {}

    container.innerHTML =
      '<div style="padding:16px 20px;">' +
      staleNotice +
      '<div style="font-size:11px;color:#7A9A7A;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Summary type</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:20px;">' +
      '<button class="summary-type-btn active" id="summary-type-general" onclick="selectSummaryType(\'general\')">General Summary</button>' +
      '<button class="summary-type-btn" id="summary-type-speciality" onclick="selectSummaryType(\'speciality\')">' +
      specLabel +
      "</button>" +
      "</div>" +
      '<button onclick="generateDoctorSummary()" id="doc-summary-btn" style="width:100%;background:#2D6BE4;color:white;border:none;padding:14px;border-radius:12px;font-size:14px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif;margin-bottom:16px;">Generate Clinical Summary</button>' +
      (summaryData.summary && !summaryData.is_stale
        ? renderDoctorSummary(
            summaryData.summary.content,
            summaryData.summary.biomarker_trends,
          )
        : "") +
      historyHtml +
      "</div>";
  } catch (e) {
    container.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">&#9888;&#65039;</div><div class="empty-state-title">Could not load summary</div></div>';
  }
}

function selectSummaryType(type) {
  doctorSummaryType = type;
  document
    .getElementById("summary-type-general")
    .classList.toggle("active", type === "general");
  document
    .getElementById("summary-type-speciality")
    .classList.toggle("active", type === "speciality");
  if (type === "speciality" && !currentDoctor.specialization) {
    document.getElementById("speciality-modal-input").value = "";
    document.getElementById("speciality-modal").classList.add("open");
  }
}

function closeSpecialityModal() {
  document.getElementById("speciality-modal").classList.remove("open");
}

async function saveAndGenerateSpecialitySummary() {
  const spec = document.getElementById("speciality-modal-input").value.trim();
  if (!spec) return;
  try {
    await fetch(API + "/doctor/update-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctor_id: currentDoctor.id,
        specialization: spec,
      }),
    });
    currentDoctor.specialization = spec;
    localStorage.setItem("kado_doctor", JSON.stringify(currentDoctor));
  } catch (e) {}
  closeSpecialityModal();
  doctorSummarySpeciality = spec;
  await triggerSummaryGeneration();
}

async function generateDoctorSummary() {
  if (doctorSummaryType === "speciality") {
    if (!currentDoctor.specialization) {
      document.getElementById("speciality-modal-input").value = "";
      document.getElementById("speciality-modal").classList.add("open");
      return;
    }
    doctorSummarySpeciality = currentDoctor.specialization;
  } else {
    doctorSummarySpeciality = "general";
  }
  await triggerSummaryGeneration();
}

async function triggerSummaryGeneration() {
  const btn = document.getElementById("doc-summary-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Generating... (15-20 seconds)";
  }
  try {
    const cached = await apiFetch(
      "/patients/" +
        currentPatient.id +
        "/summary?type=doctor&speciality=" +
        doctorSummarySpeciality,
    );
    if (cached.summary && !cached.is_stale) {
      const container = document.getElementById("tab-content-summary");
      const existing = container.querySelector(".summary-result");
      if (existing) existing.remove();
      container
        .querySelector("div")
        .insertAdjacentHTML(
          "beforeend",
          renderDoctorSummary(
            cached.summary.content,
            cached.summary.biomarker_trends,
          ),
        );
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Generate Clinical Summary";
      }
      return;
    }
    const res = await fetch(
      API + "/patients/" + currentPatient.id + "/summary",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "doctor",
          speciality: doctorSummarySpeciality,
        }),
      },
    );
    const data = await res.json();
    if (data.success) {
      const container = document.getElementById("tab-content-summary");
      const existing = container.querySelector(".summary-result");
      if (existing) existing.remove();
      container
        .querySelector("div")
        .insertAdjacentHTML(
          "beforeend",
          renderDoctorSummary(data.content, data.trends),
        );
    }
  } catch (e) {
    alert("Could not generate summary.");
  }
  if (btn) {
    btn.disabled = false;
    btn.textContent = "Generate Clinical Summary";
  }
}

function renderDoctorSummary(content, trends) {
  return (
    '<div class="summary-result" style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,0.05);">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
    "<div style=\"font-family:'Fraunces',serif;font-size:16px;font-weight:300;color:#1A2D22;\">Clinical Summary</div>" +
    '<button onclick="printDoctorSummary()" style="background:none;border:1.5px solid #2D6BE4;border-radius:8px;padding:6px 12px;font-size:12px;color:#2D6BE4;cursor:pointer;font-family:\'DM Sans\',sans-serif;">Share PDF</button>' +
    '</div><div id="doc-summary-content">' +
    content +
    "</div></div>"
  );
}

function renderHistoryData(content) {
  return (
    '<div class="summary-result" style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,0.05);margin-top:16px;">' +
    '<div id="history-data-content">' +
    content +
    "</div></div>"
  );
}

function printDoctorSummary() {
  const content = document.getElementById("doc-summary-content")
    ? document.getElementById("doc-summary-content").innerHTML
    : "";
  const w = window.open("", "_blank");
  w.document.write(
    "<html><head><title>Clinical Summary</title><style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto;}h3{font-size:16px;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:8px;}p,li{font-size:13px;line-height:1.7;color:#333;}</style></head><body>" +
      '<div style="text-align:center;margin-bottom:32px;"><div style="font-size:24px;font-weight:bold;">kado.care</div>' +
      '<div style="font-size:14px;color:#666;">Clinical Summary - ' +
      (currentPatient ? currentPatient.name : "") +
      "</div>" +
      '<div style="font-size:12px;color:#999;">' +
      new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }) +
      "</div></div>" +
      content +
      '<div style="margin-top:40px;text-align:center;font-size:11px;color:#ccc;">Generated by kado.care</div></body></html>',
  );
  w.document.close();
  w.print();
}
