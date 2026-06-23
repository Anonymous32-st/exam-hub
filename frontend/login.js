        const API_BASE = '/api';

        async function login() {
            const username = document.getElementById("login-username").value.trim();
            const password = document.getElementById("login-password").value.trim();
            const errorMsg = document.getElementById("error-msg");
            
            if (!username || !password) {
                errorMsg.textContent = "❌ Enter username and password";
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                const data = await res.json();
                if (data.token) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                    const role = data.user.role.toString().toLowerCase();
                    
                    // Redirect based on role
                    if (role === "admin") window.location.href = "admin.html";
                    else if (role === "teacher") window.location.href = "teacher.html";
                    else if (role === "student") window.location.href = "student.html";
                } else {
                    errorMsg.textContent = "❌ " + (data.msg || "Invalid credentials");
                }
            } catch (err) {
                errorMsg.textContent = "❌ Backend not reachable";
            }
        }

        // Allow Enter key to login
        document.getElementById("login-password").addEventListener("keypress", (e) => {
            if (e.key === "Enter") login();
        });

        // Check if already logged in
        window.onload = () => {
            const token = localStorage.getItem("token");
            const user = localStorage.getItem("user");
            if (token && user) {
                const userData = JSON.parse(user);
                const role = userData.role.toString().toLowerCase();
                if (role === "admin") window.location.href = "admin.html";
                else if (role === "teacher") window.location.href = "teacher.html";
                else if (role === "student") window.location.href = "student.html";
            }
        };
