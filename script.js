// North website — small enough to read in one sitting.
// The old page pulled in GSAP, ScrollTrigger and Lenis from a CDN to drive a
// pinned scroll showcase. That is three network dependencies and a scroll
// hijack for a page whose job is to explain a focus tool, so all of it is gone:
// reveals are an IntersectionObserver, and scrolling is the browser's.

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Nav: hairline appears once you leave the top ---------------------------
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// --- Mobile menu ------------------------------------------------------------
const toggle = document.getElementById("nav-toggle");
const links = document.getElementById("nav-links");

function setMenu(open) {
  links.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
toggle.addEventListener("click", () => setMenu(!links.classList.contains("open")));
// Tapping a link, pressing Escape, or growing past the breakpoint all close it.
links.addEventListener("click", e => { if (e.target.tagName === "A") setMenu(false); });
addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
matchMedia("(min-width: 861px)").addEventListener("change", e => { if (e.matches) setMenu(false); });

// --- Reveal on scroll -------------------------------------------------------
const revealables = document.querySelectorAll(".reveal");
if (reduceMotion || !("IntersectionObserver" in window)) {
  revealables.forEach(el => el.classList.add("in"));
} else {
  const io = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("in");
      obs.unobserve(entry.target);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  revealables.forEach(el => io.observe(el));
  // Anything already on screen at load shows immediately, so the hero never
  // waits for a scroll that may not come.
  requestAnimationFrame(() => {
    revealables.forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in");
    });
  });
}

// --- The block-page preview cycles through its real lines -------------------
const SHOT_LINES = [
  "Habit brought you here, not intention. That energy has somewhere better to go.",
  "You added this site to your blocklist for a reason. The reason hasn't changed; only the urge has.",
  "The feed was ready to spend your next forty minutes. North declined on your behalf.",
  "Nothing in that feed will matter tomorrow. The thing you're avoiding probably will."
];
const shotLine = document.getElementById("shot-line");
if (shotLine && !reduceMotion) {
  let i = 0;
  setInterval(() => {
    i = (i + 1) % SHOT_LINES.length;
    shotLine.style.opacity = "0";
    setTimeout(() => {
      shotLine.textContent = SHOT_LINES[i];
      shotLine.style.opacity = "1";
    }, 450);
  }, 6500);
}

// --- FAQ: one open at a time, so the list stays scannable -------------------
const faqs = [...document.querySelectorAll(".faq details")];
faqs.forEach(d => d.addEventListener("toggle", () => {
  if (d.open) faqs.forEach(other => { if (other !== d) other.open = false; });
}));
