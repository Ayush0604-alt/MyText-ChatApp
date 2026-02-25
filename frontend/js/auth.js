// ============================
// CONFIG
// ============================

const API_URL = "https://your-backend-name.onrender.com"; 
// ⚠️ Replace with your real Render URL

// ============================
// TOGGLE LOGIN / REGISTER
// ============================

const toggleBtn = document.getElementById("toggleBtn");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

let isLogin = true;

toggleBtn.addEventListener("click", () => {
  loginForm.classList.toggle("active");
  registerForm.classList.toggle("active");
  toggleBtn.innerText = isLogin
    ? "Switch to Login"
    : "Switch to Register";
  isLogin = !isLogin;
});

// ============================
// LOGIN
// ============================

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      window.location.href = "dashboard.html";
    } else {
      alert(data.message);
    }

  } catch (error) {
    alert("Server not reachable.");
    console.error(error);
  }
});

// ============================
// REGISTER
// ============================

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      window.location.href = "dashboard.html";
    } else {
      alert(data.message);
    }

  } catch (error) {
    alert("Server not reachable.");
    console.error(error);
  }
});