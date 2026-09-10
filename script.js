// North — scroll engine.
//
// The page used to pull GSAP, ScrollTrigger and Lenis off a CDN. This does the
// three things the page actually needs in a fraction of that: reveal elements
// as they arrive, expose scroll progress through an element as a CSS variable,
// and drive one pinned sequence. Everything else is CSS.
//
// Progress is published as custom properties (--p, --seq) rather than inline
// styles, so the animation itself stays in the stylesheet where it belongs.

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ nav --- */
const nav = document.getElementById("nav");
const links = document.getElementById("nav-links");
const navToggle = document.getElementById("nav-toggle");

addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 8), { passive: true });

function setMenu(open) {
  links.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
navToggle.addEventListener("click", () => setMenu(!links.classList.contains("open")));
links.addEventListener("click", e => { if (e.target.tagName === "A") setMenu(false); });
addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
matchMedia("(min-width: 900px)").addEventListener("change", e => e.matches && setMenu(false));

/* --------------------------------------------------------------- reveal --- */
const revealables = [...document.querySelectorAll("[data-reveal]")];
if (REDUCED || !("IntersectionObserver" in window)) {
  revealables.forEach(el => el.classList.add("in"));
} else {
  const io = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      // Stagger children of a group rather than every element individually, so
      // a row arrives as a row instead of a queue.
      const kids = e.target.querySelectorAll("[data-stagger] > *");
      if (kids.length) kids.forEach((k, i) => k.style.setProperty("--i", i));
      e.target.classList.add("in");
      obs.unobserve(e.target);
    }
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  revealables.forEach(el => io.observe(el));
  requestAnimationFrame(() => {
    revealables.forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight * 0.9) el.classList.add("in");
    });
  });
}

/* -------------------------------------------------------------- progress ---
   One rAF loop, one layout read per element per frame, only while the element
   is anywhere near the viewport. */
const tracked = [...document.querySelectorAll("[data-progress]")].map(el => ({
  el,
  prop: el.dataset.progress || "--p",
  // How far through the viewport the element travels before it counts as done.
  from: parseFloat(el.dataset.from ?? "0"),
  to: parseFloat(el.dataset.to ?? "1")
}));

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
let ticking = false;

function frame() {
  ticking = false;
  const vh = innerHeight;
  for (const t of tracked) {
    const r = t.el.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) continue;
    // 0 when the element's top reaches the bottom of the viewport,
    // 1 when its bottom reaches the top.
    const span = r.height + vh;
    const raw = (vh - r.top) / span;
    const p = clamp((raw - t.from) / (t.to - t.from));
    t.el.style.setProperty(t.prop, p.toFixed(4));
  }
  updateSequence();
}
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(frame);
}

/* -------------------------------------------------------------- sequence ---
   The pinned unlock section: a tall track with a sticky stage inside it. Scroll
   position through the track picks which of the three steps is on stage, and
   drives the timer ring inside step one. */
const seq = document.querySelector("[data-sequence]");
const steps = seq ? [...seq.querySelectorAll("[data-step]")] : [];
const panels = seq ? [...seq.querySelectorAll("[data-panel]")] : [];
const ringCount = document.getElementById("ring-count");
let lastIndex = -1;

function updateSequence() {
  if (!seq) return;
  const track = seq.querySelector(".seq-track");
  const r = track.getBoundingClientRect();
  const travel = r.height - innerHeight;
  const p = clamp(-r.top / (travel || 1));
  seq.style.setProperty("--seq", p.toFixed(4));

  const n = steps.length;
  // Bias slightly so each step holds the stage for its full share.
  const index = Math.min(n - 1, Math.floor(p * n * 0.999));
  if (index !== lastIndex) {
    lastIndex = index;
    steps.forEach((s, i) => s.classList.toggle("is-on", i === index));
    panels.forEach((s, i) => s.classList.toggle("is-on", i === index));
    seq.dataset.active = index;
  }
  // Progress within the current step fills the ring and runs the countdown.
  const within = clamp(p * n - index);
  seq.style.setProperty("--step-p", within.toFixed(4));
  if (ringCount && index === 0) ringCount.textContent = Math.max(0, Math.round(60 * (1 - within)));
}

if (!REDUCED && (tracked.length || seq)) {
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  frame();
} else if (seq) {
  // Static fallback: show the sequence as three plain stacked steps.
  seq.classList.add("no-pin");
  steps.forEach(s => s.classList.add("is-on"));
  panels.forEach(s => s.classList.add("is-on"));
}

/* ---------------------------------------------------------------- counts --- */
if (!REDUCED) {
  const nums = document.querySelectorAll("[data-count]");
  const io = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      obs.unobserve(e.target);
      const target = parseFloat(e.target.dataset.count);
      const started = performance.now();
      const tick = now => {
        const t = clamp((now - started) / 900);
        // easeOutExpo, so it lands rather than crawls
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        e.target.textContent = Math.round(target * eased);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  nums.forEach(n => io.observe(n));
}

/* ------------------------------------------------------------ block lines --- */
const LINES = [
  "Habit brought you here, not intention. That energy has somewhere better to go.",
  "You added this site to your blocklist for a reason. The reason hasn't changed; only the urge has.",
  "The feed was ready to spend your next forty minutes. North declined on your behalf.",
  "Nothing in that feed will matter tomorrow. The thing you're avoiding probably will."
];
const line = document.getElementById("shot-line");
if (line && !REDUCED) {
  let i = 0;
  setInterval(() => {
    i = (i + 1) % LINES.length;
    line.style.opacity = "0";
    setTimeout(() => { line.textContent = LINES[i]; line.style.opacity = "1"; }, 420);
  }, 6000);
}

/* ------------------------------------------------------------------- faq --- */
const faqs = [...document.querySelectorAll(".faq details")];
faqs.forEach(d => d.addEventListener("toggle", () => {
  if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
}));
