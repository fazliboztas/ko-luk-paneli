function studentModal(isOpen) {
    if (!isOpen) return "";

    return `
        <div class="fixed inset-0 z-50 bg-slate-950/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="studentModalTitle">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 md:p-8">
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h2 id="studentModalTitle" class="text-2xl font-bold text-slate-900">Yeni öğrenci</h2>
                        <p class="text-slate-500 text-sm mt-1">Öğrenci bilgilerini kaydedin.</p>
                    </div>
                    <button id="closeStudentModal" type="button" class="text-slate-400 hover:text-slate-700 text-2xl" aria-label="Pencereyi kapat">&times;</button>
                </div>

                <form id="studentForm">
                    <label class="form-label" for="studentName">Ad soyad</label>
                    <input id="studentName" name="name" class="form-input" placeholder="Örn. Elif Yılmaz" required autocomplete="name">

                    <label class="form-label" for="studentClass">Sınıf durumu</label>
                    <select id="studentClass" name="class" class="form-input" required>
                        <option value="" disabled selected>Seçiniz</option>
                        <option>9. sınıf</option><option>10. sınıf</option><option>11. sınıf</option><option>12. sınıf</option><option>Mezun</option>
                    </select>

                    <label class="form-label" for="studentPhone">Telefon</label>
                    <input id="studentPhone" name="phone" class="form-input" placeholder="05XX XXX XX XX" inputmode="tel" autocomplete="tel">

                    <div class="flex justify-end gap-3 mt-7">
                        <button id="cancelStudentModal" type="button" class="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">İptal</button>
                        <button type="submit" class="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function taskModal(isOpen, students, task) {
    if (!isOpen) return "";
    const student = students.find(item => item.id === selectedStudentId);
    return `
        <div class="fixed inset-0 z-50 bg-slate-950/50 p-4 flex items-center justify-center overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="taskModalTitle">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 md:p-8 my-auto">
                <div class="flex items-center justify-between mb-7"><div><h2 id="taskModalTitle" class="text-2xl font-bold text-slate-900">${task ? "Görevi düzenle" : "Görev oluştur"}</h2><p class="text-slate-500 text-sm mt-1">${escapeHtml(student?.name)} için haftalık programa eklenecek.</p></div><button id="closeTaskModal" type="button" class="text-slate-400 hover:text-slate-700 text-2xl" aria-label="Pencereyi kapat">&times;</button></div>
                <form id="taskForm">
                    <label class="form-label mt-0" for="taskDay">Planlanacak gün</label><select id="taskDay" name="day" class="form-input max-w-sm" required>${weekdayOrder.map(day => `<option ${task?.day === day ? "selected" : ""}>${day}</option>`).join("")}</select>
                    <p class="form-label">Ders seçin</p>
                    <div class="subject-grid">${["TYT Genel Deneme", "AYT Genel Deneme", "Matematik", "Geometri", "Türkçe", "Edebiyat", "Fizik", "Kimya", "Biyoloji", "Tarih", "Coğrafya", "Felsefe", "Din Kültürü", "İngilizce"].map((subject, index) => `<label class="choice-card subject-card"><input type="radio" name="subject" value="${subject}" ${task?.subject === subject || ((!task || !task.subject) && index === 0) ? "checked" : ""}><span>${subject}</span></label>`).join("")}</div>
                    <p class="form-label">Görev türü</p><div class="grid grid-cols-2 gap-2 sm:grid-cols-4">${["Konu", "Soru", "Tekrar", "Deneme"].map((type, index) => `<label class="choice-card"><input type="radio" name="taskType" value="${type}" ${task?.taskType === type || ((!task || !task.taskType) && index === 0) ? "checked" : ""}><span>${type}</span></label>`).join("")}</div>
                    <div class="grid gap-6 mt-7 md:grid-cols-[1fr_180px]"><div><label class="form-label mt-0" for="taskDescription">Açıklama</label><textarea id="taskDescription" name="description" class="form-input min-h-28 resize-y" placeholder="Örn. Problemler föyü 3 ve 4 çözülecek; yanlış sorular işaretlenecek." required>${escapeHtml(task?.description || task?.topic || "")}</textarea></div><div><label class="form-label mt-0" for="taskDuration">Süre (dakika)</label><input id="taskDuration" name="duration" type="number" min="1" max="1440" value="${escapeHtml(task?.duration || "")}" class="form-input" placeholder="Örn. 90" required inputmode="numeric"><p class="text-xs text-slate-500 mt-2">Tahmini çalışma süresi.</p></div></div>
                    <div class="grid gap-6 mt-6 md:grid-cols-2"><div id="taskQuestionGoalWrap"><label class="form-label mt-0" for="taskGoalQuestions">Hedef soru sayısı</label><input id="taskGoalQuestions" name="goalQuestions" type="number" min="1" class="form-input" value="${escapeHtml(task?.goalQuestions ?? "")}" placeholder="Örn. 80" inputmode="numeric"><p class="text-xs text-slate-500 mt-2">Soru, tekrar ve deneme görevleri için zorunludur.</p></div><div><label class="form-label mt-0" for="taskResourceUrl">Konu / video bağlantısı <span class="text-slate-400 font-normal">(isteğe bağlı)</span></label><input id="taskResourceUrl" name="resourceUrl" type="url" class="form-input" value="${escapeHtml(task?.resourceUrl || "")}" placeholder="https://..." inputmode="url"><p class="text-xs text-slate-500 mt-2">Öğrenci panelinde tek tıkla açılır.</p></div></div>
                    <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100"><button id="cancelTaskModal" type="button" class="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">İptal</button><button type="submit" class="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"><i class="fa-solid fa-check mr-2"></i>${task ? "Değişiklikleri kaydet" : "Ödevlendir"}</button></div>
                </form>
            </div>
        </div>`;
}

function resultModal(task) {
    if (!task) return "";
    const subjects = task.subject === "TYT Genel Deneme" ? ["Türkçe", "Sosyal", "Matematik", "Fizik", "Kimya", "Biyoloji"]
        : task.subject === "AYT Genel Deneme" ? ["Matematik", "Fizik", "Kimya", "Biyoloji"] : [task.subject];
    const scoreInputs = subjects.map(subject => `<div><label class="form-label mt-0" for="score-${subject}">${subject} neti</label><input id="score-${subject}" name="score-${subject}" type="number" step="0.25" class="form-input" required inputmode="decimal" placeholder="Örn. 25.50" value="${escapeHtml(task.result?.scores?.[subject] ?? "")}"></div>`).join("");
    const heading = task.subject === "TYT Genel Deneme" || task.subject === "AYT Genel Deneme" ? `${task.subject} sonuçları` : `${task.subject} branş denemesi`;
    return `<div class="fixed inset-0 z-[60] bg-slate-950/50 p-4 flex items-center justify-center overflow-y-auto" role="dialog" aria-modal="true"><div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 md:p-8 my-auto"><div class="flex items-center justify-between mb-7"><div><h2 class="text-2xl font-bold text-slate-900">${heading}</h2><p class="text-slate-500 text-sm mt-1">Netleri ve öğrencinin eksik notlarını kaydedin.</p></div><button id="closeResultModal" type="button" class="text-slate-400 hover:text-slate-700 text-2xl" aria-label="Pencereyi kapat">&times;</button></div><form id="resultForm"><div class="grid grid-cols-2 gap-4 sm:grid-cols-3">${scoreInputs}</div><label class="form-label" for="resultSolvedQuestions">Çözülen soru sayısı</label><input id="resultSolvedQuestions" name="solvedQuestions" type="number" min="0" class="form-input" required inputmode="numeric" value="${escapeHtml(task.solvedQuestions ?? task.goalQuestions ?? "")}" placeholder="Örn. 120"><label class="form-label" for="resultNote">Eksikler / öğrenci notu</label><textarea id="resultNote" name="note" class="form-input min-h-32 resize-y" placeholder="Eksik kalan konular, yanlışların nedeni ve öğrenci notu...">${escapeHtml(task.result?.note || "")}</textarea><div class="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100"><button id="cancelResultModal" type="button" class="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">İptal</button><button type="submit" class="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Sonuçları kaydet</button></div></form></div></div>`;
}

function accountModal(student) {
    if (!student) return "";
    return `<div class="fixed inset-0 z-[70] bg-slate-950/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true"><div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 md:p-8"><div class="flex items-center justify-between mb-6"><div><h2 class="text-2xl font-bold text-slate-900">Öğrenci hesabı oluştur</h2><p class="text-slate-500 text-sm mt-1">${escapeHtml(student.name)} kendi paneline bu bilgilerle giriş yapacak.</p></div><button id="closeAccountModal" type="button" class="text-slate-400 text-2xl" aria-label="Kapat">&times;</button></div><form id="accountForm"><label class="form-label" for="accountEmail">Öğrenci e-postası</label><input id="accountEmail" name="email" type="email" class="form-input" required autocomplete="email" value="${escapeHtml(student.email || "")}"><label class="form-label" for="accountPassword">Geçici şifre</label><input id="accountPassword" name="password" type="password" class="form-input" required minlength="6" autocomplete="new-password"><p class="text-xs text-slate-500 mt-2">En az 6 karakter olmalı. Bu şifreyi öğrenciyle güvenli şekilde paylaş.</p><div class="flex justify-end gap-3 mt-7"><button id="cancelAccountModal" type="button" class="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700">İptal</button><button type="submit" class="px-5 py-2.5 rounded-lg bg-blue-600 text-white">Hesabı oluştur</button></div></form></div></div>`;
}

