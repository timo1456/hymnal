if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js");
    });
}

window.addEventListener("load", () => {
    const splash = document.getElementById("splash-screen");

    if (!splash) return;

    // Let the animation play before revealing the main app.
    setTimeout(() => {
        splash.classList.add("hide");

        // Remove it from the page after the fade-out.
        setTimeout(() => {
            splash.remove();
        }, 850);
    }, 3300);
});