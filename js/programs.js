const weekdayOrder = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const academicMilestones = {
    "2026-11-16": "1. dönem ara tatili",
    "2027-01-25": "Yarıyıl tatili",
    "2027-02-01": "Yarıyıl tatili",
    "2027-03-08": "2. dönem ara tatili"
};

function isoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(date) {
    return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(date);
}

function buildAcademicWeeks(startKey = "2026-09-14") {
    const [year, month, day] = startKey.split("-").map(Number);
    const start = new Date(year, month - 1, day);
    const end = new Date(2027, 5, 25);
    const weeks = [];
    for (let weekStart = new Date(start), index = 1; weekStart <= end; weekStart.setDate(weekStart.getDate() + 7), index += 1) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const key = isoDate(weekStart);
        weeks.push({ key, index, label: `${index}. hafta · ${formatDate(weekStart)} – ${formatDate(weekEnd)}`, milestone: academicMilestones[key] || "" });
    }
    return weeks;
}

const academicWeeks = buildAcademicWeeks();
let visibleAcademicWeeks = academicWeeks;

function formatStudyDuration(minutes) {
    const total = Number(minutes) || 0;
    if (!total) return "0 dk";
    const hours = Math.floor(total / 60);
    const remainder = total % 60;
    return [hours ? `${hours} saat` : "", remainder ? `${remainder} dakika` : ""].filter(Boolean).join(" ");
}

function taskResourceLink(task) {
    if (!task.resourceUrl || task.resourceUrl.trim() === "-") return "";
    try {
        const url = new URL(task.resourceUrl);
        if (!['http:', 'https:'].includes(url.protocol)) return "";
        return `<a class="task-resource-link" href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-play mr-1"></i>Konu videosunu aç</a>`;
    } catch {
        return "";
    }
}

function taskCard(task) {
    const description = task.description || task.topic || "Açıklama yok";
    const duration = task.duration ? `${escapeHtml(task.duration)} dk` : escapeHtml(task.goal || "—");
    const netTotal = task.result?.scores ? Object.values(task.result.scores).reduce((sum, score) => sum + (Number(score) || 0), 0) : null;
    return `<article class="task-card ${task.completed ? "completed-task" : ""}" draggable="true" data-task-card="${task.id}"><div class="flex items-start justify-between gap-2"><span class="task-type-badge !ml-0">${escapeHtml(task.taskType || "Görev")}</span><i class="fa-solid fa-grip-vertical text-slate-300 mt-1"></i></div><h4 class="font-bold text-slate-800 mt-2">${escapeHtml(task.subject)}</h4><p class="text-sm text-slate-600 mt-1 leading-5">${escapeHtml(description)}</p>${task.goalQuestions ? `<p class="text-xs font-semibold text-blue-700 mt-2"><i class="fa-solid fa-bullseye mr-1"></i>Hedef: ${task.goalQuestions} soru</p>` : ""}<p class="text-xs text-slate-500 mt-3"><i class="fa-regular fa-clock mr-1"></i>${duration}</p>${taskResourceLink(task)}${netTotal !== null ? `<p class="result-total">Toplam net: ${netTotal.toFixed(2)}</p>` : ""}<div class="task-actions"><button data-complete-task="${task.id}" title="${task.taskType === "Deneme" ? "Sonuç gir" : "Tamamlandı"}" class="${task.completed ? "done-task" : ""}"><i class="fa-solid fa-${task.completed ? "check" : "circle-check"}"></i></button><button data-copy-task="${task.id}" title="Görevi kopyala"><i class="fa-regular fa-copy"></i></button><button data-edit-task="${task.id}" title="Görevi düzenle"><i class="fa-solid fa-pen"></i></button><button data-delete-task="${task.id}" title="Görevi sil" class="delete-task"><i class="fa-solid fa-trash"></i></button></div></article>`;
}

