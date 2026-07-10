let loginPhone = "";
let loginIdentifier = "";

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
  document.getElementById("step-otp").style.display = "none";
  document.getElementById("step-register").style.display = "none";
  document.getElementById("login-sub-text").textContent =
    "Enter your mobile number";
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
  loginIdentifier = "91" + input; // MSG91 wants country code, no "+"

  const btn = document.getElementById("send-otp-btn");
  btn.disabled = true;
  btn.textContent = "Sending...";

  window.sendOtp(
    loginIdentifier,
    () => {
      btn.disabled = false;
      btn.textContent = "Continue";
      document.getElementById("step-phone").style.display = "none";
      document.getElementById("step-otp").style.display = "block";
      document.getElementById("login-sub-text").textContent =
        "Enter the OTP sent to your phone";
      document.getElementById("otp-input").focus();
    },
    (error) => {
      btn.disabled = false;
      btn.textContent = "Continue";
      showErr(
        (error && error.message) || "Could not send OTP. Please try again.",
      );
    },
  );
}

function handleResendOtp() {
  clearErr();
  window.retryOtp(
    null,
    () => showErr("OTP resent."),
    (error) => showErr((error && error.message) || "Could not resend OTP."),
  );
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

  window.verifyOtp(
    otp,
    async (data) => {
      try {
        const accessToken = data && (data.message || data.accessToken || data);
        const res = await apiPost("/doctor/auth/verify-otp", {
          access_token: accessToken,
        });
        if (res.token && res.doctor) {
          setToken(res.token);
          currentDoctor = res.doctor;
          localStorage.setItem("kado_doctor", JSON.stringify(res.doctor));
          if (res.isNewDoctor) {
            document.getElementById("step-otp").style.display = "none";
            document.getElementById("step-register").style.display = "block";
            document.getElementById("login-sub-text").textContent =
              "Complete your profile";
            btn.disabled = false;
            btn.textContent = "Login";
            return;
          }
          await loadPatientsScreen();
          startNotificationPolling();
          return;
        }
        showErr(res.error || "Could not verify OTP.");
      } catch (e) {
        showErr("Something went wrong.");
      }
      btn.disabled = false;
      btn.textContent = "Login";
    },
    (error) => {
      showErr((error && error.message) || "Incorrect OTP. Please try again.");
      btn.disabled = false;
      btn.textContent = "Login";
    },
  );
}

async function handleCompleteProfile() {
  const name = document.getElementById("name-input").value.trim();
  const spec = document.getElementById("spec-input").value.trim();
  clearErr();
  if (!name) {
    showErr("Please enter your name.");
    return;
  }
  const btn = document.getElementById("register-btn");
  btn.disabled = true;
  btn.textContent = "Saving...";
  try {
    const data = await apiPost("/doctor/complete-profile", {
      name,
      specialization: spec || null,
    });
    if (data.id) {
      currentDoctor = data;
      localStorage.setItem("kado_doctor", JSON.stringify(data));
      await loadPatientsScreen();
      startNotificationPolling();
      return;
    }
    showErr(data.error || "Could not save profile.");
  } catch (e) {
    showErr("Something went wrong.");
  }
  btn.disabled = false;
  btn.textContent = "Continue";
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
