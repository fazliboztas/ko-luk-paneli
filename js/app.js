const app = document.getElementById("app");

const storedStudents = localStorage.getItem("boztas-students");
let students = storedStudents ? JSON.parse(storedStudents) : [];
students = students.map(student => ({ ...student, id: student.id || crypto.randomUUID() }));
const storedPrograms = localStorage.getItem("boztas-programs");
let programs = storedPrograms ? JSON.parse(storedPrograms) : [];
let firebaseServices = null;
let signedInUser = null;
let userRole = null;
let authReady = false;
let authError = "";
let firebaseUnsubscribers = [];
let currentPage = "dashboard";
let isStudentModalOpen = false;
let isTaskModalOpen = false;
let selectedStudentId = "";
let editingTaskId = null;
let resultTaskId = null;
let accountStudentId = null;
let questionTaskId = null;
let selectedWeekStart = academicWeeks[0].key;

async function saveStudents() {
    localStorage.setItem("boztas-students", JSON.stringify(students));
    if (!firebaseServices || userRole !== "coach") return;
    await Promise.all(students.map(student => firebaseServices.firestoreSdk.setDoc(
        firebaseServices.firestoreSdk.doc(firebaseServices.db, "students", student.id),
        { ...student, coachId: signedInUser.uid }
    )));
}

function storePrograms() {
    localStorage.setItem("boztas-programs", JSON.stringify(programs));
}

async function saveProgram(program) {
    storePrograms();
    if (!firebaseServices || !["coach", "student"].includes(userRole)) return;
    await firebaseServices.firestoreSdk.setDoc(
        firebaseServices.firestoreSdk.doc(firebaseServices.db, "tasks", program.id),
        userRole === "coach" ? { ...program, coachId: signedInUser.uid } : program
    );
}

async function updateStudentTask(taskId, changes) {
    storePrograms();
    if (!firebaseServices || userRole !== "student") return;
    await firebaseServices.firestoreSdk.updateDoc(
        firebaseServices.firestoreSdk.doc(firebaseServices.db, "tasks", taskId),
        changes
    );
}

async function deleteProgram(taskId) {
    storePrograms();
    if (!firebaseServices || userRole !== "coach") return;
    await firebaseServices.firestoreSdk.deleteDoc(firebaseServices.firestoreSdk.doc(firebaseServices.db, "tasks", taskId));
}

async function showSaveError(error) {
    console.error("Program kaydedilemedi:", error);
    // Ekrandaki geçici değişikliği, buluttaki gerçek veriyle geri eşitle.
    try {
        await loadFirebaseData();
    } catch (reloadError) {
        console.error("Bulut verisi yeniden yüklenemedi:", reloadError);
    }
    window.alert("Değişiklik buluta kaydedilemedi. İnternet bağlantısını ve Firebase kurallarını kontrol edip tekrar deneyin.");
    render();
}

