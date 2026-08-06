function weeklyProgressForStudent(studentId) {
    const student = students.find(item => item.id === studentId);
    const studentTasks = programs.filter(task => task.studentId === studentId);
    const byWeek = new Map();
    studentTasks.forEach(task => {
        const week = task.weekStart || academicWeeks[0].key;
        const current = byWeek.get(week) || { week, questions: 0, minutes: 0 };
        if (task.completed) {
            current.questions += Number(task.solvedQuestions) || 0;
            current.minutes += Number(task.duration) || 0;
        }
        byWeek.set(week, current);
    });
    if (!studentTasks.length) return [];
    const taskWeeks = [...byWeek.keys()].sort();
    const startKey = student?.programStart || taskWeeks[0];
    const endKey = taskWeeks.at(-1);
    const [startYear, startMonth, startDay] = startKey.split("-").map(Number);
    const cursor = new Date(startYear, startMonth - 1, startDay);
    const progress = [];
    for (let index = 1; isoDate(cursor) <= endKey && index <= 100; index += 1) {
        const week = isoDate(cursor);
        progress.push({ label: `${index}. hafta`, ...(byWeek.get(week) || { week, questions: 0, minutes: 0 }) });
        cursor.setDate(cursor.getDate() + 7);
    }
    return progress;
}

function dashboardPage() {
    const activePrograms = new Set(programs.map(program => program.studentId)).size;
    const studentCards = students.map((student, index) => {
        const weekly = weeklyProgressForStudent(student.id);
        const latest = weekly.at(-1) || { questions: 0, minutes: 0 };
        return `<section class="dashboard-student-card">
            <div class="dashboard-student-heading"><div><h3>${escapeHtml(student.name)}</h3><p>${escapeHtml(student.class || "")}</p></div><div><b>${latest.questions}</b><span>son hafta soru</span></div><div><b>${formatStudyDuration(latest.minutes)}</b><span>son hafta süre</span></div></div>
            <div class="dashboard-student-charts"><div><h4>Haftalık soru çözümü</h4><canvas id="dashboardQuestions-${index}"></canvas></div><div><h4>Haftalık çalışma süresi</h4><canvas id="dashboardDuration-${index}"></canvas></div></div>
        </section>`;
    }).join("");
    return `<h2 class="text-4xl font-bold">Dashboard</h2>
        <p class="text-gray-500 mt-2">Tüm öğrencilerin haftalık gelişimini tek ekrandan takip edin.</p>
        <div class="grid gap-6 mt-10 md:grid-cols-3"><div class="bg-white rounded-xl shadow p-6"><h3 class="text-gray-500">Toplam Öğrenci</h3><p class="text-4xl font-bold mt-3">${students.length}</p></div><div class="bg-white rounded-xl shadow p-6"><h3 class="text-gray-500">Programı Olan Öğrenci</h3><p class="text-4xl font-bold mt-3">${activePrograms}</p></div><div class="bg-white rounded-xl shadow p-6"><h3 class="text-gray-500">Toplam Görev</h3><p class="text-4xl font-bold mt-3">${programs.length}</p></div></div>
        <div class="dashboard-progress-list">${studentCards || `<div class="analysis-empty"><p>Gelişimini görüntülemek için önce öğrenci ekleyin.</p></div>`}</div>`;
}

function renderDashboardCharts() {
    if (currentPage !== "dashboard" || !window.Chart) return;
    students.forEach((student, index) => {
        const weekly = weeklyProgressForStudent(student.id);
        const labels = weekly.map(item => item.label);
        const options = unit => ({ responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: "index" }, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: "Program haftası" } }, y: { beginAtZero: true, title: { display: true, text: unit } } } });
        const questionsCanvas = document.getElementById(`dashboardQuestions-${index}`);
        const durationCanvas = document.getElementById(`dashboardDuration-${index}`);
        if (questionsCanvas) new Chart(questionsCanvas, { type: "line", data: { labels, datasets: [{ label: "Çözülen soru", data: weekly.map(item => item.questions), borderColor: "#2563eb", backgroundColor: "rgb(37 99 235 / .12)", pointBackgroundColor: "#2563eb", pointRadius: 4, fill: true, tension: .3 }] }, options: options("Soru") });
        if (durationCanvas) new Chart(durationCanvas, { type: "line", data: { labels, datasets: [{ label: "Çalışma süresi", data: weekly.map(item => Number((item.minutes / 60).toFixed(2))), borderColor: "#16a34a", backgroundColor: "rgb(22 163 74 / .12)", pointBackgroundColor: "#16a34a", pointRadius: 4, fill: true, tension: .3 }] }, options: options("Saat") });
    });
}