function questionModal(task) {
    if (!task) return "";
    return `<div class="fixed inset-0 z-[70] bg-slate-950/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true"><div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8"><div class="flex items-center justify-between mb-6"><div><h2 class="text-2xl font-bold text-slate-900">Soru sayısını gir</h2><p class="text-slate-500 text-sm mt-1">${escapeHtml(task.subject)} · ${escapeHtml(task.description || "Soru görevi")}</p></div><button id="closeQuestionModal" type="button" class="text-slate-400 text-2xl">&times;</button></div><form id="questionForm"><label class="form-label mt-0" for="solvedQuestions">Çözülen soru sayısı</label><input id="solvedQuestions" name="solvedQuestions" type="number" min="0" class="form-input" required inputmode="numeric" placeholder="Örn. 80" value="${escapeHtml(task.solvedQuestions ?? "")}"><div class="flex justify-end gap-3 mt-7"><button id="cancelQuestionModal" type="button" class="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700">İptal</button><button type="submit" class="px-5 py-2.5 rounded-lg bg-blue-600 text-white">Tamamla</button></div></form></div></div>`;
}

function accountModal(student) {
    if (!student) return "";
    return `<div class="fixed inset-0 z-[70] bg-slate-950/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true"><div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 md:p-8"><div class="flex items-center justify-between mb-6"><div><h2 class="text-2xl font-bold text-slate-900">Öğrenci hesabı oluştur</h2><p class="text-slate-500 text-sm mt-1">${escapeHtml(student.name)} kendi paneline bu bilgilerle giriş yapacak.</p></div><button id="closeAccountModal" type="button" class="text-slate-400 text-2xl" aria-label="Kapat">&times;</button></div><form id="accountForm"><label class="form-label" for="accountEmail">Öğrenci e-postası</label><input id="accountEmail" name="email" type="email" class="form-input" required autocomplete="email" value="${escapeHtml(student.email || "")}"><label class="form-label" for="accountPassword">Geçici şifre</label><input id="accountPassword" name="password" type="password" class="form-input" required minlength="6" autocomplete="new-password"><p class="text-xs text-slate-500 mt-2">En az 6 karakter olmalı. Bu şifreyi öğrenciyle güvenli şekilde paylaş.</p><div class="flex justify-end gap-3 mt-7"><button id="cancelAccountModal" type="button" class="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700">İptal</button><button type="submit" class="px-5 py-2.5 rounded-lg bg-blue-600 text-white">Hesabı oluştur</button></div></form></div></div>`;
}

function questionModal(task) {
    if (!task) return "";
    return `<div class="fixed inset-0 z-[70] bg-slate-950/50 p-4 flex items-center justify-center" role="dialog" aria-modal="true"><div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 md:p-8"><div class="flex items-center justify-between mb-6"><div><h2 class="text-2xl font-bold text-slate-900">Soru sayısını gir</h2><p class="text-slate-500 text-sm mt-1">${escapeHtml(task.subject)} · ${escapeHtml(task.description || "Soru görevi")}</p></div><button id="closeQuestionModal" type="button" class="text-slate-400 text-2xl">&times;</button></div><form id="questionForm"><label class="form-label mt-0" for="solvedQuestions">Çözülen soru sayısı</label><input id="solvedQuestions" name="solvedQuestions" type="number" min="0" class="form-input" required inputmode="numeric" placeholder="Örn. 80" value="${escapeHtml(task.solvedQuestions ?? "")}"><div class="flex justify-end gap-3 mt-7"><button id="cancelQuestionModal" type="button" class="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700">İptal</button><button type="submit" class="px-5 py-2.5 rounded-lg bg-blue-600 text-white">Tamamla</button></div></form></div></div>`;
}
