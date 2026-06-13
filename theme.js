// North website theme.
// "auto" is the default: light by day, dark after sunset, read from the
// visitor's own local clock (so it follows their timezone with no location
// permission and no tracking). Clicking the toggle pins an explicit light/dark
// choice that overrides auto from then on.
//
// These hours are a deliberate approximation of sunset/sunrise. True
// astronomical times would need the visitor's latitude (a geolocation prompt),
// which the no-tracking brand avoids. Tweak DUSK/DAWN to taste.
(function () {
  var KEY = "north-theme";
  var DUSK = 19; // 7pm and later counts as night
  var DAWN = 7;  // before 7am counts as night

  function pinned() {
    var v = localStorage.getItem(KEY);
    return v === "light" || v === "dark";
  }
  function nightNow() {
    var h = new Date().getHours();
    return h >= DUSK || h < DAWN;
  }
  function applyAuto() {
    if (pinned()) return;
    document.documentElement.dataset.theme = nightNow() ? "dark" : "light";
  }

  // The inline head script already painted the right theme; re-apply here and
  // keep it in sync if the page is left open across sunrise or sunset.
  applyAuto();
  setInterval(applyAuto, 60 * 1000);

  var btn = document.getElementById("btn-theme");
  if (btn) {
    btn.addEventListener("click", function () {
      var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) { /* private mode */ }
    });
  }
})();
