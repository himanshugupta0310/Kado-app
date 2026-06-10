function openAddPatientSheet() {
  document.getElementById("add-patient-choice-overlay").classList.add("open");
}

function closeAddPatientSheet() {
  document
    .getElementById("add-patient-choice-overlay")
    .classList.remove("open");
}

function openInviteFromChoice() {
  closeAddPatientSheet();
  document.getElementById("patient-invite-phone").value = "";
  selectedInviteLanguage = "english";
  selectInviteLanguage("english");
  document.getElementById("invite-patient-overlay").classList.add("open");
}

function openAddPatientFormSheet() {
  closeAddPatientSheet();
  document.getElementById("add-patient-name").value = "";
  document.getElementById("add-patient-age").value = "";
  document.getElementById("add-patient-gender").value = "";
  document.getElementById("add-patient-phone").value = "";
  document.getElementById("add-patient-form-overlay").classList.add("open");
}

function closeAddPatientFormSheet() {
  document.getElementById("add-patient-form-overlay").classList.remove("open");
}

async function submitAddPatient() {
  const name = document.getElementById("add-patient-name").value.trim();
  const age = document.getElementById("add-patient-age").value.trim();
  const gender = document.getElementById("add-patient-gender").value;
  if (!name) {
    document.getElementById("add-patient-name").focus();
    return;
  }
  if (!age) {
    document.getElementById("add-patient-age").focus();
    return;
  }
  if (!gender) {
    document.getElementById("add-patient-gender").focus();
    return;
  }
  const btn = document.getElementById("add-patient-submit-btn");
  btn.disabled = true;
  btn.textContent = "Adding...";
  try {
    const phone = document.getElementById("add-patient-phone").value.trim();
    const body = { name, age, gender };
    if (phone) body.phone_number = phone;
    const data = await apiPost("/doctor/add-patient", body);
    if (data && data.id) {
      closeAddPatientFormSheet();
      await loadPatients();
    } else {
      alert(data.error || "Could not add patient.");
    }
  } catch (e) {
    alert("Could not add patient.");
  }
  btn.disabled = false;
  btn.textContent = "Add patient";
}

function selectInviteLanguage(lang) {
  selectedInviteLanguage = lang;
  ["english", "hindi", "hinglish", "punjabi", "kannada"].forEach((l) => {
    const btn = document.getElementById("lang-" + l);
    if (btn) btn.classList.toggle("active", l === lang);
  });
}

function openInvitePatientSheet() {
  document.getElementById("patient-invite-phone").value = "";
  selectedInviteLanguage = "english";
  selectInviteLanguage("english");
  document.getElementById("invite-patient-overlay").classList.add("open");
}

function closeInvitePatientSheet() {
  document.getElementById("invite-patient-overlay").classList.remove("open");
}

async function sendPatientInvite() {
  const btn = document.getElementById("invite-patient-btn");
  let body = { language: selectedInviteLanguage };
  if (docInviteMethod === "whatsapp") {
    const input = document
      .getElementById("patient-invite-phone")
      .value.trim()
      .replace(/\s/g, "");
    if (input.length < 10) {
      document.getElementById("patient-invite-phone").focus();
      return;
    }
    body.phone_number = "+91" + input;
  } else {
    const email = document.getElementById("patient-invite-email").value.trim();
    if (!email || !email.includes("@")) {
      document.getElementById("patient-invite-email").focus();
      return;
    }
    body.email = email;
  }
  btn.disabled = true;
  btn.textContent = "Sending...";
  try {
    const data = await apiPost("/doctor/invite-patient", body);
    if (data.success) {
      closeInvitePatientSheet();
      alert("Invite sent!");
    } else {
      alert(data.error || "Could not send invite.");
    }
  } catch (e) {
    alert("Could not send invite.");
  }
  btn.disabled = false;
  btn.textContent = "Send invite on WhatsApp";
}

function openInviteDoctorSheet() {
  document.getElementById("invite-doctor-name").value = "";
  document.getElementById("invite-doctor-phone").value = "";
  document.getElementById("invite-doctor-overlay").classList.add("open");
}

function closeInviteDoctorSheet() {
  document.getElementById("invite-doctor-overlay").classList.remove("open");
}

async function sendDoctorInvite() {
  const name = document.getElementById("invite-doctor-name").value.trim();
  const phoneInput = document
    .getElementById("invite-doctor-phone")
    .value.trim()
    .replace(/\s/g, "");
  if (!name) {
    document.getElementById("invite-doctor-name").focus();
    return;
  }
  if (phoneInput.length < 10) {
    document.getElementById("invite-doctor-phone").focus();
    return;
  }
  const btn = document.getElementById("invite-doctor-btn");
  btn.disabled = true;
  btn.textContent = "Sending...";
  try {
    const data = await apiPost("/doctor/invite-doctor", {
      name,
      phone_number: "+91" + phoneInput,
    });
    if (data.success) {
      closeInviteDoctorSheet();
      alert("Invite sent!");
    } else {
      alert(data.error || "Could not send invite.");
    }
  } catch (e) {
    alert("Could not send invite.");
  }
  btn.disabled = false;
  btn.textContent = "Send invite on WhatsApp";
}

function selectDocInviteMethod(method) {
  docInviteMethod = method;
  const waBtn = document.getElementById("doc-invite-method-wa");
  const emailBtn = document.getElementById("doc-invite-method-email");
  const waInput = document.getElementById("doc-invite-wa-input");
  const emailInput = document.getElementById("doc-invite-email-input");
  const langSection = document.getElementById("invite-language-section");
  const sendBtn = document.getElementById("invite-patient-btn");
  if (method === "whatsapp") {
    waBtn.style.borderColor = "#2D6BE4";
    waBtn.style.background = "#EEF4FF";
    waBtn.style.color = "#2D6BE4";
    emailBtn.style.borderColor = "#EEF0EE";
    emailBtn.style.background = "#F5F7F5";
    emailBtn.style.color = "#7A9A7A";
    waInput.style.display = "flex";
    emailInput.style.display = "none";
    langSection.style.display = "block";
    sendBtn.textContent = "Send invite on WhatsApp";
  } else {
    emailBtn.style.borderColor = "#2D6BE4";
    emailBtn.style.background = "#EEF4FF";
    emailBtn.style.color = "#2D6BE4";
    waBtn.style.borderColor = "#EEF0EE";
    waBtn.style.background = "#F5F7F5";
    waBtn.style.color = "#7A9A7A";
    emailInput.style.display = "flex";
    waInput.style.display = "none";
    langSection.style.display = "none";
    sendBtn.textContent = "Send invite by email";
  }
}
