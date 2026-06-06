async function handleLogin() {
  const input = document
    .getElementById("phone-input")
    .value.trim()
    .replace(/\s/g, "");
  const btn = document.getElementById("login-btn");
  const err = document.getElementById("login-error");
  err.style.display = "none";
  if (input.length < 10) {
    err.textContent = "Please enter a valid 10-digit number.";
    err.style.display = "block";
    return;
  }
  const phone = "+91" + input;
  btn.disabled = true;
  btn.textContent = "Checking...";
  try {
    const res = await fetch(`${API}/user?phone=${encodeURIComponent(phone)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.id && data.user_type === "doctor") {
        currentDoctor = data;
        localStorage.setItem("kado_doctor", JSON.stringify(data));
        await loadPatientsScreen();
        return;
      }
      if (data && data.id) {
        document.getElementById("register-fields").style.display = "block";
        document.getElementById("login-sub-text").textContent =
          "Complete your doctor profile";
        btn.disabled = false;
        btn.textContent = "Register as doctor";
        btn.onclick = registerDoctor;
        return;
      }
    }
    document.getElementById("register-fields").style.display = "block";
    document.getElementById("login-sub-text").textContent =
      "Create your doctor profile";
    btn.disabled = false;
    btn.textContent = "Create account";
    btn.onclick = registerDoctor;
  } catch (e) {
    err.textContent = "Something went wrong.";
    err.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Continue";
  }
}

async function registerDoctor() {
  const phone =
    "+91" +
    document.getElementById("phone-input").value.trim().replace(/\s/g, "");
  const name = document.getElementById("name-input").value.trim();
  const spec = document.getElementById("spec-input").value.trim();
  const btn = document.getElementById("login-btn");
  const err = document.getElementById("login-error");
  if (!name) {
    err.textContent = "Please enter your name.";
    err.style.display = "block";
    return;
  }
  btn.disabled = true;
  btn.textContent = "Creating account...";
  try {
    const res = await fetch(API + "/doctor/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone_number: phone,
        name,
        specialization: spec || null,
      }),
    });
    const data = await res.json();
    if (data.id) {
      currentDoctor = data;
      localStorage.setItem("kado_doctor", JSON.stringify(data));
      await loadPatientsScreen();
    } else {
      err.textContent = data.error || "Could not create account.";
      err.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Create account";
    }
  } catch (e) {
    err.textContent = "Something went wrong.";
    err.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Create account";
  }
}
