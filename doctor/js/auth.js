let loginPhone = "";

function showErr(msg) {
  const el = document.getElementById("login-error");
  el.textContent = msg;
  el.style.display = "block";
}
function clearErr() {
  document.getElementById("login-error").style.display = "none";
}

function backToPhone() {
  document.getElementById("step-phone").style.display = "block";
  document.getElementById("step-passcode").style.display = "none";
  document.getElementById("step-register").style.display = "none";
  document.getElementById("step-reveal").style.display = "none";
  document.getElementById("login-sub-text").textContent =
    "Enter your WhatsApp number";
  clearErr();
}

function handlePhoneContinue() {
  const input = document
    .getElementById("phone-input")
    .value.trim()
    .replace(/\s/g, "");
  clearErr();
  if (input.length < 10) {
    showErr("Please enter a valid 10-digit number.");
    return;
  }
  loginPhone = "+91" + input;
  document.getElementById("step-phone").style.display = "none";
  document.getElementById("step-passcode").style.display = "block";
  document.getElementById("login-sub-text").textContent =
    "Enter your 6-digit passcode";
  document.getElementById("passcode-input").focus();
}

async function handleVerifyPasscode() {
  const passcode = document.getElementById("passcode-input").value.trim();
  clearErr();
  if (passcode.length < 6) {
    showErr("Enter your 6-digit passcode.");
    return;
  }
  const btn = document.getElementById("verify-passcode-btn");
  btn.disabled = true;
  btn.textContent = "Verifying...";
  try {
    const data = await apiPost("/doctor/auth/verify-passcode", {
      phone_number: loginPhone,
      passcode,
    });
    if (data.token && data.doctor) {
      setToken(data.token);
      currentDoctor = data.doctor;
      localStorage.setItem("kado_doctor", JSON.stringify(data.doctor));
      await loadPatientsScreen();
      startNotificationPolling();
      return;
    }
    if (data.error === "Doctor not found. Please register first.") {
      document.getElementById("step-passcode").style.display = "none";
      document.getElementById("step-register").style.display = "block";
      document.getElementById("login-sub-text").textContent =
        "Create your doctor profile";
      clearErr();
      btn.disabled = false;
      btn.textContent = "Login";
      return;
    }
    showErr(data.error || "Incorrect passcode. Please try again.");
  } catch (e) {
    showErr("Something went wrong.");
  }
  btn.disabled = false;
  btn.textContent = "Login";
}

async function handleRegister() {
  const name = document.getElementById("name-input").value.trim();
  const spec = document.getElementById("spec-input").value.trim();
  clearErr();
  if (!name) {
    showErr("Please enter your name.");
    return;
  }
  const btn = document.getElementById("register-btn");
  btn.disabled = true;
  btn.textContent = "Creating account...";
  try {
    const data = await apiPost("/doctor/register", {
      phone_number: loginPhone,
      name,
      specialization: spec || null,
    });
    if (data.token && data.id) {
      setToken(data.token);
      currentDoctor = data;
      localStorage.setItem("kado_doctor", JSON.stringify(data));
      document.getElementById("step-register").style.display = "none";
      document.getElementById("step-reveal").style.display = "block";
      document.getElementById("reveal-passcode").textContent =
        data.passcode || "—";
      document.getElementById("login-sub-text").textContent = "Your passcode";
    } else {
      showErr(data.error || "Could not create account.");
    }
  } catch (e) {
    showErr("Something went wrong.");
  }
  btn.disabled = false;
  btn.textContent = "Create account";
}

async function continueAfterReveal() {
  await loadPatientsScreen();
  startNotificationPolling();
}

function logoutDoctor() {
  if (_notifPollInterval) {
    clearInterval(_notifPollInterval);
    _notifPollInterval = null;
  }
  currentDoctor = null;
  clearToken();
  localStorage.removeItem("kado_doctor");
  showScreen("login");
  backToPhone();
}
