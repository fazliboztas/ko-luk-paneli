function dashboardPage() {
    const activePrograms = new Set(programs.map(program => program.studentId)).size;
    return `
    <h2 class="text-4xl font-bold">Dashboard</h2>

    <p class="text-gray-500 mt-2">
        Boztaş Koçluk Paneline Hoş Geldin
    </p>

    <div class="grid grid-cols-3 gap-6 mt-10">

        <div class="bg-white rounded-xl shadow p-6">
            <h3 class="text-gray-500">Toplam Öğrenci</h3>
            <p class="text-4xl font-bold mt-3">${students.length}</p>
        </div>

        <div class="bg-white rounded-xl shadow p-6">
            <h3 class="text-gray-500">Bugünkü Görüşme</h3>
            <p class="text-4xl font-bold mt-3">${activePrograms}</p>
        </div>

        <div class="bg-white rounded-xl shadow p-6">
            <h3 class="text-gray-500">Aktif Program</h3>
            <p class="text-4xl font-bold mt-3">0</p>
        </div>

    </div>
    `;
}
