        function renderDashboard() {
            const userName = currentUser?.name || "Teacher";
            const userRole = currentUser?.role?.toUpperCase() || "TEACHER";
            const subject = currentUser?.subject || "Not Assigned";
            
            document.getElementById("user-name").textContent = userName;
            document.getElementById("user-role").textContent = userRole;
            
            // Handle subjects
            const subjects = currentUser?.subject ? currentUser.subject.split(',').map(s => s.trim()) : [];
            const displayEl = document.getElementById("subject-display");
            
            if (subjects.length > 1) {
                let activeSub = sessionStorage.getItem("activeSubject");
                if (!activeSub || !subjects.includes(activeSub)) {
                    activeSub = subjects[0];
                    sessionStorage.setItem("activeSubject", activeSub);
                }
                
                let selectHtml = `<select id="active-subject-select" style="width:100%; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.2); background:#1e1e3f; color:#fff; font-weight:600; cursor:pointer;">`;
                subjects.forEach(sub => {
                    selectHtml += `<option value="${sub}" ${sub === activeSub ? 'selected' : ''}>${sub}</option>`;
                });
                selectHtml += `</select>`;
                displayEl.innerHTML = selectHtml;
                
                setTimeout(() => {
                    const selectEl = document.getElementById("active-subject-select");
                    if (selectEl) {
                        selectEl.addEventListener("change", (e) => {
                            sessionStorage.setItem("activeSubject", e.target.value);
                            closeModal();
                        });
                    }
                }, 50);
            } else {
                displayEl.textContent = subject;
                if (subjects.length === 1) {
                    sessionStorage.setItem("activeSubject", subjects[0]);
                } else {
                    sessionStorage.removeItem("activeSubject");
                }
            }

            // Handle classes
            const classes = currentUser?.class ? currentUser.class.split(',').map(c => c.trim()) : [];
            const classDisplayEl = document.getElementById("class-display");
            
            if (classes.length > 1) {
                let activeCls = sessionStorage.getItem("activeClass");
                if (!activeCls || !classes.includes(activeCls)) {
                    activeCls = classes[0];
                    sessionStorage.setItem("activeClass", activeCls);
                }
                
                let selectHtml = `<select id="active-class-select" style="width:100%; padding:10px; border-radius:6px; border:1px solid rgba(255,255,255,0.2); background:#1e1e3f; color:#fff; font-weight:600; cursor:pointer;">`;
                classes.forEach(cls => {
                    selectHtml += `<option value="${cls}" ${cls === activeCls ? 'selected' : ''}>${cls}</option>`;
                });
                selectHtml += `</select>`;
                classDisplayEl.innerHTML = selectHtml;
                
                setTimeout(() => {
                    const selectEl = document.getElementById("active-class-select");
                    if (selectEl) {
                        selectEl.addEventListener("change", (e) => {
                            sessionStorage.setItem("activeClass", e.target.value);
                            closeModal();
                        });
                    }
                }, 50);
            } else {
                classDisplayEl.textContent = currentUser?.class || "Not Assigned";
                if (classes.length === 1) {
                    sessionStorage.setItem("activeClass", classes[0]);
                } else {
                    sessionStorage.removeItem("activeClass");
                }
            }

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
        }

        // ====================== TEACHER FUNCTIONS ======================
        window.insertSymbol = function(symbol) {
            if(!symbol) return;
            const editor = document.getElementById('q-text');
            editor.focus();
            document.execCommand('insertText', false, symbol);
        };

        window.formatText = function(command) {
            document.execCommand(command, false, null);
            document.getElementById('q-text').focus();
            updateFormatButtons();
        };

        window.updateFormatButtons = function() {
            const commands = ['bold', 'italic', 'underline', 'superscript', 'subscript'];
            const ids = ['btn-bold', 'btn-italic', 'btn-underline', 'btn-sup', 'btn-sub'];
            commands.forEach((cmd, i) => {
                const btn = document.getElementById(ids[i]);
                if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
            });
        };

        function showSetQuestions() {
            showModal(`
                <h2>Set New Question</h2>
                <p><strong>Subject:</strong> ${sessionStorage.getItem("activeSubject") || currentUser?.subject || "Not Assigned"}</p>
                <input id="target-class" placeholder="Class" value="${sessionStorage.getItem("activeClass") || currentUser?.class || 'SS1'}" style="width:100%;padding:12px;margin:8px 0"><br>
                
                <div style="background:rgba(255,255,255,0.1); padding:5px; border-radius:8px; display:flex; gap:5px; align-items:center; flex-wrap:wrap; margin-top:8px;">
                    <button type="button" class="format-btn" id="btn-sup" onclick="formatText('superscript')" title="Superscript (Raise to power)">x²</button>
                    <button type="button" class="format-btn" id="btn-sub" onclick="formatText('subscript')" title="Subscript (Base)">x₂</button>
                    <button type="button" class="format-btn" id="btn-bold" onclick="formatText('bold')" style="font-weight:bold;" title="Bold">B</button>
                    <button type="button" class="format-btn" id="btn-italic" onclick="formatText('italic')" style="font-style:italic;" title="Italic">I</button>
                    <button type="button" class="format-btn" id="btn-underline" onclick="formatText('underline')" style="text-decoration:underline;" title="Underline">U</button>
                    
                    <select onchange="insertSymbol(this.value); this.selectedIndex=0;" style="padding:5px; background:#2a2a5e; color:#fff; border:none; border-radius:4px; width:auto; margin:0;">
                        <option value="">Symbol...</option>
                        <option value="π">π (Pi)</option>
                        <option value="θ">θ (Theta)</option>
                        <option value="∞">∞ (Infinity)</option>
                        <option value="√">√ (Root)</option>
                        <option value="Σ">Σ (Sigma)</option>
                        <option value="±">± (Plus-Minus)</option>
                        <option value="°">° (Degree)</option>
                        <option value="α">α (Alpha)</option>
                        <option value="β">β (Beta)</option>
                        <option value="γ">γ (Gamma)</option>
                        <option value="Δ">Δ (Delta)</option>
                        <option value="Ω">Ω (Omega)</option>
                        <option value="÷">÷ (Divide)</option>
                        <option value="×">× (Multiply)</option>
                        <option value="≤">≤ (Less/Eq)</option>
                        <option value="≥">≥ (Great/Eq)</option>
                        <option value="≈">≈ (Approx)</option>
                        <option value="≠">≠ (Not Eq)</option>
                    </select>
                </div>
                <div id="q-text" contenteditable="true" placeholder="Type question text here..." style="width:100%; min-height:80px; padding:12px; margin-bottom:8px; border-radius:0 0 8px 8px; border:none; background:rgba(255,255,255,0.1); color:#fff; outline:none;" onfocus="this.style.boxShadow='0 0 10px var(--primary)'" onblur="this.style.boxShadow='none'" onkeyup="updateFormatButtons()" onmouseup="updateFormatButtons()"></div>
                
                <label style="font-size:14px; margin-top:5px; display:block; color:var(--primary);">Attach Image (Optional):</label>
                <input type="file" id="q-image" accept="image/*" style="width:100%;padding:8px;margin:5px 0;background:rgba(255,255,255,0.05);"><br>

                <input id="opt1" placeholder="Option A" style="width:100%;padding:12px;margin:5px 0"><br>
                <input id="opt2" placeholder="Option B" style="width:100%;padding:12px;margin:5px 0"><br>
                <input id="opt3" placeholder="Option C" style="width:100%;padding:12px;margin:5px 0"><br>
                <input id="opt4" placeholder="Option D" style="width:100%;padding:12px;margin:5px 0"><br>
                <input id="correct" type="number" min="0" max="3" placeholder="Correct option (0-3)" style="width:100%;padding:12px;margin:10px 0">
                <button onclick="addQuestion()" class="glowing-btn" id="btn-add">Add Question</button>
            `);
        }

        async function addQuestion() {
            const btn = document.getElementById("btn-add");
            btn.textContent = "Uploading...";
            btn.disabled = true;

            let imageUrl = null;
            const fileInput = document.getElementById("q-image");
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (file.size > 2 * 1024 * 1024) {
                    alert("Image is too large! Please upload a file smaller than 2MB.");
                    btn.textContent = "Add Question";
                    btn.disabled = false;
                    return;
                }
                const reader = new FileReader();
                const base64Promise = new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target.result);
                });
                reader.readAsDataURL(file);
                imageUrl = await base64Promise;
            }

            const data = {
                class: document.getElementById("target-class").value,
                text: document.getElementById("q-text").innerHTML,
                imageUrl: imageUrl,
                options: [
                    document.getElementById("opt1").value,
                    document.getElementById("opt2").value,
                    document.getElementById("opt3").value,
                    document.getElementById("opt4").value
                ],
                correct: parseInt(document.getElementById("correct").value)
            };
            try {
                await apiCall("/teacher/questions", "POST", data);
                alert("✅ Question added successfully!");
                closeModal();
            } catch (err) { 
                alert("Failed to add question"); 
                btn.textContent = "Add Question";
                btn.disabled = false;
            }
        }

        function showSetTheoryQuestions() {
            showModal(`
                <h2>Set New Theory Question</h2>
                <p><strong>Subject:</strong> ${sessionStorage.getItem("activeSubject") || currentUser?.subject || "Not Assigned"}</p>
                <input id="target-class-theory" placeholder="Class" value="${sessionStorage.getItem("activeClass") || currentUser?.class || 'SS1'}" style="width:100%;padding:12px;margin:8px 0"><br>
                
                <div style="background:rgba(255,255,255,0.1); padding:5px; border-radius:8px; display:flex; gap:5px; align-items:center; flex-wrap:wrap; margin-top:8px;">
                    <button type="button" class="format-btn" id="btn-sup-theory" onclick="formatText('superscript')" title="Superscript (Raise to power)">x²</button>
                    <button type="button" class="format-btn" id="btn-sub-theory" onclick="formatText('subscript')" title="Subscript (Base)">x₂</button>
                    <button type="button" class="format-btn" id="btn-bold-theory" onclick="formatText('bold')" style="font-weight:bold;" title="Bold">B</button>
                    <button type="button" class="format-btn" id="btn-italic-theory" onclick="formatText('italic')" style="font-style:italic;" title="Italic">I</button>
                    <button type="button" class="format-btn" id="btn-underline-theory" onclick="formatText('underline')" style="text-decoration:underline;" title="Underline">U</button>
                    
                    <select onchange="insertSymbol(this.value); this.selectedIndex=0;" style="padding:5px; background:#2a2a5e; color:#fff; border:none; border-radius:4px; width:auto; margin:0;">
                        <option value="">Symbol...</option>
                        <option value="π">π (Pi)</option>
                        <option value="θ">θ (Theta)</option>
                        <option value="∞">∞ (Infinity)</option>
                        <option value="√">√ (Root)</option>
                        <option value="Σ">Σ (Sigma)</option>
                        <option value="±">± (Plus-Minus)</option>
                        <option value="°">° (Degree)</option>
                        <option value="α">α (Alpha)</option>
                        <option value="β">β (Beta)</option>
                        <option value="γ">γ (Gamma)</option>
                        <option value="Δ">Δ (Delta)</option>
                        <option value="Ω">Ω (Omega)</option>
                        <option value="÷">÷ (Divide)</option>
                        <option value="×">× (Multiply)</option>
                        <option value="≤">≤ (Less/Eq)</option>
                        <option value="≥">≥ (Great/Eq)</option>
                        <option value="≈">≈ (Approx)</option>
                        <option value="≠">≠ (Not Eq)</option>
                    </select>
                </div>
                <div id="q-text" contenteditable="true" placeholder="Type theory question here..." style="width:100%; min-height:120px; padding:12px; margin-bottom:8px; border-radius:0 0 8px 8px; border:none; background:rgba(255,255,255,0.1); color:#fff; outline:none;" onfocus="this.style.boxShadow='0 0 10px var(--primary)'" onblur="this.style.boxShadow='none'" onkeyup="updateFormatButtons()" onmouseup="updateFormatButtons()"></div>
                
                <label style="font-size:14px; margin-top:5px; display:block; color:var(--primary);">Attach Image (Optional):</label>
                <input type="file" id="q-image-theory" accept="image/*" style="width:100%;padding:8px;margin:5px 0;background:rgba(255,255,255,0.05);"><br>

                <button onclick="addTheoryQuestion()" class="glowing-btn" id="btn-add-theory">Add Theory Question</button>
            `);
        }

        async function addTheoryQuestion() {
            const btn = document.getElementById("btn-add-theory");
            btn.textContent = "Uploading...";
            btn.disabled = true;

            let imageUrl = null;
            const fileInput = document.getElementById("q-image-theory");
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (file.size > 2 * 1024 * 1024) {
                    alert("Image is too large! Please upload a file smaller than 2MB.");
                    btn.textContent = "Add Theory Question";
                    btn.disabled = false;
                    return;
                }
                const reader = new FileReader();
                const base64Promise = new Promise((resolve) => {
                    reader.onload = (e) => resolve(e.target.result);
                });
                reader.readAsDataURL(file);
                imageUrl = await base64Promise;
            }

            const data = {
                class: document.getElementById("target-class-theory").value,
                text: document.getElementById("q-text").innerHTML,
                imageUrl: imageUrl
            };
            try {
                await apiCall("/teacher/theory-questions", "POST", data);
                alert("✅ Theory question added successfully!");
                closeModal();
            } catch (err) { 
                alert("Failed to add question"); 
                btn.textContent = "Add Theory Question";
                btn.disabled = false;
            }
        }

        let currentTheoryResults = [];
        
        function showGradeTheory() {
            showModal(`
                <h2>Grade Theory Exams</h2>
                <p><strong>Your Subject:</strong> ${sessionStorage.getItem("activeSubject") || currentUser?.subject || 'Not Assigned'}</p>
                <input id="teacher-grade-class" placeholder="Enter class" value="${sessionStorage.getItem("activeClass") || currentUser?.class || 'SS1'}" style="width:100%;padding:12px;margin:10px 0"><br>
                <button onclick="loadTheoryAnswers()" class="glowing-btn">Load Submissions</button>
                <div id="theory-submissions-list" style="margin-top:15px; max-height:300px; overflow-y:auto;"></div>
            `);
        }

        async function loadTheoryAnswers() {
            let targetClass = document.getElementById("teacher-grade-class").value.trim() || sessionStorage.getItem("activeClass") || currentUser?.class || "SS1";
            const listArea = document.getElementById("theory-submissions-list");
            listArea.innerHTML = "<p>Loading...</p>";
            try {
                const results = await apiCall(`/teacher/theory-answers?class=${targetClass}`);
                currentTheoryResults = results;
                
                let html = ``;
                if (!results || results.length === 0) {
                    html += `<p>No theory submissions found for this class.</p>`;
                } else {
                    html += `<table><tr><th>Student</th><th>Date</th><th>Status</th><th>Score</th><th>Action</th></tr>`;
                    results.forEach(r => {
                        const statusColor = r.status === 'Graded' ? 'var(--success)' : 'var(--warning)';
                        html += `<tr>
                            <td>${r.studentId?.name || 'Unknown'} (${r.studentId?.username || 'N/A'})</td>
                            <td>${r.date}</td>
                            <td style="color:${statusColor};">${r.status}</td>
                            <td>${r.score !== null ? r.score : '-'}</td>
                            <td><button onclick="viewStudentTheoryAnswer('${r._id}')" class="glowing-btn" style="padding:5px 10px; font-size:12px;">Grade</button></td>
                        </tr>`;
                    });
                    html += `</table>`;
                }
                listArea.innerHTML = html;
            } catch (err) {
                listArea.innerHTML = `<p style="color:red;">Failed to load theory answers</p>`;
            }
        }

        function viewStudentTheoryAnswer(resultId) {
            const result = currentTheoryResults.find(r => r._id === resultId);
            if (!result) return;
            
            let answersHtml = `<div style="max-height:400px; overflow-y:auto; text-align:left; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px;">`;
            
            if (result.answers && Object.keys(result.answers).length > 0) {
                for (const [qId, ans] of Object.entries(result.answers)) {
                    answersHtml += `
                        <div style="margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1);">
                            <p><strong>Student's Answer:</strong></p>
                            <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:5px; margin-top:5px;">${ans || '<em>No answer provided</em>'}</div>
                        </div>
                    `;
                }
            } else {
                answersHtml += `<p>No answers submitted.</p>`;
            }
            answersHtml += `</div>`;

            showModal(`
                <h2>Grade Theory for ${result.studentId?.name}</h2>
                <p>Date: ${result.date}</p>
                ${answersHtml}
                <div style="margin-top:15px; text-align:left;">
                    <label>Total Score:</label>
                    <input type="number" id="theory-score" value="${result.score !== null ? result.score : ''}" placeholder="Enter score" style="width:100%;padding:12px;margin:5px 0"><br>
                    <label>Feedback (Optional):</label>
                    <textarea id="theory-feedback" placeholder="Great job..." style="width:100%;padding:12px;margin:5px 0; min-height:60px;">${result.feedback || ''}</textarea><br>
                    <button onclick="submitTheoryGrade('${result._id}')" class="glowing-btn" style="width:100%; margin-top:10px; background:var(--success);">Submit Grade</button>
                    <button onclick="showGradeTheory(); setTimeout(loadTheoryAnswers, 100);" class="glowing-btn" style="width:100%; margin-top:10px; background:var(--text-muted);">Back</button>
                </div>
            `);
        }

        async function submitTheoryGrade(resultId) {
            const score = document.getElementById("theory-score").value;
            const feedback = document.getElementById("theory-feedback").value;
            
            if(score === "") {
                alert("Please enter a score.");
                return;
            }
            
            try {
                await apiCall("/teacher/theory-answers/grade", "POST", { resultId, score, feedback });
                alert("✅ Grade submitted successfully!");
                showGradeTheory();
                setTimeout(loadTheoryAnswers, 100);
            } catch(err) {
                alert("Failed to submit grade");
            }
        }

        function showTeacherClassResults() {
            showModal(`
                <h2>View Class Results</h2>
                <p><strong>Your Subject:</strong> ${sessionStorage.getItem("activeSubject") || currentUser?.subject || 'Not Assigned'}</p>
                <input id="teacher-view-class" placeholder="Enter class" value="${sessionStorage.getItem("activeClass") || currentUser?.class || ''}" style="width:100%;padding:12px;margin:10px 0"><br>
                <button onclick="viewTeacherResults()" class="glowing-btn">Show Results</button>
            `);
        }

        async function viewTeacherResults() {
            let targetClass = document.getElementById("teacher-view-class").value.trim() || sessionStorage.getItem("activeClass") || currentUser?.class || "SS1";
            try {
                const results = await apiCall(`/teacher/results?class=${targetClass}`);
                let html = `<h2>Results for Class: ${targetClass}</h2>`;
                if (!results || results.length === 0) {
                    html += `<p>No results found yet for this class.</p>`;
                } else {
                    html += `<table><tr><th>Student</th><th>Subject</th><th>Date</th><th>Score</th></tr>`;
                    results.forEach(r => {
                        html += `<tr><td>${r.studentId?.name || 'Unknown'}</td><td>${r.subject}</td><td>${r.date}</td><td><strong>${r.score}%</strong></td></tr>`;
                    });
                    html += `</table>`;
                }
                showModal(html);
            } catch (err) {
                showModal(`<h2>Error</h2><p>Failed to load results</p>`);
            }
        }

        function showResetStudent() {
            const today = new Date().toISOString().split('T')[0];
            showModal(`
                <h2>Reset Student Exam</h2>
                <p><strong>Your Subject:</strong> <span style="color:var(--primary);">${sessionStorage.getItem("activeSubject") || currentUser?.subject || 'Not Assigned'}</span></p>
                <p style="font-size:13px; color:var(--text-muted); margin-bottom:15px; line-height:1.4;">
                    If a student was disconnected or submitted by accident, resetting their exam will delete their current score and allow them to take it again from the beginning.
                </p>
                <input id="reset-username" placeholder="Enter Student Username (e.g. student1)" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;"><br>
                <input id="reset-date" type="date" value="${today}" title="Exam Date" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;"><br>
                <button onclick="resetStudentExam()" class="glowing-btn" style="background:var(--danger); border:none; width:100%; margin-top:10px;">Reset Exam Now</button>
            `);
        }

        async function resetStudentExam() {
            const username = document.getElementById("reset-username").value;
            const date = document.getElementById("reset-date").value;
            
            if(!username) {
                alert("Please enter the student's username");
                return;
            }

            if(confirm(`Are you sure you want to completely delete the exam results for student "${username}"? They will have to start over.`)) {
                try {
                    const res = await apiCall("/teacher/reset-student-exam", "POST", { username, date });
                    alert("✅ " + res.msg);
                    closeModal();
                } catch (err) {
                    alert("Failed: " + (err.message || "Unknown error"));
                }
            }
        }

        function showManageTime() {
            const today = new Date().toISOString().split('T')[0];
            showModal(`
                <h2>Manage Exam Time</h2>
                <p><strong>Subject:</strong> ${sessionStorage.getItem("activeSubject") || currentUser?.subject || "Not Assigned"}</p>
                <p style="font-size:13px; color:var(--text-muted); margin-bottom:15px; line-height:1.4;">
                    Update the allocated time for an exam that has already been pushed by the admin.
                </p>
                <input id="manage-time-date" type="date" value="${today}" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;"><br>
                <input id="manage-time-class" value="${sessionStorage.getItem("activeClass") || currentUser?.class || 'SS1'}" placeholder="Class" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;"><br>
                <input id="manage-time-duration" type="number" placeholder="New Duration (minutes)" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;"><br>
                <button onclick="updateExamTime()" class="glowing-btn" style="width:100%; margin-top:10px;">Update Time</button>
            `);
        }

        async function updateExamTime() {
            const data = {
                date: document.getElementById("manage-time-date").value,
                class: document.getElementById("manage-time-class").value,
                duration: document.getElementById("manage-time-duration").value
            };
            if(!data.duration) {
                alert("Please enter the new duration.");
                return;
            }
            try {
                const res = await apiCall("/teacher/update-duration", "POST", data);
                alert("✅ " + res.msg);
                closeModal();
            } catch (err) { 
                alert("Failed: " + (err.message || "Could not update duration. Ensure the exam is pushed by admin.")); 
            }
        }

        function showUploadNotes() {
            showModal(`
                <h2>Upload E-Notes</h2>
                <p><strong>Subject:</strong> ${sessionStorage.getItem("activeSubject") || currentUser?.subject || "Not Assigned"}</p>
                <div style="margin-bottom:15px;">
                    <input id="note-title" placeholder="Note Title" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;">
                    <input id="note-class" placeholder="Target Class (e.g. SS1)" value="${sessionStorage.getItem("activeClass") || currentUser?.class || 'SS1'}" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;">
                    <input type="file" id="note-file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;">
                    <button onclick="uploadNote()" class="glowing-btn" style="width:100%; margin-top:10px;">Upload Note</button>
                </div>
                <h3>Your Uploaded Notes</h3>
                <div id="notes-list" style="margin-top:10px; max-height:200px; overflow-y:auto; font-size:14px;">Loading...</div>
            `);
            loadTeacherNotes();
        }

        async function uploadNote() {
            const title = document.getElementById("note-title").value;
            const targetClass = document.getElementById("note-class").value;
            const fileInput = document.getElementById("note-file");

            if (!title || !targetClass || fileInput.files.length === 0) {
                alert("Please fill all fields and select a file.");
                return;
            }

            const formData = new FormData();
            formData.append("title", title);
            formData.append("class", targetClass);
            formData.append("file", fileInput.files[0]);

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/teacher/notes/upload', {
                    method: 'POST',
                    headers: { 
                        'Authorization': 'Bearer ' + token,
                        'X-Active-Subject': sessionStorage.getItem("activeSubject") || "",
                        'X-Active-Class': sessionStorage.getItem("activeClass") || ""
                    },
                    body: formData
                });
                
                const data = await response.json();
                if (response.ok) {
                    alert("✅ " + data.msg);
                    document.getElementById("note-title").value = "";
                    document.getElementById("note-file").value = "";
                    loadTeacherNotes();
                } else {
                    alert("Failed: " + data.msg);
                }
            } catch (err) {
                alert("Failed to upload note");
            }
        }

        async function loadTeacherNotes() {
            const listArea = document.getElementById("notes-list");
            if(!listArea) return;
            try {
                const notes = await apiCall("/teacher/notes");
                if (!notes || notes.length === 0) {
                    listArea.innerHTML = "<p>No notes uploaded yet.</p>";
                    return;
                }
                let html = '<table style="width:100%; text-align:left;"><tr><th>Title</th><th>Class</th><th>Date</th><th>Action</th></tr>';
                notes.forEach(note => {
                    const dateStr = new Date(note.uploadedAt).toLocaleDateString();
                    html += `<tr>
                        <td><a href="${note.fileUrl}" target="_blank" style="color:var(--primary); text-decoration:none;">${note.title}</a></td>
                        <td>${note.classLevel}</td>
                        <td>${dateStr}</td>
                        <td><button onclick="deleteNote('${note._id}')" style="background:var(--danger); color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button></td>
                    </tr>`;
                });
                html += '</table>';
                listArea.innerHTML = html;
            } catch (err) {
                listArea.innerHTML = "<p style='color:red;'>Failed to load notes.</p>";
            }
        }

        async function deleteNote(id) {
            if(confirm("Are you sure you want to delete this note?")) {
                try {
                    await apiCall("/teacher/notes/" + id, "DELETE");
                    alert("✅ Note deleted");
                    loadTeacherNotes();
                } catch(err) {
                    alert("Failed to delete note");
                }
            }
        }

        // ================= GRADING PLATFORM =================

        async function showGradeStudents() {
            showModal(`<h2>Grade Students</h2><p>Loading students...</p>`);
            try {
                const students = await apiCall("/teacher/students-for-grading");
                let html = `<h2>Select Student to Grade</h2>
                    <p style="font-size:13px; color:var(--text-muted); margin-bottom:15px;">Enter C.A (Continuous Assessment) and Exam scores, then set the term title.</p>
                    <div style="max-height:300px; overflow-y:auto;">`;
                
                students.forEach(s => {
                    html += `<div style="background:rgba(255,255,255,0.05); padding:10px; margin:5px 0; border-radius:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="showGradeForm('${s._id}', '${s.name}', '${s.username}')">
                        <div>
                            <strong>${s.name}</strong> <span style="color:var(--text-muted); font-size:12px;">(${s.username})</span>
                        </div>
                        <button class="glowing-btn" style="padding:6px 12px; font-size:12px;">Grade</button>
                    </div>`;
                });
                
                html += `</div>`;
                showModal(html);
            } catch(err) {
                showModal(`<h2>Error</h2><p>Failed to load students</p>`);
            }
        }

        function showGradeForm(studentId, studentName, username) {
            const currentTerm = getCurrentTerm();
            showModal(`
                <h2>Grade ${studentName}</h2>
                <p style="font-size:12px; color:var(--text-muted);">Username: <strong>${username}</strong></p>
                <div style="margin:15px 0;">
                    <label style="font-weight:600; display:block; margin:10px 0 5px;">C.A Score (0-100):</label>
                    <input id="ca-score" type="number" min="0" max="100" value="40" placeholder="e.g. 75" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;"><br>
                    
                    <label style="font-weight:600; display:block; margin:10px 0 5px;">Exam Score (0-100):</label>
                    <input id="exam-score" type="number" min="0" max="100" value="60" placeholder="e.g. 85" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;"><br>
                    
                    <label style="font-weight:600; display:block; margin:10px 0 5px;">Term/Title:</label>
                    <input id="grade-title" type="text" value="${currentTerm}" placeholder="e.g. First Term, Mid Term, Second Term" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;"><br>
                </div>
                
                <button onclick="submitStudentGrade('${studentId}', '${studentName}')" class="glowing-btn" style="width:100%; margin-top:10px; background:var(--success);">Save Grade</button>
                <button onclick="showGradeStudents()" class="glowing-btn" style="width:100%; margin-top:8px; background:var(--text-muted);">Back</button>
            `);
        }

        async function submitStudentGrade(studentId, studentName) {
            const caScore = document.getElementById("ca-score").value.trim();
            const examScore = document.getElementById("exam-score").value.trim();
            const title = document.getElementById("grade-title").value.trim();

            if (!caScore || !examScore || !title) {
                alert("Please fill all fields");
                return;
            }

            try {
                const res = await apiCall("/teacher/grades", "POST", {
                    studentId,
                    caScore: Number(caScore),
                    examScore: Number(examScore),
                    title
                });
                
                const average = ((Number(caScore) + Number(examScore)) / 2).toFixed(2);
                showModal(`
                    <h2>✅ Grade Saved</h2>
                    <p>Student: <strong>${studentName}</strong></p>
                    <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:6px; margin:15px 0;">
                        <p>C.A Score: <strong>${caScore}</strong></p>
                        <p>Exam Score: <strong>${examScore}</strong></p>
                        <p style="font-size:18px; color:var(--primary); font-weight:600;">Average: <strong>${average}</strong></p>
                        <p>Term: <strong>${title}</strong></p>
                    </div>
                    <button onclick="showGradeStudents()" class="glowing-btn" style="width:100%;">Grade Another Student</button>
                `);
            } catch(err) {
                alert("Failed to save grade: " + (err.message || "Unknown error"));
            }
        }

        function getCurrentTerm() {
            const month = new Date().getMonth() + 1;
            if (month >= 1 && month <= 4) return "First Term";
            if (month >= 5 && month <= 8) return "Second Term";
            if (month >= 9 && month <= 12) return "Third Term";
            return "First Term";
        }

        // Initialize
        window.addEventListener("DOMContentLoaded", renderDashboard);