function celebrateTaskCompletion() {
    const colors = ["#f43f5e", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"];
    const fireworks = document.createElement("div");
    fireworks.className = "completion-fireworks";
    fireworks.innerHTML = Array.from({ length: 42 }, (_, index) => `<i style="--x:${(Math.random() * 100).toFixed(1)}vw;--y:${(Math.random() * 60 + 10).toFixed(1)}vh;--c:${colors[index % colors.length]};--d:${(Math.random() * .35).toFixed(2)}s"></i>`).join("");
    document.body.append(fireworks);
    window.setTimeout(() => fireworks.remove(), 1700);
}

function render() {
    if (!authReady) {
        app.innerHTML = `<main class="min-h-screen bg-slate-950 grid place-items-center p-5"><div class="text-center text-white"><i class="fa-solid fa-spinner fa-spin text-3xl"></i><p class="mt-4 text-slate-300">Oturum yükleniyor…</p></div></main>`;
        return;
    }
    if (!signedInUser) {
        renderLogin();
        return;
    }
    if (userRole === "student") currentPage = "student";
    const page = currentPage === "students" ? studentsPage()
        : currentPage === "programs" ? programsPage()
        : currentPage === "student" ? studentPanelPage()
        : dashboardPage();

    app.innerHTML = `
        <div class="min-h-screen flex bg-slate-100">
            <aside class="w-72 shrink-0 bg-slate-900 text-white p-6">
                <h1 class="text-3xl font-bold mb-2">Boztaş</h1>
                <p class="text-slate-400 text-sm mb-10">Koçluk Paneli</p>

                <nav class="space-y-2">
                    ${userRole === "coach" ? `
                    <button data-page="dashboard" class="nav-button ${currentPage === "dashboard" ? "nav-active" : ""}">
                        <i class="fa-solid fa-house w-6"></i> Dashboard
                    </button>
                    <button data-page="students" class="nav-button ${currentPage === "students" ? "nav-active" : ""}">
                        <i class="fa-solid fa-user-graduate w-6"></i> Öğrenciler
                    </button>
                    <button data-page="programs" class="nav-button ${currentPage === "programs" ? "nav-active" : ""}">
                        <i class="fa-solid fa-calendar-days w-6"></i> Programlar
                    </button>
                    <button data-page="student" class="nav-button ${currentPage === "student" ? "nav-active" : ""}">
                        <i class="fa-solid fa-mobile-screen-button w-6"></i> Öğrenci Önizleme
                    </button>
                    <button class="nav-button nav-disabled" type="button" title="Yakında eklenecek">
                        <i class="fa-solid fa-gear w-6"></i> Ayarlar
                    </button>` : ""}
                </nav>
                <button id="signOutBtn" class="mt-12 text-sm text-slate-400 hover:text-white"><i class="fa-solid fa-arrow-right-from-bracket mr-2"></i>Çıkış yap</button>
            </aside>

            <main class="flex-1 p-6 md:p-10 overflow-auto">${page}</main>
        </div>
        ${studentModal(isStudentModalOpen)}
        ${taskModal(isTaskModalOpen, students, programs.find(program => program.id === editingTaskId))}
        ${resultModal(resultTaskId ? programs.find(program => program.id === resultTaskId) : null)}
        ${accountModal(accountStudentId ? students.find(student => student.id === accountStudentId) : null)}
        ${questionModal(questionTaskId ? programs.find(task => task.id === questionTaskId) : null)}
    `;

    document.querySelectorAll("[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            currentPage = button.dataset.page;
            render();
        });
    });

    document.getElementById("signOutBtn")?.addEventListener("click", () => firebaseServices.authSdk.signOut(firebaseServices.auth));

    const addButton = document.getElementById("addStudentBtn");
    if (addButton) {
        addButton.addEventListener("click", () => {
            isStudentModalOpen = true;
            render();
            document.getElementById("studentName").focus();
        });
    }

    const closeModal = () => {
        isStudentModalOpen = false;
        render();
    };

    document.getElementById("closeStudentModal")?.addEventListener("click", closeModal);
    document.getElementById("cancelStudentModal")?.addEventListener("click", closeModal);

    document.getElementById("studentForm")?.addEventListener("submit", event => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        students.push({
            id: crypto.randomUUID(),
            name: formData.get("name").trim(),
            class: formData.get("class").trim(),
            phone: formData.get("phone").trim()
        });
        saveStudents();
        isStudentModalOpen = false;
        render();
    });

    document.getElementById("programStudentSelect")?.addEventListener("change", event => {
        selectedStudentId = event.target.value;
        render();
    });

    document.getElementById("studentPreviewSelect")?.addEventListener("change", event => {
        selectedStudentId = event.target.value;
        selectedWeekStart = "";
        render();
    });

    document.querySelectorAll("[data-week-shift]").forEach(button => {
        button.addEventListener("click", () => {
            const index = visibleAcademicWeeks.findIndex(week => week.key === selectedWeekStart);
            const nextIndex = index + Number(button.dataset.weekShift);
            if (visibleAcademicWeeks[nextIndex]) {
                selectedWeekStart = visibleAcademicWeeks[nextIndex].key;
                render();
            }
        });
    });

    document.getElementById("weekSelect")?.addEventListener("change", event => {
        selectedWeekStart = event.target.value;
        render();
    });

    document.getElementById("addTaskBtn")?.addEventListener("click", () => {
        editingTaskId = null;
        isTaskModalOpen = true;
        render();
        document.getElementById("taskDay").focus();
    });

    const closeTaskModal = () => {
        isTaskModalOpen = false;
        editingTaskId = null;
        render();
    };
    document.getElementById("closeTaskModal")?.addEventListener("click", closeTaskModal);
    document.getElementById("cancelTaskModal")?.addEventListener("click", closeTaskModal);

    const updateQuestionGoalRequirement = () => {
        const selectedType = document.querySelector('input[name="taskType"]:checked')?.value;
        const input = document.getElementById("taskGoalQuestions");
        const wrap = document.getElementById("taskQuestionGoalWrap");
        if (!input || !wrap) return;
        const required = ["Soru", "Tekrar", "Deneme"].includes(selectedType);
        input.required = required;
        wrap.classList.toggle("hidden", !required);
    };
    document.querySelectorAll('input[name="taskType"]').forEach(input => input.addEventListener("change", updateQuestionGoalRequirement));
    updateQuestionGoalRequirement();

    document.getElementById("taskForm")?.addEventListener("submit", async event => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const taskData = {
            day: formData.get("day"),
            subject: formData.get("subject").trim(),
            taskType: formData.get("taskType"),
            description: formData.get("description").trim(),
            duration: formData.get("duration"),
            goalQuestions: formData.get("goalQuestions") ? Number(formData.get("goalQuestions")) : null,
            resourceUrl: formData.get("resourceUrl").trim(),
            completed: false
        };
        let program;
        if (editingTaskId) {
            program = { ...programs.find(item => item.id === editingTaskId), ...taskData };
            programs = programs.map(item => item.id === editingTaskId ? program : item);
        } else {
            const student = students.find(item => item.id === selectedStudentId);
            if (!student.programStart) {
                student.programStart = selectedWeekStart;
                saveStudents();
            }
            program = { id: crypto.randomUUID(), studentId: selectedStudentId, weekStart: selectedWeekStart, ...taskData };
            programs.push(program);
        }
        try {
            await saveProgram(program);
            isTaskModalOpen = false;
            editingTaskId = null;
            render();
        } catch (error) {
            await showSaveError(error);
        }
    });

    document.querySelectorAll("[data-delete-task]").forEach(button => {
        button.addEventListener("click", async () => {
            programs = programs.filter(program => program.id !== button.dataset.deleteTask);
            try {
                await deleteProgram(button.dataset.deleteTask);
                render();
            } catch (error) {
                await showSaveError(error);
            }
        });
    });

    document.querySelectorAll("[data-delete-student]").forEach(button => {
        button.addEventListener("click", () => {
            const student = students.find(item => item.id === button.dataset.deleteStudent);
            if (!student) return;
            const studentPrograms = programs.filter(program => program.studentId === student.id);
            const confirmed = window.confirm(`${student.name} silinsin mi? Bu öğrenciye ait tüm programlar ve deneme sonuçları da silinecek.`);
            if (!confirmed) return;
            students = students.filter(item => item.id !== student.id);
            programs = programs.filter(program => program.studentId !== student.id);
            if (selectedStudentId === student.id) {
                selectedStudentId = students[0]?.id || "";
                selectedWeekStart = "";
            }
            saveStudents();
            if (firebaseServices && userRole === "coach") {
                firebaseServices.firestoreSdk.deleteDoc(firebaseServices.firestoreSdk.doc(firebaseServices.db, "students", student.id));
                studentPrograms.forEach(program => firebaseServices.firestoreSdk.deleteDoc(firebaseServices.firestoreSdk.doc(firebaseServices.db, "tasks", program.id)));
            }
            render();
        });
    });

    document.querySelectorAll("[data-create-account]").forEach(button => {
        button.addEventListener("click", () => {
            const student = students.find(item => item.id === button.dataset.createAccount);
            if (!student) return;
            if (student.authUid) {
                window.alert("Bu öğrenci için zaten bir giriş hesabı bağlı.");
                return;
            }
            accountStudentId = student.id;
            render();
        });
    });

    const closeAccountModal = () => { accountStudentId = null; render(); };
    document.getElementById("closeAccountModal")?.addEventListener("click", closeAccountModal);
    document.getElementById("cancelAccountModal")?.addEventListener("click", closeAccountModal);
    document.getElementById("accountForm")?.addEventListener("submit", async event => {
        event.preventDefault();
        const student = students.find(item => item.id === accountStudentId);
        if (!student || !firebaseServices || userRole !== "coach") return;
        const form = new FormData(event.currentTarget);
        try {
            const credential = await firebaseServices.authSdk.createUserWithEmailAndPassword(firebaseServices.studentAuth, form.get("email"), form.get("password"));
            await firebaseServices.firestoreSdk.setDoc(firebaseServices.firestoreSdk.doc(firebaseServices.db, "users", credential.user.uid), {
                role: "student", studentId: student.id, coachId: signedInUser.uid, email: form.get("email"), name: student.name
            });
            await firebaseServices.authSdk.signOut(firebaseServices.studentAuth);
            student.authUid = credential.user.uid;
            student.email = form.get("email");
            await saveStudents();
            accountStudentId = null;
            render();
        } catch (error) {
            const message = error.code === "auth/email-already-in-use" ? "Bu e-posta ile zaten bir hesap var." : `Hesap oluşturulamadı: ${error.code || "bilinmeyen hata"}`;
            window.alert(message);
        }
    });

    document.querySelectorAll("[data-edit-task]").forEach(button => {
        button.addEventListener("click", () => {
            editingTaskId = button.dataset.editTask;
            isTaskModalOpen = true;
            render();
        });
    });

    document.querySelectorAll("[data-copy-task]").forEach(button => {
        button.addEventListener("click", async () => {
            const task = programs.find(program => program.id === button.dataset.copyTask);
            if (!task) return;
            const copy = { ...task, id: crypto.randomUUID(), completed: false, result: undefined };
            programs.push(copy);
            try {
                await saveProgram(copy);
                render();
            } catch (error) {
                await showSaveError(error);
            }
        });
    });

    document.querySelectorAll("[data-complete-task]").forEach(button => {
        button.addEventListener("click", async () => {
            const task = programs.find(program => program.id === button.dataset.completeTask);
            if (!task) return;
            if (task.taskType === "Deneme") {
                resultTaskId = task.id;
                render();
            } else if (["Soru", "Tekrar"].includes(task.taskType) && !task.completed) {
                questionTaskId = task.id;
                render();
            } else {
                const changes = { completed: !task.completed };
                const updatedTask = { ...task, ...changes };
                programs = programs.map(program => program.id === task.id ? updatedTask : program);
                try {
                    if (userRole === "student") await updateStudentTask(task.id, changes);
                    else await saveProgram(updatedTask);
                    render();
                    if (changes.completed) celebrateTaskCompletion();
                } catch (error) {
                    await showSaveError(error);
                }
            }
        });
    });

    const closeQuestionModal = () => { questionTaskId = null; render(); };
    document.getElementById("closeQuestionModal")?.addEventListener("click", closeQuestionModal);
    document.getElementById("cancelQuestionModal")?.addEventListener("click", closeQuestionModal);
    document.getElementById("questionForm")?.addEventListener("submit", async event => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const changes = { completed: true, solvedQuestions: Number(formData.get("solvedQuestions")) };
        const task = programs.find(item => item.id === questionTaskId);
        const updatedTask = { ...task, ...changes };
        programs = programs.map(item => item.id === questionTaskId ? updatedTask : item);
        try {
            if (userRole === "student") await updateStudentTask(questionTaskId, changes);
            else await saveProgram(updatedTask);
            questionTaskId = null;
            render();
            celebrateTaskCompletion();
        } catch (error) {
            await showSaveError(error);
        }
    });

    const closeResultModal = () => { resultTaskId = null; render(); };
    document.getElementById("closeResultModal")?.addEventListener("click", closeResultModal);
    document.getElementById("cancelResultModal")?.addEventListener("click", closeResultModal);
    document.getElementById("resultForm")?.addEventListener("submit", async event => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const task = programs.find(program => program.id === resultTaskId);
        const scores = {};
        (task.subject === "TYT Genel Deneme" ? ["Türkçe", "Sosyal", "Matematik", "Fizik", "Kimya", "Biyoloji"]
            : task.subject === "AYT Genel Deneme" ? ["Matematik", "Fizik", "Kimya", "Biyoloji"] : [task.subject])
            .forEach(subject => { scores[subject] = formData.get(`score-${subject}`); });
        const changes = { completed: true, solvedQuestions: Number(formData.get("solvedQuestions")), result: { scores, note: formData.get("note").trim() } };
        const updatedTask = { ...task, ...changes };
        programs = programs.map(program => program.id === resultTaskId ? updatedTask : program);
        try {
            if (userRole === "student") await updateStudentTask(resultTaskId, changes);
            else await saveProgram(updatedTask);
            resultTaskId = null;
            render();
            celebrateTaskCompletion();
        } catch (error) {
            await showSaveError(error);
        }
    });

    document.querySelectorAll("[data-task-card]").forEach(card => {
        card.addEventListener("dragstart", event => {
            event.dataTransfer.setData("text/plain", card.dataset.taskCard);
            event.dataTransfer.effectAllowed = "move";
            card.classList.add("dragging-task");
        });
        card.addEventListener("dragend", () => card.classList.remove("dragging-task"));
    });
    document.querySelectorAll("[data-day-dropzone]").forEach(zone => {
        zone.addEventListener("dragover", event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; zone.classList.add("drag-over"); });
        zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
        zone.addEventListener("drop", async event => {
            event.preventDefault();
            zone.classList.remove("drag-over");
            const taskId = event.dataTransfer.getData("text/plain");
            const task = programs.find(program => program.id === taskId);
            if (!task) return;
            const copy = { ...task, id: crypto.randomUUID(), day: zone.dataset.dayDropzone, completed: false, result: undefined };
            programs.push(copy);
            try {
                await saveProgram(copy);
                render();
            } catch (error) {
                await showSaveError(error);
            }
        });
    });

    renderExamCharts();
    renderStudentExamCharts();
}

