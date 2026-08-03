function escapeHtml(value) {
    const element = document.createElement("div");
    element.textContent = value || "—";
    return element.innerHTML;
}

function studentsPage() {
    const rows = students.length === 0
        ? `<tr><td colspan="4" class="p-8 text-center text-slate-500">Henüz öğrenci eklenmedi. İlk öğrencinizi ekleyerek başlayın.</td></tr>`
        : students.map(student => `
            <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td class="p-4 font-medium text-slate-800">${escapeHtml(student.name)}</td>
                <td class="p-4 text-slate-600">${escapeHtml(student.class)}</td>
                <td class="p-4 text-slate-600">${escapeHtml(student.phone)}</td>
                <td class="p-4 text-right"><button data-create-account="${student.id}" class="${student.authUid ? "text-green-600" : "text-blue-600"} hover:text-blue-800 p-2" title="${student.authUid ? "Öğrenci hesabı bağlı" : "Öğrenci hesabı oluştur"}" aria-label="Öğrenci hesabı oluştur"><i class="fa-solid fa-${student.authUid ? "user-check" : "user-plus"}"></i></button><button data-delete-student="${student.id}" class="text-slate-400 hover:text-red-600 p-2" title="Öğrenciyi sil" aria-label="${escapeHtml(student.name)} adlı öğrenciyi sil"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`).join("");

    return `
        <div class="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div><h2 class="text-3xl md:text-4xl font-bold text-slate-900">Öğrenciler</h2><p class="text-slate-500 mt-2">Öğrenci listenizi buradan yönetin.</p></div>
            <button id="addStudentBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"><i class="fa-solid fa-plus mr-2"></i>Öğrenci ekle</button>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 mt-8 overflow-x-auto">
            <table class="w-full min-w-[560px]">
                <thead class="bg-slate-50 text-slate-500 text-sm"><tr><th class="text-left p-4 font-medium">Ad Soyad</th><th class="text-left p-4 font-medium">Sınıf</th><th class="text-left p-4 font-medium">Telefon</th><th class="p-4"><span class="sr-only">İşlemler</span></th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}
