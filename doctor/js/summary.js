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

    let agentHtml = "";
    let hasHistoryData = false;
    try {
      const historyData = await apiFetch(
        "/patients/" + currentPatient.id + "/history-sessions/latest",
      );
      if (historyData.collected_data) {
        hasHistoryData = true;
        agentHtml =
          renderHistoryData(historyData.collected_data) +
          renderAgentFeedbackForm();
      }
    } catch (e) {}
    if (!hasHistoryData) {
      agentHtml =
        '<div class="empty-state" style="padding:30px 0;"><div class="empty-state-title">No preconsult session completed yet</div></div>';
    }

    const generalHtml =
      staleNotice +
      '<button onclick="generateDoctorSummary()" id="doc-summary-btn" style="width:100%;background:#2D6BE4;color:white;border:none;padding:14px;border-radius:12px;font-size:14px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif;margin-bottom:16px;">Generate Clinical Summary</button>' +
      (summaryData.summary && !summaryData.is_stale
        ? renderDoctorSummary(
            summaryData.summary.content,
            summaryData.summary.biomarker_trends,
          )
        : "");

    container.innerHTML =
      '<div style="padding:16px 20px;">' +
      '<div style="font-size:11px;color:#7A9A7A;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Summary type</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:20px;">' +
      '<button class="summary-type-btn active" id="summary-type-general" onclick="selectSummaryType(\'general\')">General Summary</button>' +
      '<button class="summary-type-btn" id="summary-type-agent" onclick="selectSummaryType(\'agent\')">Agent Summary</button>' +
      "</div>" +
      '<div id="summary-panel-general">' +
      generalHtml +
      "</div>" +
      '<div id="summary-panel-agent" style="display:none">' +
      agentHtml +
      "</div>" +
      "</div>";
    if (hasHistoryData) {
      agentFeedbackScope = "patient";
      loadAgentFeedbackList();
    }
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
    .getElementById("summary-type-agent")
    .classList.toggle("active", type === "agent");
  document.getElementById("summary-panel-general").style.display =
    type === "general" ? "block" : "none";
  document.getElementById("summary-panel-agent").style.display =
    type === "agent" ? "block" : "none";
}

async function generateDoctorSummary() {
  const btn = document.getElementById("doc-summary-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Generating... (15-20 seconds)";
  }
  try {
    const cached = await apiFetch(
      "/patients/" +
        currentPatient.id +
        "/summary?type=doctor&speciality=general",
    );
    if (cached.summary && !cached.is_stale) {
      const panel = document.getElementById("summary-panel-general");
      const existing = panel.querySelector(".summary-result");
      if (existing) existing.remove();
      panel.insertAdjacentHTML(
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
          speciality: "general",
        }),
      },
    );
    const data = await res.json();
    if (data.success) {
      const panel = document.getElementById("summary-panel-general");
      const existing = panel.querySelector(".summary-result");
      if (existing) existing.remove();
      panel.insertAdjacentHTML(
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

function renderAgentFeedbackForm() {
  return (
    '<div class="summary-result" style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,0.05);margin-top:16px;">' +
    "<div style=\"font-family:'Fraunces',serif;font-size:16px;font-weight:300;color:#1A2D22;margin-bottom:10px;\">Feedback for the agent</div>" +
    '<textarea class="modal-textarea" id="agent-feedback-input" placeholder="How should the agent behave differently?" style="margin-bottom:10px;"></textarea>' +
    '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
    '<button class="summary-type-btn active" id="feedback-scope-patient" onclick="selectAgentFeedbackScope(\'patient\')">This patient only</button>' +
    '<button class="summary-type-btn" id="feedback-scope-global" onclick="selectAgentFeedbackScope(\'global\')">All my patients</button>' +
    "</div>" +
    '<button onclick="submitAgentFeedback()" id="agent-feedback-submit-btn" style="width:100%;background:#2D6BE4;color:white;border:none;padding:14px;border-radius:12px;font-size:14px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif;">Save Feedback</button>' +
    '<div id="agent-feedback-list" style="margin-top:14px;"></div>' +
    "</div>"
  );
}

function selectAgentFeedbackScope(scope) {
  agentFeedbackScope = scope;
  document
    .getElementById("feedback-scope-patient")
    .classList.toggle("active", scope === "patient");
  document
    .getElementById("feedback-scope-global")
    .classList.toggle("active", scope === "global");
}

async function submitAgentFeedback() {
  const input = document.getElementById("agent-feedback-input");
  const feedback = input.value.trim();
  if (!feedback) return;
  const btn = document.getElementById("agent-feedback-submit-btn");
  btn.disabled = true;
  try {
    const res = await fetch(
      API + "/patients/" + currentPatient.id + "/agent-feedback",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: currentDoctor.id,
          feedback,
          scope: agentFeedbackScope,
        }),
      },
    );
    if (!res.ok) throw new Error("Failed");
    input.value = "";
    await loadAgentFeedbackList();
  } catch (e) {
    alert("Could not save feedback.");
  }
  btn.disabled = false;
}

