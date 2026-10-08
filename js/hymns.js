const HymnalData = (() => {
    let hymns = [];

    const normalize = (value) =>
        String(value ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const flattenSections = (sections) =>
        sections
            .map(
                (section) =>
                    section.type +
                    " " +
                    (section.number ?? "") +
                    " " +
                    section.text
            )
            .join(" ");

    const prepare = (hymn) => ({
        ...hymn,
        _search: normalize(
            [
                hymn.number,
                hymn.title,
                hymn.firstLine,
                hymn.author,
                hymn.composer,
                hymn.tune,
                flattenSections(hymn.sections || [])
            ].join(" ")
        )
    });

    async function load() {
        if (hymns.length) {
            return hymns;
        }

        const response = await fetch("./data/hymns.json", {
            cache: "no-cache"
        });

        if (!response.ok) {
            throw new Error("Unable to load hymn data.");
        }

        hymns = (await response.json()).map(prepare);

        return hymns;
    }

    function search(query) {
        const term = normalize(query);

        if (!term) {
            return hymns;
        }

        const exactNumber = Number.parseInt(term, 10);

        return hymns
            .map((hymn) => {
                const title = normalize(hymn.title);
                const author = normalize(hymn.author);
                const composer = normalize(hymn.composer);
                const firstLine = normalize(hymn.firstLine);
                const words = normalize(
                    flattenSections(hymn.sections || [])
                );

                let score = 0;

                if (
                    String(hymn.number) === term ||
                    (!Number.isNaN(exactNumber) &&
                        Number(hymn.number) === exactNumber)
                ) {
                    score += 100;
                }

                if (title === term) score += 90;
                if (title.startsWith(term)) score += 70;
                if (firstLine.startsWith(term)) score += 60;
                if (author.startsWith(term)) score += 50;
                if (composer.startsWith(term)) score += 45;
                if (title.includes(term)) score += 35;
                if (firstLine.includes(term)) score += 30;
                if (author.includes(term)) score += 25;
                if (composer.includes(term)) score += 20;
                if (words.includes(term)) score += 15;
                if (hymn._search.includes(term)) score += 5;

                return {
                    hymn,
                    score
                };
            })
            .filter((result) => result.score > 0)
            .sort(
                (a, b) =>
                    b.score - a.score ||
                    a.hymn.number - b.hymn.number
            )
            .map((result) => result.hymn);
    }

    function getById(id) {
        const number = Number.parseInt(id, 10);
        return hymns.find((hymn) => hymn.number === number);
    }

    function getHymnOfDay() {
        if (!hymns.length) {
            return null;
        }

        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const day = Math.floor((now - start) / 86400000);

        return hymns[day % hymns.length];
    }

    return {
        load,
        search,
        getById,
        getHymnOfDay
    };
})();