function renderLogin() {
    app.innerHTML = `<main class="min-h-screen bg-slate-950 flex items-center justify-center p-5"><section class="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl"><div class="text-center mb-8"><div class="inline-grid place-items-center w-12 h-12 rounded-xl bg-blue-600 text-white text-xl"><i class="fa-solid fa-graduation-cap"></i></div><h1 class="text-3xl font-bold text-slate-900 mt-4">Boztaş Koçluk</h1><p class="text-slate-500 mt-2">Paneline güvenle giriş yap.</p></div><form id="loginForm"><label class="form-label" for="loginEmail">E-posta</label><input id="loginEmail" name="email" class="form-input" type="email" required autocomplete="email"><label class="form-label" for="loginPassword">Şifre</label><input id="loginPassword" name="password" class="form-input" type="password" required autocomplete="current-password">${authError ? `<p class="text-red-600 text-sm mt-4">${escapeHtml(authError)}</p>` : ""}<button class="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg" type="submit">Giriş yap</button></form></section></main>`;
    document.getElementById("loginForm")?.addEventListener("submit", async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
            authError = "";
            await firebaseServices.authSdk.signInWithEmailAndPassword(firebaseServices.auth, form.get("email"), form.get("password"));
        } catch (error) {
            const messages = {
                "auth/invalid-credential": "E-posta veya şifre hatalı.",
                "auth/user-not-found": "Bu e-posta ile kayıtlı kullanıcı bulunamadı.",
                "auth/wrong-password": "Şifre hatalı.",
                "auth/invalid-email": "E-posta adresi geçerli değil.",
                "auth/operation-not-allowed": "Firebase Authentication'da E-posta/Şifre giriş yöntemi etkin değil.",
                "auth/unauthorized-domain": "Bu alan adı Firebase Authentication için yetkilendirilmemiş. Uygulamayı bir web sunucusundan açın veya Firebase Console'da alan adını yetkilendirin.",
                "auth/network-request-failed": "Firebase'e ağ bağlantısı kurulamadı. İnternet bağlantısını kontrol edin."
            };
            authError = messages[error.code] || `Giriş hatası: ${error.code || "bilinmeyen hata"}`;
            renderLogin();
        }
    });
}

