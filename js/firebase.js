window.firebaseReady = Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
]).then(async ([appSdk, authSdk, firestoreSdk]) => {
    const firebaseConfig = {
        apiKey: "AIzaSyAO86YiwT3um9Ro-GROFdJ0FQKgLJjgnCs",
        authDomain: "boztas-kocluk-1d073.firebaseapp.com",
        projectId: "boztas-kocluk-1d073",
        storageBucket: "boztas-kocluk-1d073.firebasestorage.app",
        messagingSenderId: "899085208945",
        appId: "1:899085208945:web:e52b999cf9616deaaffad0"
    };
    const app = appSdk.initializeApp(firebaseConfig);
    // İkinci Auth örneği, koçun oturumunu kapatmadan öğrenci hesabı oluşturmamızı sağlar.
    const studentProvisioningApp = appSdk.initializeApp(firebaseConfig, "student-provisioning");
    const auth = authSdk.getAuth(app);
    // Tarayıcı kapatılıp açılsa veya sayfa yenilense de koç oturumu korunur.
    try {
        await authSdk.setPersistence(auth, authSdk.browserLocalPersistence);
    } catch (error) {
        console.warn("Kalıcı oturum etkinleştirilemedi:", error);
    }
    return { auth, studentAuth: authSdk.getAuth(studentProvisioningApp), db: firestoreSdk.getFirestore(app), authSdk, firestoreSdk };
});
