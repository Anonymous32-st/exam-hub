        let currentQuestions = [];
        let selectedAnswers = {};
        let currentExamSubject = null;
        let showCorrection = true;
        let examActive = false;
        let isPracticeMode = false;
        let timerInterval = null;

        function updateTimerDisplay(totalSeconds) {
            const display = document.getElementById('timer-display');
            if (!display) return;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            if (totalSeconds < 300) { // Less than 5 minutes
                display.style.color = "#ff4757";
                display.style.borderColor = "#ff4757";
            } else {
                display.style.color = "white";
                display.style.borderColor = "rgba(255,255,255,0.2)";
            }
        }

        async function fetchSettings() {
            try {
                const res = await apiCall("/student/settings/showCorrection");
                if (res && res.value !== null) {
                    showCorrection = res.value;
                }
            } catch(e) {}
        }

        function renderDashboard() {
            const userName = currentUser?.name || "Student";
            const userRole = currentUser?.role?.toUpperCase() || "STUDENT";
            
            document.getElementById("user-name").textContent = userName;
            document.getElementById("user-role").textContent = userRole;
            document.getElementById("welcome-msg").textContent = `Welcome Back, ${userName}!`;
            document.getElementById("exam-area").innerHTML = "<p>Select an option from the sidebar</p>";

            // Add event listeners to sidebar buttons
            setTimeout(() => {
                document.querySelectorAll('.sidebar-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const action = btn.getAttribute('data-action');
                        
                        if (examActive && action === 'showMyResults') {
                            alert("🚨 STRICT ANTI-CHEAT ALERT: You navigated to the Results tab during an active exam. Your exam has been automatically submitted.");
                            submitExam();
                            return;
                        }

                        if (action && typeof window[action] === 'function') window[action]();
                    });
                });
            }, 100);
            
            fetchSettings();
        }

        // ====================== STUDENT FUNCTIONS ======================
        async function showAvailableAssessments() {
            const area = document.getElementById("exam-area");
            area.innerHTML = "<p>🔍 Loading available assessments...</p>";

            try {
                const exams = await apiCall("/student/today-exam");
                const examList = Array.isArray(exams) ? exams : (exams ? [exams] : []);

                if (examList.length === 0) {
                    area.innerHTML = `<div style="margin-bottom: 15px;">
                        <h3 style="margin: 0;">No assessment available today</h3>
                    </div><p style="margin-top: 10px;">Ask Admin to push exams.</p>`;
                    return;
                }

                let html = `<div style="margin-bottom: 15px;">
                    <h2 style="margin: 0;">Available Assessments Today</h2>
                </div>`;
                examList.forEach(exam => {
                    const dur = exam.duration || 60;
                    html += `
                        <div class="assessment-card" data-subject="${exam.subject}" data-duration="${dur}">
                            <h3>${exam.subject}</h3>
                            <p>Class: ${exam.class}</p>
                            <p>Duration: ${dur} mins</p>
                            <small>Click to start</small>
                        </div>`;
                });
                area.innerHTML = html;

                setTimeout(() => {
                    document.querySelectorAll('.assessment-card').forEach(card => {
                        card.addEventListener('click', () => {
                            const subject = card.getAttribute('data-subject');
                            const duration = parseInt(card.getAttribute('data-duration') || "60");
                            if (subject) startExam(subject, duration);
                        });
                    });
                }, 100);
            } catch (err) {
                area.innerHTML = `<h3>Error loading assessments</h3>`;
            }
        }

        async function startExam(subject, duration = 60) {
            const area = document.getElementById("exam-area");
            area.innerHTML = `<p>Loading ${subject} questions...</p>`;

            try {
                let questions = await apiCall(`/student/questions/${encodeURIComponent(subject.trim())}/${encodeURIComponent(currentUser?.class || 'SS1')}`);

                if (!questions || questions.length === 0) {
                    area.innerHTML = `<div style="margin-bottom: 15px;">
                        <h3 style="margin: 0;">No questions available for ${subject}</h3>
                    </div>`;
                    return;
                }

                // Add originalIndex to keep track for backend grading
                questions = questions.map((q, idx) => ({ ...q, originalIndex: idx }));
                
                // Shuffle questions array
                for (let i = questions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [questions[i], questions[j]] = [questions[j], questions[i]];
                }

                currentExamSubject = subject;
                currentQuestions = questions;
                selectedAnswers = {};
                examActive = true;
                isPracticeMode = false;
                cheatWarnings = 0; // Reset warnings

                // Force Fullscreen
                const docElm = document.documentElement;
                if (docElm.requestFullscreen) docElm.requestFullscreen().catch(e => {});

                let html = `<div style="margin-bottom: 15px; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin: 0;">${subject} Assessment</h3>
                    <div id="timer-display" style="font-size: 20px; font-weight: bold; background: rgba(255,255,255,0.1); padding: 5px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">--:--</div>
                </div>`;
                questions.forEach((q, i) => {
                    const oIdx = q.originalIndex;
                    html += `
                        <div style="margin:25px 0">
                            <p><strong>${i+1}. ${q.text}</strong></p>
                            ${q.imageUrl ? `<img src="${q.imageUrl}" style="max-width:100%; max-height:300px; border-radius:10px; margin:10px 0; border:1px solid rgba(255,255,255,0.2);">` : ''}
                            ${q.options.map((opt, j) => `
                                <div class="option" id="opt-${oIdx}-${j}" onclick="selectAnswer(${oIdx},${j})">${opt}</div>
                            `).join('')}
                        </div>`;
                });
                html += `<button onclick="submitExam()" class="glowing-btn">Submit Assessment</button>`;
                area.innerHTML = html;

                // Start Timer
                let timeRemaining = duration * 60; // in seconds
                updateTimerDisplay(timeRemaining);
                
                if (timerInterval) clearInterval(timerInterval);
                timerInterval = setInterval(() => {
                    timeRemaining--;
                    if (timeRemaining <= 0) {
                        clearInterval(timerInterval);
                        alert("Time is up! Your assessment will be submitted automatically.");
                        submitExam();
                    } else {
                        updateTimerDisplay(timeRemaining);
                    }
                }, 1000);
            } catch (err) {
                area.innerHTML = `<h3>Error loading questions</h3>`;
            }
        }

        function selectAnswer(qIndex, optIndex) {
            selectedAnswers[qIndex] = optIndex;
            document.querySelectorAll(`[id^="opt-${qIndex}-"]`).forEach(el => el.classList.remove('selected'));
            const el = document.getElementById(`opt-${qIndex}-${optIndex}`);
            if (el) el.classList.add('selected');
        }

        async function submitExam() {
            if (!examActive) return;
            examActive = false;
            
            if (timerInterval) clearInterval(timerInterval);

            // Exit Fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(e => {});
            }

            const area = document.getElementById("exam-area");
            area.innerHTML = `<p>Submitting...</p>`;

            try {
                const result = await apiCall("/student/submit-exam", "POST", {
                    date: new Date().toISOString().split("T")[0],
                    subject: currentExamSubject,
                    answers: selectedAnswers,
                    totalQuestions: currentQuestions.length
                });
                
                await fetchSettings(); // refresh setting right before showing results

                let html = `<h2 style="color:var(--primary)">Assessment Completed!</h2><h3>Your Score: ${result.score}%</h3>`;
                if (showCorrection) {
                    html += `<h4>Correction:</h4>`;
                    currentQuestions.forEach((q, i) => {
                        const chosen = selectedAnswers[q.originalIndex];
                        const isCorrect = chosen === q.correct;
                        html += `
                            <div style="margin:20px 0; padding:15px; border-radius:12px; background:rgba(255,255,255,0.1);">
                                <p><strong>${i+1}. ${q.text}</strong></p>
                                ${q.imageUrl ? `<img src="${q.imageUrl}" style="max-width:100%; max-height:200px; border-radius:10px; margin:10px 0; border:1px solid rgba(255,255,255,0.2);">` : ''}
                                <p>Your answer: <span style="color:${isCorrect ? 'lime' : 'red'}">${q.options[chosen] || 'Not answered'}</span></p>
                                <p>Correct answer: <strong style="color:lime">${q.options[q.correct]}</strong></p>
                            </div>`;
                    });
                }
                html += `<button onclick="backToDashboard()" class="glowing-btn danger-btn">← Back to Dashboard</button>`;
                area.innerHTML = html;
            } catch (err) {
                alert("Failed to submit assessment");
            }
        }

        function backToDashboard() {
            renderDashboard();
        }

        // ====================== THEORY EXAM ======================
        async function showAvailableTheoryAssessments() {
            const area = document.getElementById("exam-area");
            area.innerHTML = "<p>🔍 Loading available theory assessments...</p>";

            try {
                const exams = await apiCall("/student/today-theory-exam");
                const examList = Array.isArray(exams) ? exams : (exams ? [exams] : []);

                if (examList.length === 0) {
                    area.innerHTML = `<div style="margin-bottom: 15px;">
                        <h3 style="margin: 0;">No theory assessment available today</h3>
                    </div><p style="margin-top: 10px;">Ask Admin to push exams.</p>`;
                    return;
                }

                let html = `<div style="margin-bottom: 15px;">
                    <h2 style="margin: 0;">Available Theory Assessments Today</h2>
                </div>`;
                examList.forEach(exam => {
                    const dur = exam.duration || 60;
                    html += `
                        <div class="assessment-card theory-card" data-subject="${exam.subject}" data-duration="${dur}">
                            <h3>${exam.subject}</h3>
                            <p>Class: ${exam.class}</p>
                            <p>Duration: ${dur} mins</p>
                            <small>Click to start Theory</small>
                        </div>`;
                });
                area.innerHTML = html;

                setTimeout(() => {
                    document.querySelectorAll('.theory-card').forEach(card => {
                        card.addEventListener('click', () => {
                            const subject = card.getAttribute('data-subject');
                            const duration = parseInt(card.getAttribute('data-duration') || "60");
                            if (subject) startTheoryExam(subject, duration);
                        });
                    });
                }, 100);
            } catch (err) {
                area.innerHTML = `<h3>Error loading assessments</h3>`;
            }
        }

        async function startTheoryExam(subject, duration = 60) {
            const area = document.getElementById("exam-area");
            area.innerHTML = `<p>Loading ${subject} theory questions...</p>`;

            try {
                let questions = await apiCall(`/student/theory-questions/${encodeURIComponent(subject.trim())}/${encodeURIComponent(currentUser?.class || 'SS1')}`);

                if (!questions || questions.length === 0) {
                    area.innerHTML = `<div style="margin-bottom: 15px;">
                        <h3 style="margin: 0;">No theory questions available for ${subject}</h3>
                    </div>`;
                    return;
                }

                currentExamSubject = subject;
                currentQuestions = questions;
                selectedAnswers = {}; // We will store rich text answers here
                examActive = true;
                isPracticeMode = false;
                cheatWarnings = 0;

                const docElm = document.documentElement;
                if (docElm.requestFullscreen) docElm.requestFullscreen().catch(e => {});

                let html = `<div style="margin-bottom: 15px; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin: 0;">${subject} Theory Assessment</h3>
                    <div id="timer-display" style="font-size: 20px; font-weight: bold; background: rgba(255,255,255,0.1); padding: 5px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">--:--</div>
                </div>`;
                
                // Format toolbar for students
                const toolbar = `
                    <div style="background:rgba(255,255,255,0.1); padding:5px; border-radius:8px; display:flex; gap:5px; align-items:center; flex-wrap:wrap; margin-bottom:5px;">
                        <button type="button" class="format-btn" onclick="document.execCommand('superscript', false, null)" title="Superscript">x²</button>
                        <button type="button" class="format-btn" onclick="document.execCommand('subscript', false, null)" title="Subscript">x₂</button>
                        <button type="button" class="format-btn" onclick="document.execCommand('bold', false, null)" style="font-weight:bold;" title="Bold">B</button>
                        <button type="button" class="format-btn" onclick="document.execCommand('italic', false, null)" style="font-style:italic;" title="Italic">I</button>
                    </div>
                `;

                questions.forEach((q, i) => {
                    html += `
                        <div style="margin:25px 0; background:rgba(255,255,255,0.05); padding:15px; border-radius:10px;">
                            <p><strong>${i+1}. ${q.text}</strong></p>
                            ${q.imageUrl ? `<img src="${q.imageUrl}" style="max-width:100%; max-height:300px; border-radius:10px; margin:10px 0; border:1px solid rgba(255,255,255,0.2);">` : ''}
                            <div style="margin-top:15px;">
                                ${toolbar}
                                <div id="theory-ans-${q._id}" contenteditable="true" placeholder="Type your answer here..." style="width:100%; min-height:100px; padding:12px; background:rgba(0,0,0,0.2); border-radius:6px; color:white; outline:none; border:1px solid rgba(255,255,255,0.1);" onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='rgba(255,255,255,0.1)'"></div>
                            </div>
                        </div>`;
                });
                html += `<button onclick="submitTheoryExam()" class="glowing-btn">Submit Theory Assessment</button>`;
                area.innerHTML = html;

                let timeRemaining = duration * 60;
                updateTimerDisplay(timeRemaining);
                
                if (timerInterval) clearInterval(timerInterval);
                timerInterval = setInterval(() => {
                    timeRemaining--;
                    if (timeRemaining <= 0) {
                        clearInterval(timerInterval);
                        alert("Time is up! Your theory assessment will be submitted automatically.");
                        submitTheoryExam();
                    } else {
                        updateTimerDisplay(timeRemaining);
                    }
                }, 1000);
            } catch (err) {
                area.innerHTML = `<h3>Error loading theory questions</h3>`;
            }
        }

        async function submitTheoryExam() {
            if (!examActive) return;
            examActive = false;
            if (timerInterval) clearInterval(timerInterval);

            if (document.fullscreenElement) {
                document.exitFullscreen().catch(e => {});
            }

            const area = document.getElementById("exam-area");
            area.innerHTML = `<p>Submitting Theory...</p>`;

            // Collect answers
            currentQuestions.forEach(q => {
                const el = document.getElementById(`theory-ans-${q._id}`);
                if (el) {
                    selectedAnswers[q._id] = el.innerHTML;
                }
            });

            try {
                await apiCall("/student/submit-theory", "POST", {
                    date: new Date().toISOString().split("T")[0],
                    subject: currentExamSubject,
                    answers: selectedAnswers
                });
                
                area.innerHTML = `<h2 style="color:var(--primary)">Theory Assessment Submitted!</h2>
                                  <p>Your answers have been sent to your teacher for grading.</p>
                                  <button onclick="backToDashboard()" class="glowing-btn danger-btn">← Back to Dashboard</button>`;
            } catch (err) {
                alert("Failed to submit theory assessment");
            }
        }

        async function showMyTheoryResults() {
            const area = document.getElementById("exam-area");
            area.innerHTML = `<h3>Loading your theory results...</h3>`;

            try {
                const results = await apiCall("/student/my-theory-results");

                if (!results || results.length === 0) {
                    area.innerHTML = `<div style="margin-bottom: 15px;">
                        <h3 style="margin: 0;">My Theory Results</h3>
                    </div><p style="margin-top: 10px;">You have not submitted any theory exams yet.</p>`;
                    return;
                }

                let html = `<div style="margin-bottom: 15px;">
                    <h3 style="margin: 0;">My Theory Results</h3>
                </div><table><tr><th>Date</th><th>Subject</th><th>Status</th><th>Score</th><th>Feedback</th></tr>`;
                
                results.forEach(r => {
                    const statusColor = r.status === 'Graded' ? 'lime' : 'orange';
                    html += `<tr>
                        <td>${r.date}</td>
                        <td>${r.subject}</td>
                        <td style="color:${statusColor};">${r.status}</td>
                        <td><strong>${r.score !== null ? r.score : '-'}</strong></td>
                        <td>${r.feedback || '-'}</td>
                    </tr>`;
                });
                html += `</table>`;
                area.innerHTML = html;
            } catch (err) {
                console.error(err);
                area.innerHTML = `<h3>My Theory Results</h3><p>Could not load results at the moment.</p>`;
            }
        }

        // ====================== PRACTICE EXAM ======================
        async function showPracticeExams() {
            const area = document.getElementById("exam-area");
            area.innerHTML = "<p>🔍 Checking practice availability...</p>";

            try {
                const res = await apiCall("/student/practice-subjects");
                if (res.locked) {
                    area.innerHTML = `<div style="margin-bottom: 15px;">
                        <h2 style="margin: 0; color: #ff4757;">Practice Locked</h2>
                    </div><p style="margin-top: 10px;">${res.msg}</p>`;
                    return;
                }

                if (!res.subjects || res.subjects.length === 0) {
                    area.innerHTML = `<div style="margin-bottom: 15px;">
                        <h3 style="margin: 0;">No Practice Available</h3>
                    </div><p style="margin-top: 10px;">There are no past questions available for practice yet.</p>`;
                    return;
                }

                let html = `<div style="margin-bottom: 15px;">
                    <h2 style="margin: 0;">📝 Practice Exams (Past Questions)</h2>
                    <p style="color:rgba(255,255,255,0.7); font-size:14px;">Select a subject to practice past questions. Results will not be recorded in your gradebook.</p>
                </div><div style="display:flex; flex-wrap:wrap; gap:15px;">`;
                
                res.subjects.forEach(subject => {
                    html += `
                        <div class="assessment-card" data-psubject="${subject}" style="flex: 1 1 200px; min-width: 200px;">
                            <h3>${subject}</h3>
                            <small>Click to start practice</small>
                        </div>`;
                });
                html += `</div>`;
                area.innerHTML = html;

                setTimeout(() => {
                    document.querySelectorAll('.assessment-card[data-psubject]').forEach(card => {
                        card.addEventListener('click', () => {
                            const subject = card.getAttribute('data-psubject');
                            if (subject) startPracticeExam(subject);
                        });
                    });
                }, 100);
            } catch (err) {
                area.innerHTML = `<h3>Error loading practice exams</h3>`;
            }
        }

        async function startPracticeExam(subject) {
            const area = document.getElementById("exam-area");
            area.innerHTML = `<p>Loading ${subject} practice questions...</p>`;

            try {
                let questions = await apiCall(`/student/practice-questions/${encodeURIComponent(subject.trim())}`);
                if (!questions || questions.length === 0) {
                    area.innerHTML = `<h3>No questions available for ${subject}</h3>`;
                    return;
                }

                questions = questions.map((q, idx) => ({ ...q, originalIndex: idx }));
                
                for (let i = questions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [questions[i], questions[j]] = [questions[j], questions[i]];
                }

                currentExamSubject = subject;
                currentQuestions = questions;
                selectedAnswers = {};
                examActive = true;
                isPracticeMode = true; 
                
                let html = `<div style="margin-bottom: 15px; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin: 0;">📝 ${subject} Practice</h3>
                </div>`;
                questions.forEach((q, i) => {
                    const oIdx = q.originalIndex;
                    html += `
                        <div style="margin:25px 0">
                            <p><strong>${i+1}. ${q.text}</strong></p>
                            ${q.imageUrl ? `<img src="${q.imageUrl}" style="max-width:100%; max-height:300px; border-radius:10px; margin:10px 0; border:1px solid rgba(255,255,255,0.2);">` : ''}
                            ${q.options.map((opt, j) => `
                                <div class="option" id="opt-${oIdx}-${j}" onclick="selectAnswer(${oIdx},${j})">${opt}</div>
                            `).join('')}
                        </div>`;
                });
                html += `<button onclick="submitPracticeExam()" class="glowing-btn">Submit Practice</button>`;
                area.innerHTML = html;

            } catch (err) {
                area.innerHTML = `<h3 style="color:#ff4757;">Error</h3><p>${err.message || 'Could not load practice questions'}</p>`;
            }
        }

        async function submitPracticeExam() {
            if (!examActive) return;
            examActive = false;
            isPracticeMode = false;

            const area = document.getElementById("exam-area");
            area.innerHTML = `<p>Grading practice...</p>`;

            try {
                const result = await apiCall("/student/submit-practice", "POST", {
                    subject: currentExamSubject,
                    answers: selectedAnswers,
                    totalQuestions: currentQuestions.length
                });
                
                let html = `<h2 style="color:var(--primary)">Practice Completed!</h2><h3>Your Score: ${result.score}%</h3>`;
                html += `<h4>Correction:</h4>`;
                currentQuestions.forEach((q, i) => {
                    const chosen = selectedAnswers[q.originalIndex];
                    const isCorrect = chosen === q.correct;
                    html += `
                        <div style="margin:20px 0; padding:15px; border-radius:12px; background:rgba(255,255,255,0.1);">
                            <p><strong>${i+1}. ${q.text}</strong></p>
                            ${q.imageUrl ? `<img src="${q.imageUrl}" style="max-width:100%; max-height:200px; border-radius:10px; margin:10px 0; border:1px solid rgba(255,255,255,0.2);">` : ''}
                            <p>Your answer: <span style="color:${isCorrect ? 'lime' : 'red'}">${q.options[chosen] || 'Not answered'}</span></p>
                            <p>Correct answer: <strong style="color:lime">${q.options[q.correct]}</strong></p>
                        </div>`;
                });
                
                html += `<button onclick="backToDashboard()" class="glowing-btn danger-btn">← Back to Dashboard</button>`;
                area.innerHTML = html;
            } catch (err) {
                alert("Failed to submit practice");
                backToDashboard();
            }
        }

        // ====================== MY RESULTS ======================
        async function showMyResults() {
            const area = document.getElementById("exam-area");
            area.innerHTML = `<h3>Loading your results...</h3>`;

            try {
                const results = await apiCall("/student/my-results");

                if (!results || results.length === 0) {
                    area.innerHTML = `<div style="margin-bottom: 15px;">
                        <h3 style="margin: 0;">My Results</h3>
                    </div><p style="margin-top: 10px;">You have not taken any exams yet.</p>`;
                    return;
                }

                let html = `<div style="margin-bottom: 15px;">
                    <h3 style="margin: 0;">My Results</h3>
                </div><table><tr><th>Date</th><th>Subject</th><th>Score</th></tr>`;
                results.forEach(r => {
                    html += `<tr><td>${r.date}</td><td>${r.subject}</td><td><strong>${r.score}%</strong></td></tr>`;
                });
                html += `</table>`;
                area.innerHTML = html;
            } catch (err) {
                console.error(err);
                area.innerHTML = `<h3>My Results</h3><p>Could not load results at the moment.</p>`;
            }
        }

        // ====================== ENTERPRISE ANTI-CHEAT & KIOSK MODE ======================
        let cheatWarnings = 0;
        const maxWarnings = 3;
        let isWarningShowing = false;
        let lastWarningTime = 0;

        function handleAntiCheat(reason) {
            if (!examActive || isPracticeMode) return;

            const now = Date.now();
            if (isWarningShowing || (now - lastWarningTime < 2000)) return; // Prevent rapid-fire events

            cheatWarnings++;
            lastWarningTime = now;

            if (cheatWarnings > maxWarnings) {
                // Remove overlay if exists
                const existingOverlay = document.getElementById('anti-cheat-overlay');
                if (existingOverlay) existingOverlay.remove();

                alert(`🚨 STRICT ANTI-CHEAT ALERT: You have violated the rules more than ${maxWarnings} times (${reason}). Your exam is being automatically submitted to prevent malpractice.`);
                submitExam();
            } else {
                isWarningShowing = true;
                
                // Use a Custom Fullscreen HTML Overlay instead of native alert() to prevent focus/blur loops
                const overlay = document.createElement("div");
                overlay.id = "anti-cheat-overlay";
                overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; text-align:center; padding:20px;";
                
                overlay.innerHTML = `
                    <h1 style="color:#ff4757; font-size:40px; margin-bottom:20px;">⚠️ ANTI-CHEAT WARNING (${cheatWarnings}/${maxWarnings})</h1>
                    <h2 style="margin-bottom:30px;">Violation: ${reason}</h2>
                    <p style="font-size:18px; margin-bottom:40px; max-width:600px; line-height:1.5;">
                        You are strictly prohibited from switching tabs, minimizing the window, right-clicking, or exiting fullscreen. 
                        <br><br>
                        If you receive more than <strong>${maxWarnings} warnings</strong>, your exam will be automatically submitted and flagged for malpractice.
                    </p>
                    <button id="resume-exam-btn" class="glowing-btn danger-btn" style="background:#ff4757; font-size:20px; padding:15px 30px; border:none; border-radius:10px; color:white; cursor:pointer;">I Understand & Resume Exam</button>
                `;
                
                document.body.appendChild(overlay);
                
                document.getElementById('resume-exam-btn').addEventListener('click', () => {
                    overlay.remove();
                    
                    // Force fullscreen again based on user click gesture
                    const docElm = document.documentElement;
                    if (docElm.requestFullscreen) docElm.requestFullscreen().catch(e => {});
                    else if (docElm.webkitRequestFullScreen) docElm.webkitRequestFullScreen();
                    
                    // Slight delay before unlocking warnings to prevent instant re-trigger
                    setTimeout(() => {
                        isWarningShowing = false;
                    }, 1000);
                });
            }
        }

        // Tab Switching & Window Minimize Detection
        window.addEventListener("blur", () => handleAntiCheat("You left the exam window/tab"));
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) handleAntiCheat("You switched tabs");
        });

        // Refresh Warning
        window.addEventListener("beforeunload", (e) => {
            if (examActive) {
                handleAntiCheat("You attempted to refresh or leave the page");
                e.preventDefault();
                e.returnValue = "Leaving will submit your exam!";
            }
        });

        // Fullscreen Exit Detection
        document.addEventListener("fullscreenchange", () => {
            if (!document.fullscreenElement && examActive) {
                handleAntiCheat("You exited fullscreen mode");
            }
        });

        // Disable Right Click (Context Menu)
        document.addEventListener('contextmenu', event => {
            if (examActive) {
                event.preventDefault();
                handleAntiCheat("Right-click is strictly disabled");
            }
        });

        // Disable Copy, Cut, Paste
        ['copy', 'cut', 'paste'].forEach(evt => {
            document.addEventListener(evt, e => {
                if (examActive) {
                    e.preventDefault();
                    handleAntiCheat(`${evt.toUpperCase()} operation is disabled`);
                }
            });
        });

        // Disable Developer Tools & Keyboard Shortcuts
        document.addEventListener('keydown', event => {
            if (!examActive) return;

            // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+C, Ctrl+V, Alt+Tab
            if (
                event.key === 'F12' || 
                event.key === 'F5' ||
                (event.ctrlKey && event.key.toLowerCase() === 'r') || 
                (event.ctrlKey && event.shiftKey && ['I','J','C'].includes(event.key.toUpperCase())) ||
                (event.ctrlKey && ['U','C','V','X','P'].includes(event.key.toUpperCase()))
            ) {
                event.preventDefault();
                handleAntiCheat("Prohibited Keyboard Shortcut Detected");
            }
        });

        // ====================== CLASS NOTES ======================
        async function showClassNotes() {
            const area = document.getElementById("exam-area");
            area.innerHTML = `<h3>Loading Class Notes...</h3>`;
            try {
                const notes = await apiCall("/student/notes/class");
                if (!notes || notes.length === 0) {
                    area.innerHTML = `<h3>📚 Class Notes</h3><p>Your teachers have not uploaded any notes for your class yet.</p>`;
                    return;
                }
                let html = `<h3>📚 Class Notes</h3><div style="display:flex; flex-wrap:wrap; gap:15px;">`;
                notes.forEach(n => {
                    html += `<div class="assessment-card" style="cursor:default;">
                        <h4 style="margin:0 0 10px 0; color:var(--primary);">${n.title}</h4>
                        <p style="margin:5px 0;"><strong>Subject:</strong> ${n.subject}</p>
                        <p style="margin:5px 0;"><strong>By:</strong> ${n.teacherId?.name || 'Teacher'}</p>
                        <a href="${n.fileUrl}" target="_blank" class="glowing-btn" style="display:inline-block; margin-top:10px; text-decoration:none; text-align:center;">Download/View</a>
                    </div>`;
                });
                html += `</div>`;
                area.innerHTML = html;
            } catch (err) {
                area.innerHTML = `<h3>📚 Class Notes</h3><p>Could not load notes.</p>`;
            }
        }

        // ====================== PERSONAL NOTES ======================
        async function showMyNotes() {
            const area = document.getElementById("exam-area");
            area.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0;">📓 My Personal Notes</h3>
                    <button onclick="createPersonalNote()" class="glowing-btn" style="padding:8px 15px; font-size:14px;">+ New Note</button>
                </div>
                <div id="personal-notes-list">Loading...</div>
            `;
            loadPersonalNotes();
        }

        async function loadPersonalNotes() {
            const list = document.getElementById("personal-notes-list");
            if (!list) return;
            try {
                const notes = await apiCall("/student/notes/personal");
                if (!notes || notes.length === 0) {
                    list.innerHTML = `<p>You don't have any personal notes. Click '+ New Note' to create one.</p>`;
                    return;
                }
                let html = `<div style="display:flex; flex-direction:column; gap:10px;">`;
                notes.forEach(n => {
                    html += `
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="margin:0 0 5px 0; color:var(--primary);">${n.title}</h4>
                            <p style="margin:0; font-size:12px; color:rgba(255,255,255,0.5);">Updated: ${new Date(n.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button onclick="editPersonalNote('${n._id}')" class="glowing-btn" style="padding:5px 10px; font-size:12px;">View/Edit</button>
                            <button onclick="deletePersonalNote('${n._id}')" style="background:var(--danger); color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:12px;">Delete</button>
                        </div>
                    </div>`;
                });
                html += `</div>`;
                list.innerHTML = html;
            } catch (err) {
                list.innerHTML = `<p style="color:red;">Failed to load personal notes.</p>`;
            }
        }

        function createPersonalNote() {
            showModal(`
                <h2>Create Personal Note</h2>
                <input id="p-note-title" placeholder="Note Title" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;">
                <textarea id="p-note-content" placeholder="Write your note here..." style="width:100%; height:200px; padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px; resize:vertical; font-family:inherit;"></textarea>
                <button onclick="savePersonalNote()" class="glowing-btn" style="width:100%; margin-top:10px;">Save Note</button>
            `);
        }

        async function savePersonalNote(id = null) {
            const title = document.getElementById("p-note-title").value;
            const content = document.getElementById("p-note-content").value;
            if (!title || !content) {
                alert("Please enter title and content.");
                return;
            }
            try {
                if (id) {
                    await apiCall("/student/notes/personal/" + id, "PUT", { title, content });
                    alert("✅ Note updated");
                } else {
                    await apiCall("/student/notes/personal", "POST", { title, content });
                    alert("✅ Note created");
                }
                closeModal();
                showMyNotes();
            } catch (err) {
                alert("Failed to save note");
            }
        }

        async function editPersonalNote(id) {
            try {
                const notes = await apiCall("/student/notes/personal");
                const note = notes.find(n => n._id === id);
                if (!note) return;
                showModal(`
                    <h2>Edit Personal Note</h2>
                    <input id="p-note-title" value="${note.title}" placeholder="Note Title" style="width:100%;padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px;">
                    <textarea id="p-note-content" placeholder="Write your note here..." style="width:100%; height:200px; padding:12px;margin:8px 0; border:1px solid rgba(255,255,255,0.2); background:rgba(0,0,0,0.2); color:white; border-radius:6px; resize:vertical; font-family:inherit;">${note.content}</textarea>
                    <button onclick="savePersonalNote('${id}')" class="glowing-btn" style="width:100%; margin-top:10px;">Update Note</button>
                `);
            } catch (err) {
                alert("Failed to load note");
            }
        }

        async function deletePersonalNote(id) {
            if (confirm("Are you sure you want to delete this note?")) {
                try {
                    await apiCall("/student/notes/personal/" + id, "DELETE");
                    loadPersonalNotes();
                } catch (err) {
                    alert("Failed to delete note");
                }
            }
        }

        // ================= STUDENT GRADES VIEW =================

        async function showMyGrades() {
            showModal(`<h2>My Grades</h2><p>Loading grades...</p>`);
            try {
                const grades = await apiCall("/student/my-grades");
                
                if (grades.length === 0) {
                    showModal(`<h2>My Grades</h2><p>No grades entered yet. Check back later.</p>`);
                    return;
                }

                let html = `<h2>My Grades (C.A + Exam)</h2>
                    <p style="font-size:13px; color:var(--text-muted); margin-bottom:15px;">
                        These are your overall grades entered by teachers, separate from individual exam scores.
                    </p>
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="background:rgba(255,255,255,0.1); border-bottom:2px solid var(--primary);">
                                <th style="padding:10px; text-align:left;">Subject</th>
                                <th style="padding:10px; text-align:center;">C.A</th>
                                <th style="padding:10px; text-align:center;">Exam</th>
                                <th style="padding:10px; text-align:center;">Average</th>
                                <th style="padding:10px; text-align:left;">Term</th>
                            </tr>
                        </thead>
                        <tbody>`;
                
                grades.forEach(g => {
                    const caDisplay = g.caScore !== null ? g.caScore.toFixed(1) : '-';
                    const examDisplay = g.examScore !== null ? g.examScore.toFixed(1) : '-';
                    const avgDisplay = g.average !== null ? g.average.toFixed(2) : '-';
                    
                    html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
                        <td style="padding:10px;"><strong>${g.subject}</strong></td>
                        <td style="padding:10px; text-align:center;">${caDisplay}</td>
                        <td style="padding:10px; text-align:center;">${examDisplay}</td>
                        <td style="padding:10px; text-align:center; font-weight:600; color:var(--primary);">${avgDisplay}</td>
                        <td style="padding:10px;">${g.title || '-'}</td>
                    </tr>`;
                });
                
                html += `</tbody></table>`;
                showModal(html);
            } catch(err) {
                showModal(`<h2>Error</h2><p>Failed to load grades</p>`);
            }
        }

        // Initialize
        window.addEventListener("DOMContentLoaded", renderDashboard);
