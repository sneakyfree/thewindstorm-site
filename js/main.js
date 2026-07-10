// The Windstorm — set year + progressive-enhancement signup (async, inline feedback).
(function () {
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  var form = document.getElementById("signup");
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
    btn.textContent = "Joining…";
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
          btn.textContent = "You're in ✓";
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

  // clear an error state as soon as they start fixing it
  email.addEventListener("input", function () {
    if (note && note.className.indexOf("err") !== -1) setNote(defaultNote, "");
  });
})();