function examAnalysis(student) {
    const results = programs.filter(task => task.studentId === student.id && task.result?.scores)
        .sort((first, second) => `${first.weekStart || ""}-${first.day}`.localeCompare(`${second.weekStart || ""}-${second.day}`));
    if (!results.length) return `<section class="exam-analysis mt-10"><div><h3 class="text-2xl font-bold text-slate-900">Deneme analizi</h3><p class="text-slate-500 mt-1">Öğrenci deneme sonuçlarını girdiğinde ders ders netler ve grafikler burada oluşacak.</p></div><div class="analysis-empty"><i class="fa-solid fa-chart-line text-3xl text-blue-500"></i><p>Henüz kaydedilmiş deneme sonucu yok.</p></div></section>`;
    const scoreSummary = results.map(task => `<tr><td class="p-4 font-medium">${escapeHtml(task.subject)}</td><td class="p-4 text-slate-600">${escapeHtml(task.weekStart || "—")} · ${escapeHtml(task.day)}</td><td class="p-4">${Object.entries(task.result.scores).map(([subject, score]) => `<span class="score-chip">${escapeHtml(subject)}: <b>${escapeHtml(score)}</b></span>`).join("")}</td><td class="p-4 text-slate-600">${escapeHtml(task.result.note || "—")}</td></tr>`).join("");
    return `<section class="exam-analysis mt-10"><div><h3 class="text-2xl font-bold text-slate-900">Deneme analizi</h3><p class="text-slate-500 mt-1">${escapeHtml(student.name)} için ders bazlı net gelişimi.</p></div><div class="analysis-charts"><div class="analysis-chart"><h4>Toplam net gelişimi</h4><canvas id="totalNetChart"></canvas></div><div class="analysis-chart"><h4>TYT genel deneme netleri</h4><canvas id="tytNetChart"></canvas></div><div class="analysis-chart"><h4>AYT genel deneme netleri</h4><canvas id="aytNetChart"></canvas></div><div class="analysis-chart"><h4>Branş denemesi netleri</h4><canvas id="branchNetChart"></canvas></div></div><div class="bg-white rounded-xl border border-slate-200 mt-6 overflow-x-auto"><table class="w-full min-w-[750px]"><thead class="bg-slate-50 text-slate-500 text-sm"><tr><th class="text-left p-4">Deneme</th><th class="text-left p-4">Hafta / Gün</th><th class="text-left p-4">Ders ders net</th><th class="text-left p-4">Eksikler / Not</th></tr></thead><tbody>${scoreSummary}</tbody></table></div></section>`;
}

function chartDataset(tasks, subjects) {
    return subjects.map((subject, index) => ({
        label: subject,
        data: tasks.map(task => Number(task.result.scores[subject]) || 0),
        borderColor: ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#db2777", "#0891b2"][index],
        backgroundColor: ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#db2777", "#0891b2"][index],
        tension: .35,
        spanGaps: true
    }));
}

function renderLineChart(id, tasks, subjects) {
    const canvas = document.getElementById(id);
    if (!canvas || !window.Chart || !tasks.length) return;
    new Chart(canvas, { type: "line", data: { labels: tasks.map(task => `${task.weekStart || ""} ${task.day}`), datasets: chartDataset(tasks, subjects) }, options: { responsive: true, plugins: { legend: { position: "bottom" } }, scales: { y: { title: { display: true, text: "Net" } } } } });
}

function renderTotalNetChart(id, results) {
    const canvas = document.getElementById(id);
    if (!canvas || !window.Chart || !results.length) return;
    const totals = task => Object.values(task.result.scores).reduce((sum, score) => sum + (Number(score) || 0), 0);
    new Chart(canvas, { type: "line", data: { labels: results.map(task => `${task.subject.replace(" Genel Deneme", "")} · ${task.weekStart || ""}`), datasets: [{ label: "TYT toplam net", data: results.map(task => task.subject === "TYT Genel Deneme" ? totals(task) : null), borderColor: "#2563eb", backgroundColor: "#2563eb", tension: .35, spanGaps: true }, { label: "AYT toplam net", data: results.map(task => task.subject === "AYT Genel Deneme" ? totals(task) : null), borderColor: "#9333ea", backgroundColor: "#9333ea", tension: .35, spanGaps: true }] }, options: { responsive: true, plugins: { legend: { position: "bottom" } }, scales: { y: { title: { display: true, text: "Toplam net" } } } } });
}

function renderExamCharts() {
    if (typeof selectedStudentId === "undefined" || !window.Chart) return;
    const results = programs.filter(task => task.studentId === selectedStudentId && task.result?.scores);
    renderTotalNetChart("totalNetChart", results.filter(task => ["TYT Genel Deneme", "AYT Genel Deneme"].includes(task.subject)));
    renderLineChart("tytNetChart", results.filter(task => task.subject === "TYT Genel Deneme"), ["Türkçe", "Sosyal", "Matematik", "Fizik", "Kimya", "Biyoloji"]);
    renderLineChart("aytNetChart", results.filter(task => task.subject === "AYT Genel Deneme"), ["Matematik", "Fizik", "Kimya", "Biyoloji"]);
    const branchTasks = results.filter(task => !["TYT Genel Deneme", "AYT Genel Deneme"].includes(task.subject));
    renderLineChart("branchNetChart", branchTasks, ["Net"]);
    const branchCanvas = document.getElementById("branchNetChart");
    if (branchCanvas && window.Chart && branchTasks.length) {
        Chart.getChart(branchCanvas)?.destroy();
        new Chart(branchCanvas, { type: "bar", data: { labels: branchTasks.map(task => `${task.subject} · ${task.weekStart || ""}`), datasets: [{ label: "Net", data: branchTasks.map(task => Number(Object.values(task.result.scores)[0]) || 0), backgroundColor: "#2563eb", borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: "Net" } } } } });
    }
}

