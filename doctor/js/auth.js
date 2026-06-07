let loginPhone = "";
let _resendTimer = null;

function showErr(msg) {
  const el = document.getElementById("login-error");
  el.textContent = msg;
  el.style.display = "block";
}
function clearErr() {
  document.getElementById("login-error").style.display = "none";
}

function backToPhone() {
  clearInterval(_resendTimer);
  document.getElementById("step-phone").style.display = "block";
  document.getElementById("step-otp").style.display = "none";
  document.getElementById("step-register").style.display = "none";
  document.getElementById("login-sub-text").textContent =
    "Enter your WhatsApp number";
  const btn = document.getElementById("resend-btn");
  btn.disabled = true;
  btn.style.color = "#C0D0C0";
  btn.textContent = "Resend in 30s";
  clearErr();
}

function startResendCountdown(seconds = 30) {
  const btn = document.getElementById("resend-btn");
  btn.disabled = true;
  btn.style.color = "#C0D0C0";
  let remaining = seconds;
  btn.textContent = `Resend in ${remaining}s`;
  clearInterval(_resendTimer);
  _resendTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(_resendTimer);
      btn.disabled = false;
      btn.style.color = "#2D6BE4";
      btn.textContent = "Resend OTP";
    } else {
      btn.textContent = `Resend in ${remaining}s`;
    }
  }, 1000);
}

async function handleSendOtp() {
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
  const btn = document.getElementById("send-otp-btn");
  btn.disabled = true;
  btn.textContent = "Sending OTP...";
  try {
    const data = await apiPost("/doctor/auth/send-otp", {
      phone_number: loginPhone,
    });
    if (data.success) {
      document.getElementById("step-phone").style.display = "none";
      document.getElementById("step-otp").style.display = "block";
      document.getElementById("login-sub-text").textContent =
        `OTP sent to ${loginPhone} on WhatsApp`;
      document.getElementById("otp-input").focus();
      startResendCountdown(30);
    } else {
      showErr(data.error || "Could not send OTP.");
    }
  } catch (e) {
    showErr("Something went wrong. Please try again.");
  }
  btn.disabled = false;
  btn.textContent = "Send OTP";
}

async function handleResendOtp() {
  const btn = document.getElementById("resend-btn");
  btn.disabled = true;
  btn.textContent = "Sending...";
  try {
    await apiPost("/doctor/auth/send-otp", { phone_number: loginPhone });
  } catch {}
  startResendCountdown(30);
}

async function handleVerifyOtp() {
  const otp = document.getElementById("otp-input").value.trim();
  clearErr();
  if (otp.length < 6) {
    showErr("Enter the 6-digit OTP.");
    return;
  }
  const btn = document.getElementById("verify-otp-btn");
  btn.disabled = true;
  btn.textContent = "Verifying...";
  try {
    const data = await apiPost("/doctor/auth/verify-otp", {
      phone_number: loginPhone,
      otp,
    });
    if (data.token && data.doctor) {
      setToken(data.token);
      currentDoctor = data.doctor;
      localStorage.setItem("kado_doctor", JSON.stringify(data.doctor));
      await loadPatientsScreen();
      return;
    }
    if (data.error === "Doctor not found. Please register first.") {
      document.getElementById("step-otp").style.display = "none";
      document.getElementById("step-register").style.display = "block";
      document.getElementById("login-sub-text").textContent =
        "Create your doctor profile";
      clearErr();
      btn.disabled = false;
      btn.textContent = "Verify OTP";
      return;
    }
    showErr(data.error || "Invalid OTP. Please try again.");
  } catch (e) {
    showErr("Something went wrong.");
  }
  btn.disabled = false;
  btn.textContent = "Verify OTP";
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
      await loadPatientsScreen();
    } else {
      showErr(data.error || "Could not create account.");
    }
  } catch (e) {
    showErr("Something went wrong.");
  }
  btn.disabled = false;
  btn.textContent = "Create account";
}

function logoutDoctor() {
  currentDoctor = null;
  clearToken();
  localStorage.removeItem("kado_doctor");
  showScreen("login");
  backToPhone();
}