async function loadFirebaseData() {
    const { firestoreSdk, db } = firebaseServices;
    firebaseUnsubscribers.forEach(unsubscribe => unsubscribe());
    firebaseUnsubscribers = [];
    if (userRole === "coach") {
        const studentsSnapshot = await firestoreSdk.getDocs(firestoreSdk.query(firestoreSdk.collection(db, "students"), firestoreSdk.where("coachId", "==", signedInUser.uid)));
        const tasksSnapshot = await firestoreSdk.getDocs(firestoreSdk.query(firestoreSdk.collection(db, "tasks"), firestoreSdk.where("coachId", "==", signedInUser.uid)));
        const cloudStudents = studentsSnapshot.docs.map(snapshot => snapshot.data());
        const cloudPrograms = tasksSnapshot.docs.map(snapshot => snapshot.data());
        if (cloudStudents.length === 0 && students.length > 0) {
            // İlk geçişte yalnızca boş Firebase hesabına yerel verileri taşır.
            students.forEach(student => { student.coachId = signedInUser.uid; });
            programs.forEach(program => { program.coachId = signedInUser.uid; });
            await saveStudents();
            await Promise.all(programs.map(saveProgram));
        } else {
            students = cloudStudents;
            programs = cloudPrograms;
        }
        const studentsQuery = firestoreSdk.query(firestoreSdk.collection(db, "students"), firestoreSdk.where("coachId", "==", signedInUser.uid));
        const tasksQuery = firestoreSdk.query(firestoreSdk.collection(db, "tasks"), firestoreSdk.where("coachId", "==", signedInUser.uid));
        firebaseUnsubscribers.push(
            firestoreSdk.onSnapshot(studentsQuery, snapshot => { students = snapshot.docs.map(item => item.data()); if (authReady) render(); }),
            firestoreSdk.onSnapshot(tasksQuery, snapshot => { programs = snapshot.docs.map(item => item.data()); if (authReady) render(); })
        );
    } else {
        const profileSnapshot = await firestoreSdk.getDoc(firestoreSdk.doc(db, "users", signedInUser.uid));
        const studentId = profileSnapshot.data().studentId;
        const studentSnapshot = await firestoreSdk.getDoc(firestoreSdk.doc(db, "students", studentId));
        students = studentSnapshot.exists() ? [studentSnapshot.data()] : [];
        const tasksQuery = firestoreSdk.query(firestoreSdk.collection(db, "tasks"), firestoreSdk.where("studentId", "==", studentId));
        programs = (await firestoreSdk.getDocs(tasksQuery)).docs.map(snapshot => snapshot.data());
        firebaseUnsubscribers.push(firestoreSdk.onSnapshot(tasksQuery, snapshot => { programs = snapshot.docs.map(item => item.data()); if (authReady) render(); }));
    }
    localStorage.setItem("boztas-students", JSON.stringify(students));
    localStorage.setItem("boztas-programs", JSON.stringify(programs));
}

window.firebaseReady.then(async services => {
    firebaseServices = services;
    services.authSdk.onAuthStateChanged(services.auth, async user => {
        signedInUser = user;
        authReady = true;
        if (!user) { userRole = null; render(); return; }
        try {
            const profile = await services.firestoreSdk.getDoc(services.firestoreSdk.doc(services.db, "users", user.uid));
            if (!profile.exists() || !["coach", "student"].includes(profile.data().role)) throw new Error("role");
            userRole = profile.data().role;
            await loadFirebaseData();
            render();
        } catch (error) {
            authError = "Bu hesap için rol tanımı bulunamadı. Firebase'de users/{UID} belgesini kontrol edin.";
            await services.authSdk.signOut(services.auth);
        }
    });
}).catch(() => { authReady = true; authError = "Firebase bağlantısı kurulamadı."; render(); });

render();
