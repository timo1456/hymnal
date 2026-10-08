(() => {
    const escapeHtml = (value) =>
        String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    async function renderHymn() {
        const content = document.getElementById("hymn-content");
        const favoriteToggle =
            document.getElementById("favorite-toggle");

        if (!content) {
            return;
        }

        try {
            await HymnalData.load();

            const id = new URLSearchParams(location.search).get("id");
            const hymn = HymnalData.getById(id);

            if (!hymn) {
                content.innerHTML =
                    '<div class="hymn-error">' +
                    "<h1>Hymn not found</h1>" +
                    "<p>The hymn you requested is not in this dataset.</p>" +
                    '<a class="back-link" href="./hymn-list.html">' +
                    "← Browse all hymns" +
                    "</a>" +
                    "</div>";

                return;
            }

            document.title = hymn.title + " · Hymnal";
            HymnalPrefs.recordOpen(hymn.number);
            window.dispatchEvent(new CustomEvent("hymnopen"));

            const sections = hymn.sections
                .map((section) => {
                    const label =
                        section.type === "chorus"
                            ? "Chorus"
                            : "Verse " + section.number;

                    const chorusClass =
                        section.type === "chorus"
                            ? " chorus"
                            : "";

                    return (
                        '<section class="hymn-section' +
                        chorusClass +
                        '">' +
                        '<div class="section-label">' +
                        label +
                        "</div>" +
                        '<p class="section-text">' +
                        escapeHtml(section.text) +
                        "</p>" +
                        "</section>"
                    );
                })
                .join("");

            content.innerHTML =
                '<header class="hymn-heading">' +
                '<div class="hymn-number">' +
                String(hymn.number).padStart(3, "0") +
                "</div>" +
                "<h1>" +
                escapeHtml(hymn.title) +
                "</h1>" +
                "</header>" +
                '<div class="hymn-sections">' +
                sections +
                "</div>" +
                '<footer class="hymn-footer">' +
                "<strong>Words: </strong>" +
                escapeHtml(hymn.author) +
                (hymn.composer
                    ? " · <strong>Music: </strong>" +
                      escapeHtml(hymn.composer)
                    : "") +
                "</footer>";

            if (favoriteToggle) {
                const updateFavoriteButton = () => {
                    const isFavorite =
                        HymnalPrefs.isFavorite(hymn.number);

                    favoriteToggle.classList.toggle(
                        "active",
                        isFavorite
                    );

                    favoriteToggle.innerHTML =
                        (isFavorite ? "★" : "☆") +
                        " <span>" +
                        (isFavorite ? "Saved" : "Favorite") +
                        "</span>";
                };

                favoriteToggle.addEventListener("click", () => {
                    HymnalPrefs.toggleFavorite(hymn.number);
                    updateFavoriteButton();
                });

                updateFavoriteButton();
            }
        } catch (error) {
            content.innerHTML =
                '<div class="hymn-error">' +
                "<h1>Unable to load hymn</h1>" +
                "<p>Please refresh the app and try again.</p>" +
                "</div>";

            console.error(error);
        }
    }

    document.addEventListener("DOMContentLoaded", renderHymn);
})();
