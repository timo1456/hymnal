(()=>  {
    let deferredInstallPrompt = null;

    const STORAGE= {
        theme:"hymnal-theme",
        size:"hymnal-text-size",
        favorites:"hymnal-favorites",
        openCounts:"hymnal-open-counts"
    },
    root=document.documentElement;
    const getFavorites=()=> {
        try {
            return JSON.parse(localStorage.getItem(STORAGE.favorites)||"[]").map(Number)
        }
        catch {
            return[]
        }
    };
    window.HymnalPrefs= {
        getFavorites,
        isFavorite:id=>getFavorites().includes(Number(id)),
        toggleFavorite(id) {
            const n=Number(id),
            f=getFavorites(),
            next=f.includes(n)?f.filter(x=>x!==n):[n,
            ...f];
            if (!f.includes(n) && f.length >= 5) {
                return false;
            }
            localStorage.setItem(STORAGE.favorites,
            JSON.stringify([...new Set(next)].slice(0, 5)));
            window.dispatchEvent(new CustomEvent("favoriteschange"));
            return next.includes(n)
        },
        recordOpen(id) {
            const n = Number(id);
            if (!Number.isFinite(n)) return;
            try {
                const counts = JSON.parse(localStorage.getItem(STORAGE.openCounts) || "{}");
                counts[n] = (Number(counts[n]) || 0) + 1;
                localStorage.setItem(STORAGE.openCounts, JSON.stringify(counts));
            } catch {}
        },
        getOpenCounts() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE.openCounts) || "{}");
            } catch {
                return {};
            }
        }
    };
    function applyTheme(theme) {
        root.classList.toggle("dark",
        theme==="dark");
        localStorage.setItem(STORAGE.theme,
        theme);
        document.querySelectorAll("[data-theme-choice]").forEach(b=>b.classList.toggle("active",
        b.dataset.themeChoice===theme));
        const t=document.getElementById("theme-toggle");
        if(t) {
            t.textContent=theme==="dark"?"☀":"☾";
            t.setAttribute("aria-label",
            theme==="dark"?"Switch to light mode":"Switch to dark mode")
        }
    }
    function applySize(size) {
        const a=["small",
        "normal",
        "large",
        "xlarge"],
        s=a.includes(size)?size:"normal";
        root.classList.remove(...a.map(x=>"text-"+x));
        root.classList.add("text-"+s);
        localStorage.setItem(STORAGE.size,
        s);
        document.querySelectorAll("[data-size-choice]").forEach(b=>b.classList.toggle("active",
        b.dataset.sizeChoice===s))
    }
    function initSettings() {
        applyTheme(localStorage.getItem(STORAGE.theme)||"light");
        applySize(localStorage.getItem(STORAGE.size)||"normal");
        const modal=document.getElementById("settings-modal"),
        open=document.getElementById("settings-open");
        if(!modal||!open)return;
        const close=()=> {
            modal.hidden=true
        };
        open.addEventListener("click",
        ()=> {
            modal.hidden=false;
            modal.querySelector("[data-theme-choice]")?.focus()
        });
        modal.querySelectorAll("[data-close-settings]").forEach(x=>x.addEventListener("click",
        close));
        modal.querySelectorAll("[data-theme-choice]").forEach(b=>b.addEventListener("click",
        ()=>applyTheme(b.dataset.themeChoice)));
        modal.querySelectorAll("[data-size-choice]").forEach(b=>b.addEventListener("click",
        ()=>applySize(b.dataset.sizeChoice)));
        document.addEventListener("keydown",
        e=> {
            if(e.key==="Escape"&&!modal.hidden)close()
        })
    }
    function initInstallPrompt() {
        const actions=document.querySelector(".header-actions");
        if(!actions)return;
        const install=document.createElement("button");
        install.className="install-button";
        install.type="button";
        install.textContent="Install";
        install.setAttribute("aria-label","Install Hymnal app");
        install.hidden=true;
        const sync=()=>{
            const installed=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
            install.hidden=installed||!deferredInstallPrompt;
            if(installed)deferredInstallPrompt=null;
        };
        install.addEventListener("click",async()=>{
            if(!deferredInstallPrompt)return;
            const promptEvent=deferredInstallPrompt;
            promptEvent.prompt();
            await promptEvent.userChoice;
            deferredInstallPrompt=null;
            sync();
        });
        actions.prepend(install);
        window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();deferredInstallPrompt=event;sync()});
        window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;sync()});
        window.addEventListener("pageshow",sync);
        document.addEventListener("visibilitychange",()=>{if(!document.hidden)sync()});
        sync();
    }
    function initThemeToggle() {
        const b=document.getElementById("theme-toggle");
        if(b)b.addEventListener("click",
        ()=>applyTheme(root.classList.contains("dark")?"light":"dark"))
    }
    const escapeHtml=v=>String(v).replaceAll("&",
    "&amp;").replaceAll("<",
    "&lt;").replaceAll(">",
    "&gt;").replaceAll('"',
    "&quot;").replaceAll("'",
    "&#039;");
    const hymnLink=(h,
    c="")=> {
        const a=document.createElement("a");
        a.className=c;
        a.href="./hymn.html?id="+encodeURIComponent(h.number);
        return a
    };
    const resultMarkup=h=>'<span class="result-number">'+String(h.number).padStart(3,
    "0")+'</span><span class="result-copy"><strong>'+escapeHtml(h.title)+'</strong><small>'+escapeHtml(h.author)+'</small></span><span class="row-arrow" aria-hidden="true">→</span>';
    function initHome(hymns) {
        const feature=document.getElementById("hymn-of-day"),
        search=document.getElementById("home-search"),
        results=document.getElementById("home-search-results"),
        demos=document.getElementById("search-demos"),
        clear=document.getElementById("home-search-clear"),
        favorites=document.getElementById("favorites-preview"),
        count=document.getElementById("favorites-count");
        if(!feature||!search)return;
        const randomHymns = (items, amount) => [...items]
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(amount, items.length));

        const today = randomHymns(hymns, 1)[0];
        if (today) {
            const link = hymnLink(today, "featured-link");
            link.innerHTML =
                '<span class="hymn-number">' + String(today.number).padStart(3, "0") +
                '</span><span class="featured-copy"><small>Hymn of the Day</small><h2>' +
                escapeHtml(today.title) + '</h2><p>' + escapeHtml(today.firstLine) +
                '</p></span><span class="featured-arrow" aria-hidden="true">→</span>';
            feature.replaceChildren(link);
        }

        const suggestions = randomHymns(
            hymns.filter(h => !today || h.number !== today.number),
            5
        );
        demos.innerHTML = suggestions.map(h => {
            const link = hymnLink(h, "demo-hymn");
            link.innerHTML =
                '<span class="demo-number">' + String(h.number).padStart(3, "0") +
                '</span><span class="demo-copy"><strong>' + escapeHtml(h.title) +
                '</strong><small>' + escapeHtml(h.firstLine) +
                '</small></span><span class="row-arrow" aria-hidden="true">→</span>';
            return link.outerHTML;
        }).join("");
        function renderResults(q) {
            const matches=HymnalData.search(q).slice(0,
            6);
            results.innerHTML="";
            if(!q.trim()) {
                results.classList.remove("visible");
                demos.hidden=false;
                return
            }
            demos.hidden=true;
            results.classList.add("visible");
            if(!matches.length) {
                results.innerHTML='<div class="no-results">No hymns found for “'+escapeHtml(q)+'”.</div>';
                return
            }
            matches.forEach(h=> {
                const a=hymnLink(h,
                "result-link");
                a.innerHTML=resultMarkup(h);
                results.appendChild(a)
            })
        }
        search.addEventListener("input",
        ()=> {
            clear.hidden=!search.value;
            renderResults(search.value)
        });
        clear.addEventListener("click",
        ()=> {
            search.value="";
            clear.hidden=true;
            renderResults("");
            search.focus()
        });
        demos.querySelectorAll("[data-demo]").forEach(b=>b.addEventListener("click",
        ()=> {
            search.value=b.dataset.demo;
            clear.hidden=false;
            renderResults(search.value);
            search.focus()
        }));
        function renderFavorites() {
            const ids=HymnalPrefs.getFavorites(),
            saved=ids.map(id=>hymns.find(h=>h.number===id)).filter(Boolean).slice(0,
            5);
            count.textContent=ids.length ? ids.length + "/5 saved" : "";
            favorites.innerHTML="";
            if(!saved.length) {
                favorites.innerHTML='<div class="empty-favorites">No favorites yet. Tap ☆ on any hymn to save it here.</div>';
                return
            }
            saved.forEach(h=> {
                const a=hymnLink(h,
                "favorite-card");
                a.innerHTML='<span class="row-number">'+String(h.number).padStart(3,
                "0")+'</span><span class="row-copy"><strong>'+escapeHtml(h.title)+'</strong><small>'+escapeHtml(h.author)+'</small></span>';
                favorites.appendChild(a)
            })
        }
        renderFavorites();
        window.addEventListener("favoriteschange",
        renderFavorites);

        const common=document.getElementById("common-hymns");
        if (common) {
            const renderCommon=()=>{
                const counts=HymnalPrefs.getOpenCounts();
                const ranked=hymns
                    .filter(h=>Number(counts[h.number])>0)
                    .sort((a,b)=>(Number(counts[b.number])||0)-(Number(counts[a.number])||0));
                const selected=ranked.length ? ranked.slice(0,5) : randomHymns(hymns,5);
                const used=new Set(selected.map(h=>h.number));
                randomHymns(hymns.filter(h=>!used.has(h.number)),5-selected.length)
                    .forEach(h=>selected.push(h));
                common.innerHTML=selected.map(h=>{
                    const a=hymnLink(h,"common-hymn");
                    a.innerHTML='<span class="common-number">'+String(h.number).padStart(3,"0")+'</span><span class="common-title">'+escapeHtml(h.title)+'</span><span class="row-arrow" aria-hidden="true">→</span>';
                    return a.outerHTML;
                }).join("");
            };
            renderCommon();
            window.addEventListener("hymnopen", renderCommon);
        }
    }
    function initList(hymns) {
        const input=document.getElementById("list-search"),
        results=document.getElementById("hymn-list-results"),
        clear=document.getElementById("list-search-clear"),
        count=document.getElementById("list-count");
        if(!input||!results)return;
        function render() {
            const q=input.value.trim(),
            matches=HymnalData.search(q);
            count.textContent=q?matches.length+" result"+(matches.length===1?"":"s"):hymns.length+" hymns";
            results.innerHTML="";
            if(!matches.length) {
                results.innerHTML='<div class="no-results">No hymns found for “'+escapeHtml(q)+'”.</div>';
                return
            }
            matches.forEach(h=> {
                const a=hymnLink(h,
                "hymn-row");
                a.innerHTML='<span class="row-number">'+String(h.number).padStart(3,
                "0")+'</span><span class="row-copy"><strong>'+escapeHtml(h.title)+'</strong><small>'+escapeHtml(h.firstLine)+'</small></span><span class="row-arrow" aria-hidden="true">→</span>';
                results.appendChild(a)
            })
        }
        input.addEventListener("input",
        ()=> {
            clear.hidden=!input.value;
            render()
        });
        clear.addEventListener("click",
        ()=> {
            input.value="";
            clear.hidden=true;
            render();
            input.focus()
        });
        render()
    }
    async function boot() {
        initSettings();
        initThemeToggle();
        try {
            const hymns=await HymnalData.load();
            initHome(hymns);
            if(document.getElementById("hymn-list-results"))initList(hymns)
        }
        catch(e) {
            const app=document.getElementById("app")||document.body;
            app.innerHTML='<div class="no-results"><strong>Hymnal data could not be loaded.</strong><br>Please refresh once the app has been installed or cached.</div>';
            console.error(e)
        }
        initInstallPrompt();
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", async () => {
                try {
                    const registration = await navigator.serviceWorker.register("./sw.js", {
                        updateViaCache: "none"
                    });
                    await registration.update();
                } catch (error) {
                    console.error(error);
                }
            });
        }
        const splash=document.getElementById("splash-screen");
        if(splash) {
            const delay=window.matchMedia("(prefers-reduced-motion: reduce)").matches?500:3300;
            setTimeout(()=> {
                splash.classList.add("hide");
                setTimeout(()=>splash.remove(),
                850)
            },
            delay)
        }
    }
    document.addEventListener("DOMContentLoaded",
    boot);
})();
