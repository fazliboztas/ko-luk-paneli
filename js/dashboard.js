function weeklyProgressForStudent(studentId) {
    const byWeek = new Map();
    programs.filter(task => task.studentId === studentId).forEach(task => {
        const week = task.weekStart || academicWeeks[0].key;
        const current = byWeek.get(week) || { week, questions: 0, minutes: 0 };
        current.questions += Number(task.solvedQuestions) || 0;
        current.minutes += Number(task.duration) || 0;
        byWeek.set(week, current);
    });
    return [...byWeek.values()].sort((first, second) => first.week.localeCompare(second.week)).slice(-10);
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
        const labels = weekly.map(item => item.week);
        const options = unit => ({ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: unit } } } });
        const questionsCanvas = document.getElementById(`dashboardQuestions-${index}`);
        const durationCanvas = document.getElementById(`dashboardDuration-${index}`);
        if (questionsCanvas) new Chart(questionsCanvas, { type: "line", data: { labels, datasets: [{ data: weekly.map(item => item.questions), borderColor: "#2563eb", backgroundColor: "rgb(37 99 235 / .12)", fill: true, tension: .35 }] }, options: options("Soru") });
        if (durationCanvas) new Chart(durationCanvas, { type: "bar", data: { labels, datasets: [{ data: weekly.map(item => Number((item.minutes / 60).toFixed(2))), backgroundColor: "#16a34a", borderRadius: 6 }] }, options: options("Saat") });
    });
}