function programsPage() {
    if (students.length === 0) return `<div class="max-w-xl"><h2 class="text-3xl md:text-4xl font-bold text-slate-900">Programlar</h2><div class="mt-8 bg-white border border-slate-200 rounded-xl p-8 text-center"><i class="fa-solid fa-user-graduate text-4xl text-blue-600"></i><h3 class="font-bold text-xl mt-4">Önce öğrenci ekleyin</h3><p class="text-slate-500 mt-2">Program oluşturmak için öğrenci listesinde en az bir öğrenci olmalı.</p><button data-page="students" class="mt-5 px-5 py-3 bg-blue-600 text-white rounded-lg">Öğrencilere git</button></div></div>`;
    if (!selectedStudentId || !students.some(student => student.id === selectedStudentId)) selectedStudentId = students[0].id;
    const selectedStudent = students.find(student => student.id === selectedStudentId);
    // İlk programın yazıldığı tarih, bu öğrenci için 1. haftanın başlangıcıdır.
    visibleAcademicWeeks = buildAcademicWeeks(selectedStudent.programStart || isoDate(new Date()));
    if (!visibleAcademicWeeks.some(week => week.key === selectedWeekStart)) selectedWeekStart = visibleAcademicWeeks[0].key;
    const selectedWeek = visibleAcademicWeeks.find(week => week.key === selectedWeekStart);
    const weekIndex = visibleAcademicWeeks.findIndex(week => week.key === selectedWeek.key);
    const tasks = programs.filter(program => program.studentId === selectedStudentId && (program.weekStart || academicWeeks[0].key) === selectedWeek.key);
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const solvedQuestions = tasks.reduce((total, task) => total + (Number(task.solvedQuestions) || 0), 0);
    const columns = weekdayOrder.map(day => { const dayTasks = tasks.filter(task => task.day === day).sort((first, second) => (Number(first.order) || 0) - (Number(second.order) || 0)); const duration = dayTasks.reduce((total, task) => total + (Number(task.duration) || 0), 0); return `<section class="week-day"><header><div><h3>${day}</h3><small>${formatStudyDuration(duration)}</small></div><span>${dayTasks.length}</span></header><div class="day-dropzone" data-day-dropzone="${day}">${dayTasks.map(taskCard).join("")}<p class="drop-hint">Sıralamak veya taşımak için sürükle</p></div></section>`; }).join("");
    return `<div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h2 class="text-3xl md:text-4xl font-bold text-slate-900">Haftalık program</h2><p class="text-slate-500 mt-2">İlk programın yazıldığı hafta, 1. hafta kabul edilir.</p></div><button id="addTaskBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"><i class="fa-solid fa-plus mr-2"></i>Görev ekle</button></div><div class="mt-8 grid gap-5 lg:grid-cols-[minmax(0,400px)_1fr]"><div><label for="programStudentSelect" class="form-label mt-0">Öğrenci</label><select id="programStudentSelect" class="form-input">${students.map(student => `<option value="${student.id}" ${student.id === selectedStudentId ? "selected" : ""}>${escapeHtml(student.name)} · ${escapeHtml(student.class)}</option>`).join("")}</select></div><div><p class="form-label mt-0">Program haftası</p><div class="week-picker"><button data-week-shift="-1" ${weekIndex === 0 ? "disabled" : ""} aria-label="Önceki hafta"><i class="fa-solid fa-chevron-left"></i></button><select id="weekSelect" class="form-input">${visibleAcademicWeeks.map(week => `<option value="${week.key}" ${week.key === selectedWeek.key ? "selected" : ""}>${week.label}${week.milestone ? ` · ${week.milestone}` : ""}</option>`).join("")}</select><button data-week-shift="1" ${weekIndex === visibleAcademicWeeks.length - 1 ? "disabled" : ""} aria-label="Sonraki hafta"><i class="fa-solid fa-chevron-right"></i></button></div></div></div><div class="${selectedWeek.milestone ? "holiday-banner" : "bg-blue-50 border border-blue-100"} rounded-xl p-5 mt-6"><p class="font-semibold ${selectedWeek.milestone ? "text-amber-950" : "text-blue-950"}">${selectedWeek.label}</p><p class="text-sm mt-1 ${selectedWeek.milestone ? "text-amber-700" : "text-blue-700"}">${selectedWeek.milestone ? `Takvim notu: ${selectedWeek.milestone}.` : `${escapeHtml(selectedStudent.name)} · ${completionRate}% tamamlanma · ${solvedQuestions} çözülen soru.`}</p></div><div class="week-board mt-6">${columns}</div>${examAnalysis(selectedStudent)}`;
}
