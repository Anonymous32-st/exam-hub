        let showCorrection = true;

        async function fetchSettings() {
            try {
                const res = await apiCall("/admin/settings/showCorrection");
                if (res && res.value !== null) {
                    showCorrection = res.value;
                    document.getElementById("correction-status").textContent = showCorrection ? 'ON' : 'OFF';
                }
            } catch(e) {}
        }

        function renderDashboard() {
            const userName = currentUser?.name || "Admin";
            const userRole = currentUser?.role?.toUpperCase() || "ADMIN";
            
            document.getElementById("user-name").textContent = userName;
            document.getElementById("user-role").textContent = userRole;
            document.getElementById("welcome-msg").textContent = `Welcome Back, ${userName}!`;
            document.getElementById("content-area").innerHTML = "<p>Select an option from the sidebar</p>";

            // Add event listeners to sidebar buttons
            setTimeout(() => {
                document.querySelectorAll('.sidebar-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const action = btn.getAttribute('data-action');
                        if (action && typeof window[action] === 'function') window[action]();
                    });
                });
            }, 100);
            
            fetchSettings();
        }

        // ====================== ADMIN FUNCTIONS ======================
        function showAddUser() {
            showModal(`
                <h2>Add New User</h2>
                <input id="new-name" placeholder="Full Name" style="width:100%;padding:12px;margin:8px 0"><br>
                <input id="new-username" placeholder="Username" style="width:100%;padding:12px;margin:8px 0"><br>
                <input id="new-password" type="password" placeholder="Password" style="width:100%;padding:12px;margin:8px 0"><br>
                <select id="new-role" style="width:100%;padding:12px;margin:8px 0">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                </select><br>
                <input id="new-class" placeholder="Class (comma-separated for multiple, e.g. SS1, SS2)" style="width:100%;padding:12px;margin:8px 0"><br>
                <input id="new-subject" placeholder="Subject (comma-separated for multiple, e.g. Biology, Chemistry)" style="width:100%;padding:12px;margin:8px 0"><br>
                <button onclick="addUser()" class="glowing-btn">Create User</button>
            `);
        }

        async function addUser() {
            const data = {
                name: document.getElementById("new-name").value || "",
                username: document.getElementById("new-username").value || "",
                password: document.getElementById("new-password").value || "",
                role: document.getElementById("new-role").value,
                class: document.getElementById("new-class").value || "",
                subject: document.getElementById("new-role").value === "teacher" ? document.getElementById("new-subject").value : ""
            };
            try {
                await apiCall("/admin/users", "POST", data);
                alert("✅ User created successfully!");
                closeModal();
            } catch (err) { alert("Failed to create user"); }
        }

        async function showManageUsers() {
            try {
                const users = await apiCall("/admin/users");
                let html = `<h2>Manage Users</h2>
                <div style="overflow-x:auto;">
                <table><tr><th>Name</th><th>Username</th><th>Role</th><th>Class/Subject</th><th>Action</th></tr>`;
                users.forEach(u => {
                    if (u.role === "admin") return;
                    const classOrSubject = u.role === 'teacher' ? (u.subject || '-') : (u.class || '-');
                    html += `<tr><td>${u.name}</td><td>${u.username}</td><td>${u.role}</td><td>${classOrSubject}</td><td>
                        <button onclick="deleteUser('${u._id}')" class="delete-btn" style="background:var(--danger);border:none;padding:8px 12px;border-radius:6px;cursor:pointer;margin-right:6px;">Delete</button>
                        ${u.role === 'student' ? `<button onclick="resetAndShowPassword('${u._id}','${u.name.replace(/'/g, "\'") }')" class="glowing-btn" style="background:var(--accent);border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Reset & Show Password</button>` : ''}
                    </td></tr>`;
                });
                html += `</table></div>`;
                showModal(html);
            } catch(e) { showModal(`<h2>Error</h2><p>Failed to load users</p>`); }
        }

        // Reset a student's password (admin-only) - allow manual entry or auto-generate
        async function resetAndShowPassword(userId, userName) {
            showModal(`
                <h2>Reset Password for ${userName}</h2>
                <p>Enter a new password or leave blank to auto-generate:</p>
                <input id="reset-pwd-input" type="password" placeholder="New password (optional)" style="width:100%;padding:12px;margin:8px 0"><br>
                <button onclick="confirmResetPassword('${userId}', '${userName.replace(/'/g, "\\'") }')" class="glowing-btn">Reset Password</button>
            `);
        }

        // Confirm and send password reset to backend
        async function confirmResetPassword(userId, userName) {
            const newPassword = document.getElementById('reset-pwd-input').value.trim();
            try {
                const res = await apiCall(`/admin/users/${userId}/reset-password`, 'POST', { password: newPassword || null });
                const pwd = res.password || res.tempPassword;
                showModal(`<h2>Password Reset</h2><p>New password for <strong>${userName}</strong> is:</p><p style="font-family:monospace; font-size:18px; background:#f4f4f4; padding:8px; border-radius:6px;">${pwd}</p><p style="font-size:12px; color:var(--text-muted);">Share this password securely. The user should change it after login.</p>`);
            } catch (err) {
                alert('Failed to reset password: ' + (err.message || 'Unknown error'));
            }
        }

        async function deleteUser(id) {
            if (confirm("Delete this user permanently?")) {
                await apiCall(`/admin/users/${id}`, "DELETE");
                showManageUsers();
            }
        }

        function showPushExam() {
            const today = new Date().toISOString().split('T')[0];
            showModal(`
                <h2>Push Daily Exam</h2>
                <input id="push-date" type="date" value="${today}" style="width:100%;padding:12px;margin:8px 0"><br>
                <input id="push-class" value="SS1" placeholder="Class" style="width:100%;padding:12px;margin:8px 0"><br>
                <input id="push-subject" value="Biology" placeholder="Subject" style="width:100%;padding:12px;margin:8px 0"><br>
                <input id="push-duration" type="number" value="60" placeholder="Duration (minutes)" style="width:100%;padding:12px;margin:8px 0"><br>
                <button onclick="pushExam()" class="glowing-btn">Push Exam</button>
            `);
        }

        async function pushExam() {
            const data = {
                date: document.getElementById("push-date").value,
                class: document.getElementById("push-class").value,
                subject: document.getElementById("push-subject").value,
                duration: document.getElementById("push-duration").value
            };
            try {
                await apiCall("/admin/push-exam", "POST", data);
                alert("✅ Exam pushed successfully!");
                closeModal();
            } catch (err) { alert("Failed to push exam"); }
        }

        function showResetExam() {
            const today = new Date().toISOString().split('T')[0];
            showModal(`
                <p style="font-size:13px; color:var(--text-muted); margin-bottom:15px;">Note: If the student took the exam on a different day, either pick that date or clear the date field to reset all past attempts.</p>
                <input id="reset-date" type="date" value="${today}" style="width:100%;padding:12px;margin:8px 0"><br>
                <input id="reset-class" placeholder="Class (optional)" style="width:100%;padding:12px;margin:8px 0"><br>
                <input id="reset-subject" placeholder="Subject (optional)" style="width:100%;padding:12px;margin:8px 0"><br>
                <input id="reset-username" placeholder="Student Username (optional, for individual reset)" style="width:100%;padding:12px;margin:8px 0"><br>
                <button onclick="resetExam()" class="glowing-btn delete-btn">Reset Exam</button>
            `);
        }

        async function resetExam() {
            const data = {
                date: document.getElementById("reset-date").value,
                class: document.getElementById("reset-class").value || null,
                subject: document.getElementById("reset-subject").value || null,
                username: document.getElementById("reset-username").value || null
            };
            try {
                await apiCall("/admin/reset-exam", "POST", data);
                alert("✅ Exam reset successfully!");
                closeModal();
            } catch (err) { 
                alert("Failed to reset exam: " + (err.message || "Unknown error")); 
            }
        }

        async function showGeneralResults() {
            showModal(`<h3>Loading general results...</h3>`);
            try {
                const results = await apiCall("/admin/results");
                let html = `<h2>General Results</h2><table><tr><th>Student</th><th>Class</th><th>Subject</th><th>Date</th><th>Score</th></tr>`;
                results.forEach(r => {
                    html += `<tr><td>${r.studentId?.name || 'Unknown'}</td><td>${r.studentId?.class || '-'}</td><td>${r.subject}</td><td>${r.date}</td><td>${r.score}%</td></tr>`;
                });
                html += `</table>`;
                showModal(html);
            } catch (err) {
                showModal(`<h2>Error</h2><p>Failed to load results</p>`);
            }
        }

        async function toggleCorrectionFeature() {
            showCorrection = !showCorrection;
            document.getElementById("correction-status").textContent = showCorrection ? 'ON' : 'OFF';
            try {
                await apiCall("/admin/settings/showCorrection", "POST", { value: showCorrection });
                alert(`Correction feature is now ${showCorrection ? 'ENABLED' : 'DISABLED'}`);
            } catch (err) {
                alert("Failed to update correction setting on server");
            }
        }

        // Initialize
        window.addEventListener("DOMContentLoaded", renderDashboard);
