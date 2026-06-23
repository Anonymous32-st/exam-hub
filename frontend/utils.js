// Shared Utilities & API Functions
const API_BASE = '/api';
let token = localStorage.getItem("token");
let currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

async function apiCall(endpoint, method = "GET", body = null) {
    try {
        const config = {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        };
        const activeSubject = sessionStorage.getItem("activeSubject");
        if (activeSubject) {
            config.headers["X-Active-Subject"] = activeSubject;
        }
        const activeClass = sessionStorage.getItem("activeClass");
        if (activeClass) {
            config.headers["X-Active-Class"] = activeClass;
        }
        if (body) config.body = JSON.stringify(body);
        const res = await fetch(API_BASE + endpoint, config);
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || `HTTP ${res.status}`);
        return data;
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err);
        throw err;
    }
}

function logout() {
    if (confirm("Logout?")) {
        localStorage.clear();
        window.location.href = "login.html";
    }
}

function showModal(html) {
    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modal-content");
    if (modal && modalContent) {
        const closeBtn = `
            <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
                <span onclick="closeModal()" title="Close" style="cursor: pointer; font-size: 28px; font-weight: bold; color: var(--danger); line-height: 1; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">&times;</span>
            </div>
        `;
        modalContent.innerHTML = closeBtn + html;
        modal.style.display = "flex";
    }
}

window.addEventListener('click', function (event) {
    const modal = document.getElementById("modal");
    if (event.target === modal) {
        closeModal();
    }
});


function closeModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.style.display = "none";
}

function checkAuth() {
    if (!token || !currentUser) {
        window.location.href = "login.html";
    }
}

window.onload = () => {
    checkAuth();
};

// Dynamic mobile navigation menu setup
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector(".sidebar");
    const header = document.querySelector("header");
    if (sidebar && header) {
        // Create hamburger menu button
        const toggleBtn = document.createElement("button");
        toggleBtn.id = "menu-toggle";
        toggleBtn.className = "menu-toggle-btn";
        toggleBtn.innerHTML = "☰";
        toggleBtn.setAttribute("aria-label", "Toggle navigation menu");
        header.insertBefore(toggleBtn, header.firstChild);

        // Create overlay
        const overlay = document.createElement("div");
        overlay.className = "sidebar-overlay";
        document.body.appendChild(overlay);

        // Toggle action
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            overlay.classList.toggle("active");
            toggleBtn.innerHTML = sidebar.classList.contains("active") ? "✕" : "☰";
        });

        // Close when clicking overlay
        overlay.addEventListener("click", () => {
            sidebar.classList.remove("active");
            overlay.classList.remove("active");
            toggleBtn.innerHTML = "☰";
        });

        // Close when clicking any sidebar button
        sidebar.addEventListener("click", (e) => {
            if (e.target.classList.contains("sidebar-btn") || e.target.closest(".sidebar-btn")) {
                sidebar.classList.remove("active");
                overlay.classList.remove("active");
                toggleBtn.innerHTML = "☰";
            }
        });
    }
});