async function loadAgentFeedbackList() {
  const listEl = document.getElementById("agent-feedback-list");
  if (!listEl) return;
  try {
    const entries = await apiFetch(
      "/patients/" + currentPatient.id + "/agent-feedback",
    );
    listEl.innerHTML = renderAgentFeedbackList(entries || []);
  } catch (e) {}
}

function renderAgentFeedbackList(entries) {
  if (!entries.length) return "";
  return entries
    .map((e) => {
      const date = new Date(e.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const scopeLabel = e.scope === "global" ? "All patients" : "This patient";
      return (
        '<div style="border-top:1px solid #EEF0EE;padding:10px 0;">' +
        '<div style="font-size:11px;color:#7A9A7A;margin-bottom:3px;">' +
        date +
        " &middot; " +
        scopeLabel +
        "</div>" +
        '<div style="font-size:13px;color:#1A2D22;">' +
        e.feedback +
        "</div></div>"
      );
    })
    .join("");
}

function _hdSection(title, innerHtml) {
  if (!innerHtml) return "";
  return (
    '<div style="margin-bottom:16px;">' +
    "<div style=\"font-family:'Fraunces',serif;font-size:14px;font-weight:500;color:#1A2D22;margin-bottom:6px;\">" +
    title +
    "</div>" +
    innerHtml +
    "</div>"
  );
}

function _hdList(items) {
  if (!items || !items.length) return "";
  return (
    '<ul style="margin:0;padding-left:18px;font-size:13px;color:#3A4A3E;line-height:1.6;">' +
    items.map((i) => "<li>" + i + "</li>").join("") +
    "</ul>"
  );
}

function _hdRow(label, value) {
  if (value === null || value === undefined || value === "") return "";
  return (
    '<div style="font-size:13px;color:#3A4A3E;line-height:1.6;"><strong style="color:#1A2D22;">' +
    label +
    ":</strong> " +
    value +
    "</div>"
  );
}

function renderHistoryData(content) {
  let data = content;
  if (typeof content === "string") {
    try {
      data = JSON.parse(content);
    } catch (e) {
      data = null;
    }
  }

  if (!data || typeof data !== "object") {
    return (
      '<div class="summary-result" style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,0.05);margin-top:16px;">' +
      '<div id="history-data-content" style="white-space:pre-wrap;font-size:12px;color:#3A4A3E;">' +
      content +
      "</div></div>"
    );
  }

  if (data.raw) {
    return (
      '<div class="summary-result" style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,0.05);margin-top:16px;">' +
      "<div style=\"font-family:'Fraunces',serif;font-size:16px;font-weight:300;color:#1A2D22;margin-bottom:10px;\">Preconsult History</div>" +
      '<div id="history-data-content" style="white-space:pre-wrap;font-size:12px;color:#3A4A3E;">' +
      data.raw +
      "</div></div>"
    );
  }

  let body = "";

  const meta = [];
  if (data.call_date) meta.push(data.call_date);
  if (data.call_duration_minutes)
    meta.push(data.call_duration_minutes + " min");
  if (meta.length) {
    body +=
      '<div style="font-size:12px;color:#7A9A7A;margin-bottom:12px;">' +
      meta.join(" &middot; ") +
      "</div>";
  }

  if (data.reason_for_visit && data.reason_for_visit.reason) {
    body += _hdSection(
      "Reason for Visit",
      _hdRow("Reason", data.reason_for_visit.reason) +
        _hdRow("Visit type", data.reason_for_visit.visit_type),
    );
  }

  if (data.current_symptoms && data.current_symptoms.length) {
    body += _hdSection(
      "Current Symptoms",
      data.current_symptoms
        .map(
          (s) =>
            '<div style="border-top:1px solid #EEF0EE;padding:8px 0;">' +
            '<div style="font-size:13px;font-weight:500;color:#1A2D22;">' +
            (s.symptom || "Symptom") +
            "</div>" +
            _hdRow("Onset", s.onset) +
            _hdRow("Duration", s.duration) +
            _hdRow("Severity", s.severity) +
            _hdRow("Frequency", s.frequency) +
            _hdRow(
              "Aggravating factors",
              s.aggravating_factors && s.aggravating_factors.length
                ? s.aggravating_factors.join(", ")
                : null,
            ) +
            _hdRow(
              "Relieving factors",
              s.relieving_factors && s.relieving_factors.length
                ? s.relieving_factors.join(", ")
                : null,
            ) +
            _hdRow("Prior episodes", s.prior_episodes) +
            (s.patient_description
              ? '<div style="font-size:12px;color:#7A9A7A;font-style:italic;margin-top:4px;">"' +
                s.patient_description +
                '"</div>'
              : "") +
            "</div>",
        )
        .join(""),
    );
  }

  if (data.medication_update) {
    const m = data.medication_update;
    body += _hdSection(
      "Medication Update",
      _hdRow("Taking as prescribed", m.taking_as_prescribed) +
        _hdRow(
          "Additional medications",
          m.additional_medications && m.additional_medications.length
            ? m.additional_medications.join(", ")
            : null,
        ) +
        _hdRow(
          "Stopped medications",
          m.stopped_medications && m.stopped_medications.length
            ? m.stopped_medications.join(", ")
            : null,
        ) +
        _hdRow("Patient comment", m.patient_comment),
    );
  }

  if (data.family_history && data.family_history.length) {
    body += _hdSection(
      "Family History",
      _hdList(
        data.family_history.map(
          (f) => (f.condition || "") + " (" + (f.relation || "") + ")",
        ),
      ),
    );
  }

  if (data.lifestyle) {
    const l = data.lifestyle;
    body += _hdSection(
      "Lifestyle",
      _hdRow("Diet", l.diet) +
        _hdRow("Sleep", l.sleep) +
        _hdRow("Exercise", l.exercise) +
        _hdRow("Smoking", l.smoking) +
        _hdRow("Alcohol", l.alcohol) +
        _hdRow("Other", l.other),
    );
  }

  if (data.additional_concerns && data.additional_concerns.length) {
    body += _hdSection(
      "Additional Concerns",
      _hdList(data.additional_concerns),
    );
  }

  if (data.history_conflicts && data.history_conflicts.length) {
    body += _hdSection(
      "History Conflicts",
      data.history_conflicts
        .map(
          (c) =>
            '<div style="border-top:1px solid #EEF0EE;padding:8px 0;">' +
            '<div style="font-size:11px;color:#B84040;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">' +
            (c.flag_type || "").replace(/_/g, " ") +
            "</div>" +
            _hdRow("Topic", c.topic) +
            _hdRow("MS-Doctor says", c.ms_doctor_says) +
            _hdRow("Patient says", c.patient_says) +
            "</div>",
        )
        .join(""),
    );
  }

  if (data.call_quality) {
    body += _hdSection(
      "Call Quality",
      _hdRow("Completeness", data.call_quality.completeness) +
        _hdRow("Notes", data.call_quality.notes),
    );
  }

  if (!body) {
    body =
      '<div style="font-size:13px;color:#7A9A7A;">No structured data extracted from this session.</div>';
  }

  return (
    '<div class="summary-result" style="background:white;border-radius:16px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,0.05);margin-top:16px;">' +
    "<div style=\"font-family:'Fraunces',serif;font-size:16px;font-weight:300;color:#1A2D22;margin-bottom:10px;\">Preconsult History</div>" +
    '<div id="history-data-content">' +
    body +
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
