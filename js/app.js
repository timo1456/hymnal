if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js");
    });
}
window.addEventListener("load", () => {
    document.getElementById("splash-screen").classList.add("hide");
});
