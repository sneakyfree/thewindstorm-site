// The Windstorm — signup (async), reveal-on-scroll, nav, latest dispatch.
(function () {
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // nav hairline after scroll
  var nav = document.getElementById("nav");
  if (nav) {
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // reveal on scroll
  var revealed = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealed.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealed.forEach(function (el) { io.observe(el); });
  } else {
    revealed.forEach(function (el) { el.classList.add("in"); });
  }

  // latest dispatch card (graceful when none published yet)
  var card = document.getElementById("latestCard");
  if (card) {
    fetch("/api/latest", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.post) return;
        var p = d.post;
        var esc = function (s) { var t = document.createElement("i"); t.textContent = s || ""; return t.innerHTML; };
        var date = p.published_at ? new Date(p.published_at.replace(" ", "T") + "Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
        card.innerHTML =
          '<span class="lk">' + (p.type === "essay" ? "Essay" : "Latest dispatch") + "</span>" +
          '<h3><a href="/archive/' + esc(p.slug) + '">' + esc(p.subject) + "</a></h3>" +
          (p.preview ? '<p class="pv">' + esc(p.preview) + "</p>" : "") +
          '<div class="lc-meta">' + esc(date) + (p.episode_url ? " · 🎙 watch the episode" : "") + "</div>";
      })
      .catch(function () {});
  }

  // async signup with inline feedback
  var form = document.getElementById("join");
  if (!form) return;
  var note = document.getElementById("formNote");
  var btn = document.getElementById("submitBtn");
  var email = document.getElementById("email");
  var defaultNote = note ? note.textContent : "";

  function setNote(msg, cls) {
    if (!note) return;
    note.textContent = msg;
    note.className = "form-note" + (cls ? " " + cls : "");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var addr = (email.value || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(addr)) {
      setNote("That email doesn't look right — give it another try.", "err");
      email.focus();
      return;
    }
    btn.disabled = true;
    var label = btn.textContent;
    btn.textContent = "Stepping in…";
    setNote("One moment…", "");

    fetch(form.action, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    })
      .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
      .then(function (data) {
        if (data && data.ok) {
          form.reset();
          setNote(data.message || "You're in — check your inbox for a welcome note.", "ok");
          btn.textContent = "You're in the eye ✓";
        } else {
          setNote((data && data.message) || "Something hiccuped — try again in a moment.", "err");
          btn.disabled = false;
          btn.textContent = label;
        }
      })
      .catch(function () {
        setNote("Network hiccup — try again in a moment.", "err");
        btn.disabled = false;
        btn.textContent = label;
      });
  });

  email.addEventListener("input", function () {
    if (note && note.className.indexOf("err") !== -1) setNote(defaultNote, "");
  });
})();
