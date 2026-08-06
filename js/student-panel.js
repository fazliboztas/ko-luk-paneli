function studentTaskCard(task) {
    const resultTotal = task.result?.scores ? Object.values(task.result.scores).reduce((total, score) => total + (Number(score) || 0), 0) : null;
    return `<article class="student-task ${task.completed ? "student-task-done" : ""}">
        <div class="flex items-start justify-between gap-3"><div><span class="task-type-badge !ml-0">${escapeHtml(task.taskType || "Görev")}</span><h3 class="font-bold text-slate-800 mt-2">${escapeHtml(task.subject)}</h3></div><i class="fa-solid ${task.completed ? "fa-circle-check text-green-600" : "fa-circle text-slate-300"} text-xl"></i></div>
        <p class="text-slate-600 text-sm mt-3 leading-6">${escapeHtml(task.description || task.topic || "Açıklama yok")}</p>
        ${task.goalQuestions ? `<p class="text-xs font-semibold text-blue-700 mt-2"><i class="fa-solid fa-bullseye mr-1"></i>Hedef: ${task.goalQuestions} soru</p>` : ""}
        ${task.solvedQuestions !== undefined ? `<p class="text-xs font-semibold text-green-700 mt-2"><i class="fa-solid fa-book-open mr-1"></i>${task.solvedQuestions} soru çözüldü</p>` : ""}
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-100"><span class="text-xs text-slate-500"><i class="fa-regular fa-clock mr-1"></i>${task.duration ? `${escapeHtml(task.duration)} dk` : escapeHtml(task.goal || "—")}</span>${resultTotal !== null ? `<span class="font-bold text-green-700 text-sm">${resultTotal.toFixed(2)} net</span>` : ""}</div>
        ${taskResourceLink(task)}
        ${task.result?.note ? `<div class="student-note"><i class="fa-regular fa-note-sticky mr-1"></i>${escapeHtml(task.result.note)}</div>` : ""}
        <button data-complete-task="${task.id}" class="student-task-action ${task.completed ? "student-task-action-done" : ""}">${task.taskType === "Deneme" ? (task.completed ? "Sonucu düzenle" : "Deneme sonucunu gir") : (task.completed ? "Tamamlandı" : "Tamamla")}</button>
    </article>`;
}

function studentWeekColumn(day, dayTasks) {
    dayTasks.sort((first, second) => (Number(first.order) || 0) - (Number(second.order) || 0));
    const duration = dayTasks.reduce((total, task) => total + (Number(task.duration) || 0), 0);
    return `<section class="student-week-day"><header><div><h3>${day}</h3><small>${formatStudyDuration(duration)}</small></div><span>${dayTasks.length}</span></header><div class="student-day-tasks">${dayTasks.length ? dayTasks.map(studentTaskCard).join("") : `<p class="student-day-empty">Görev yok</p>`}</div></section>`;
}

function studentExamAnalysis(student) {
    const results = programs.filter(task => task.studentId === student.id && task.result?.scores);
    if (!results.length) return `<section class="mt-10"><h3 class="text-2xl font-bold text-slate-900">Deneme gelişimin</h3><div class="analysis-empty"><i class="fa-solid fa-chart-line text-3xl text-blue-500"></i><p>İlk deneme sonucunu girdiğinde net grafiklerin burada oluşacak.</p></div></section>`;
    return `<section class="mt-10"><h3 class="text-2xl font-bold text-slate-900">Deneme gelişimin</h3><p class="text-slate-500 mt-1">Ders ders ve toplam netlerinin zaman içindeki değişimini takip et.</p><div class="analysis-charts"><div class="analysis-chart"><h4>Toplam net gelişimin</h4><canvas id="studentTotalNetChart"></canvas></div><div class="analysis-chart"><h4>TYT net gelişimi</h4><canvas id="studentTytChart"></canvas></div><div class="analysis-chart"><h4>AYT net gelişimi</h4><canvas id="studentAytChart"></canvas></div><div class="analysis-chart"><h4>Branş denemesi netlerin</h4><canvas id="studentBranchChart"></canvas></div></div></section>`;
}

function renderStudentExamCharts() {
    if (typeof selectedStudentId === "undefined" || !window.Chart || !document.getElementById("studentTytChart")) return;
    const results = programs.filter(task => task.studentId === selectedStudentId && task.result?.scores);
    renderTotalNetChart("studentTotalNetChart", results.filter(task => ["TYT Genel Deneme", "AYT Genel Deneme"].includes(task.subject)));
    const drawStudentLine = (id, tasks, subjects) => {
        const canvas = document.getElementById(id);
        if (!canvas || !tasks.length) return;
        new Chart(canvas, { type: "line", data: { labels: tasks.map(task => `${task.weekStart || ""} ${task.day}`), datasets: chartDataset(tasks, subjects) }, options: { responsive: true, plugins: { legend: { position: "bottom" } }, scales: { y: { title: { display: true, text: "Net" } } } } });
    };
    drawStudentLine("studentTytChart", results.filter(task => task.subject === "TYT Genel Deneme"), ["Türkçe", "Sosyal", "Matematik", "Fizik", "Kimya", "Biyoloji"]);
    drawStudentLine("studentAytChart", results.filter(task => task.subject === "AYT Genel Deneme"), ["Matematik", "Fizik", "Kimya", "Biyoloji"]);
    const branchTasks = results.filter(task => !["TYT Genel Deneme", "AYT Genel Deneme"].includes(task.subject));
    const branchCanvas = document.getElementById("studentBranchChart");
    if (branchCanvas && branchTasks.length) new Chart(branchCanvas, { type: "bar", data: { labels: branchTasks.map(task => `${task.subject} · ${task.weekStart || ""}`), datasets: [{ label: "Net", data: branchTasks.map(task => Number(Object.values(task.result.scores)[0]) || 0), backgroundColor: "#2563eb", borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: "Net" } } } } });
}

function renderStudentWeeklyProgressChart() {
    const canvas = document.getElementById("studentWeeklyProgressChart");
    if (!canvas || !window.Chart) return;
    const weekly = weeklyProgressForStudent(selectedStudentId);
    new Chart(canvas, { type: "bar", data: { labels: weekly.map(item => item.week), datasets: [{ label: "Çözülen soru", data: weekly.map(item => item.questions), backgroundColor: "#2563eb", borderRadius: 5, yAxisID: "questions" }, { label: "Çalışma süresi (saat)", data: weekly.map(item => Number((item.minutes / 60).toFixed(2))), type: "line", borderColor: "#16a34a", backgroundColor: "#16a34a", tension: .35, yAxisID: "duration" }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } }, scales: { questions: { beginAtZero: true, position: "left", title: { display: true, text: "Soru" } }, duration: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Saat" } } } } });
}

function studentPanelPage() {
    if (students.length === 0) return `<div class="max-w-xl"><h2 class="text-3xl font-bold text-slate-900">Öğrenci paneli</h2><p class="text-slate-500 mt-2">Önizlemek için önce bir öğrenci eklemelisin.</p></div>`;
    if (!selectedStudentId || !students.some(student => student.id === selectedStudentId)) selectedStudentId = students[0].id;
    const student = students.find(item => item.id === selectedStudentId);
    visibleAcademicWeeks = buildAcademicWeeks(student.programStart || isoDate(new Date()));
    if (!visibleAcademicWeeks.some(week => week.key === selectedWeekStart)) selectedWeekStart = visibleAcademicWeeks[0].key;
    const week = visibleAcademicWeeks.find(item => item.key === selectedWeekStart);
    const weekIndex = visibleAcademicWeeks.findIndex(item => item.key === week.key);
    const tasks = programs.filter(task => task.studentId === student.id && (task.weekStart || academicWeeks[0].key) === week.key);
    const completed = tasks.filter(task => task.completed).length;
    const totalMinutes = tasks.reduce((total, task) => total + (Number(task.duration) || 0), 0);
    const solvedQuestions = tasks.reduce((total, task) => total + (Number(task.solvedQuestions) || 0), 0);
    const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    const allResults = programs.filter(task => task.studentId === student.id && task.result?.scores)
        .sort((first, second) => `${first.weekStart || ""}-${first.day}`.localeCompare(`${second.weekStart || ""}-${second.day}`));
    const averages = type => {
        const totals = allResults.filter(task => task.subject === type).map(task => Object.values(task.result.scores).reduce((sum, score) => sum + (Number(score) || 0), 0));
        return totals.length ? totals.reduce((sum, total) => sum + total, 0) / totals.length : 0;
    };
    const tytAverage = averages("TYT Genel Deneme");
    const aytAverage = averages("AYT Genel Deneme");
    const weekColumns = weekdayOrder.map(day => studentWeekColumn(day, tasks.filter(task => task.day === day))).join("");
    return `<div class="student-shell">
        <div class="student-hero"><div><p class="text-blue-200 font-medium">Boztaş Koçluk</p><h2>Selam, ${escapeHtml(student.name.split(" ")[0])} 👋</h2><p>Bu hafta planını tamamlayarak hedeflerine bir adım daha yaklaş.</p></div><div class="student-progress"><span>%${completionRate}</span><small>program tamamlandı</small></div></div>
        <div class="student-preview-bar"><label for="studentPreviewSelect">Önizlenen öğrenci</label><select id="studentPreviewSelect">${students.map(item => `<option value="${item.id}" ${item.id === student.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select><span>Bu seçim yalnızca koç önizlemesidir.</span></div>
        <div class="student-week-control"><button data-week-shift="-1" ${weekIndex === 0 ? "disabled" : ""}><i class="fa-solid fa-chevron-left"></i></button><div><strong>${week.label}</strong><span>${week.milestone || "Haftalık çalışma planın"}</span></div><button data-week-shift="1" ${weekIndex === visibleAcademicWeeks.length - 1 ? "disabled" : ""}><i class="fa-solid fa-chevron-right"></i></button></div>
        <div class="student-stats student-stats-six"><div><i class="fa-solid fa-list-check"></i><p>${tasks.length}</p><span>Toplam görev</span></div><div><i class="fa-solid fa-circle-check"></i><p>%${completionRate}</p><span>Program tamamlandı</span></div><div><i class="fa-solid fa-book-open"></i><p>${solvedQuestions}</p><span>Bu hafta çözülen soru</span></div><div><i class="fa-regular fa-clock"></i><p>${formatStudyDuration(totalMinutes)}</p><span>Bu hafta çalışma süresi</span></div><div><i class="fa-solid fa-chart-line"></i><p>${tytAverage.toFixed(2)}</p><span>TYT net ortalaması</span></div><div><i class="fa-solid fa-chart-line"></i><p>${aytAverage.toFixed(2)}</p><span>AYT net ortalaması</span></div></div>
        <section class="student-weekly-progress"><div><h3>Haftalık çalışma gelişimin</h3><p>Çözdüğün soru sayısını ve planlanan çalışma süreni haftalara göre karşılaştır.</p></div><div class="student-progress-chart"><canvas id="studentWeeklyProgressChart"></canvas></div></section>
        <div class="mt-10"><div><h3 class="text-2xl font-bold text-slate-900">Bu haftaki programın</h3><p class="text-slate-500 mt-1">Görevleri gün gün takip et; tamamladıkça işaretle, denemelerde netlerini gir.</p></div><div class="student-week-board mt-5">${weekColumns}</div></div>${studentExamAnalysis(student)}
    </div>`;
}
