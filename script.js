// North website — scroll engine (GSAP + ScrollTrigger + Lenis, CDN).
// Animations are on by default for everyone; ?noanim forces the static
// version, which is also the fallback when the CDN is blocked.

const qs = new URLSearchParams(location.search);
const noAnim = qs.has("noanim");
const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
const animated = hasGsap && !noAnim;

if (!animated) document.documentElement.classList.add("no-anim");

// ---------------------------------------------------------------------------
// Theme toggle
// ---------------------------------------------------------------------------

document.getElementById("btn-theme").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("north-theme", next); } catch { /* private mode */ }
});

// ---------------------------------------------------------------------------
// Nav: deeper shadow once you leave the top
// ---------------------------------------------------------------------------

const nav = document.getElementById("nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 10), { passive: true });

// ---------------------------------------------------------------------------
// Smooth scroll + scroll-driven scenes
// ---------------------------------------------------------------------------

let lenis = null;

if (animated) {
  gsap.registerPlugin(ScrollTrigger);

  // Lenis smooths the wheel; ScrollTrigger reads from it.
  if (typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.12 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis; // console access for debugging
  }

  // In-page anchors ride the smooth scroll.
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // --- Hero entrance: the headline arrives word by word -------------------

  const title = document.getElementById("hero-title");
  if (title) {
    // Wrap each word in a span, preserving the gradient span's words.
    const wrapWords = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement("span");
            w.className = "w";
            w.textContent = part;
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          // background-clip:text breaks if its words become inline-blocks, so
          // the gradient phrase animates as a single unit.
          if (child.classList.contains("grad-text")) child.classList.add("w");
          else wrapWords(child);
        }
      });
    };
    wrapWords(title);

    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from("#hero-title .w", { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.045 }, 0.05)
      .from("[data-hero]", { y: 24, opacity: 0, duration: 0.8, stagger: 0.12 }, 0.4)
      .from("#hero-mock", { y: 60, opacity: 0, duration: 1, ease: "power2.out" }, 0.5)
      .from(".float-chip", { scale: 0.6, opacity: 0, duration: 0.6, ease: "back.out(2)", stagger: 0.15 }, 1.0);

    // Gentle parallax: the mock drifts as the hero scrolls away.
    gsap.to("#hero-mock", {
      y: 90,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 }
    });
  }

  // --- The problem: words light up as you scroll --------------------------

  const problem = document.getElementById("problem-text");
  if (problem) {
    const words = problem.textContent.split(/\s+/).filter(Boolean);
    problem.innerHTML = words.map(w => `<span class="pw">${w}</span>`).join(" ");
    gsap.to("#problem-text .pw", {
      opacity: 1,
      stagger: 0.06,
      ease: "none",
      scrollTrigger: { trigger: "#problem", start: "top 78%", end: "bottom 45%", scrub: 0.4 }
    });
  }

  // --- Pinned feature stack: scroll scrubs through and locks onto scenes --

  const stack = document.getElementById("feature-stack");
  if (stack && matchMedia("(min-width: 821px)").matches) {
    stack.classList.add("gsap");
    const frames = gsap.utils.toArray(".stack-frame");
    const dots = [...stack.querySelectorAll(".stack-dots i")];

    const setScene = idx => {
      frames.forEach((f, i) => f.classList.toggle("visible", i === idx));
      dots.forEach((d, i) => d.classList.toggle("on", i === idx));
    };

    gsap.set(frames[0], { autoAlpha: 1, y: 0, scale: 1 });
    setScene(0);

    // Timeline layout: scene i is stable from i+0.55 to i+1 (scene 0 from 0).
    // The snap points below make the wheel "lock on" to whichever scene
    // you're closest to instead of resting mid-transition.
    const TAIL = 0.6;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: stack,
        start: "top 70px",
        end: "bottom bottom",
        scrub: 0.45,
        onUpdate: self => setScene(Math.min(frames.length - 1, Math.floor(self.progress * frames.length)))
      }
    });
    frames.forEach((f, i) => {
      if (i === 0) return;
      tl.to(frames[i - 1], { autoAlpha: 0, y: -46, scale: 0.985, duration: 0.45 }, i)
        .fromTo(f, { autoAlpha: 0, y: 46, scale: 0.985 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45 }, i + 0.1);
    });
    tl.to({}, { duration: TAIL }); // the last scene gets a full segment too

    // Lock-on: snap scroll to the stable point of the nearest scene.
    const dur = tl.duration();
    const snapPoints = frames.map((_, i) => (i === 0 ? 0 : Math.min(1, (i + 0.55) / dur)));
    snapPoints.push(1);
    ScrollTrigger.create({
      trigger: stack,
      start: "top 70px",
      end: "bottom bottom",
      snap: { snapTo: snapPoints, duration: { min: 0.25, max: 0.7 }, delay: 0.08, ease: "power2.inOut" }
    });
  } else if (stack) {
    // Small screens: frames flow normally and play their vignette on arrival.
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.35 });
    stack.querySelectorAll(".stack-frame").forEach(f => io.observe(f));
  }

  // --- Reveals and staggered grids -----------------------------------------

  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    once: true,
    onEnter: batch => batch.forEach(el => el.classList.add("visible"))
  });

  for (const sel of ["#more-grid .more", "#why-grid .why-card", "#steps .step", "#who-grid .who-card"]) {
    const items = gsap.utils.toArray(sel);
    if (!items.length) continue;
    gsap.from(items, {
      y: 36,
      opacity: 0,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.09,
      scrollTrigger: { trigger: items[0].parentElement, start: "top 82%", once: true }
    });
  }
} else {
  // ------------------------- Fallback path --------------------------------

  const observer = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

  // Sticky stack driven by plain scroll math.
  const stack = document.getElementById("feature-stack");
  if (stack) {
    const frames = [...stack.querySelectorAll(".stack-frame")];
    const dots = [...stack.querySelectorAll(".stack-dots i")];
    if (matchMedia("(min-width: 821px)").matches && !noAnim) {
      let cur = -1;
      const update = () => {
        const r = stack.getBoundingClientRect();
        const total = r.height - innerHeight;
        if (total <= 0) return;
        const p = Math.min(0.999, Math.max(0, -r.top / total));
        const idx = Math.floor(p * frames.length);
        if (idx === cur) return;
        cur = idx;
        frames.forEach((f, i) => {
          f.classList.toggle("active", i === idx);
          f.classList.toggle("passed", i < idx);
          f.classList.toggle("visible", i === idx);
        });
        dots.forEach((d, i) => d.classList.toggle("on", i === idx));
      };
      update();
      addEventListener("scroll", update, { passive: true });
      addEventListener("resize", () => { cur = -1; update(); }, { passive: true });
    } else {
      frames.forEach(f => observer.observe(f));
    }
  }
}

// ---------------------------------------------------------------------------
// Hero mock: rotating block-page lines
// ---------------------------------------------------------------------------

const MOCK_LINES = [
  "habit brought you here, not intention. let's point that energy somewhere real.",
  "the algorithm wanted your next 40 minutes. North said no for you.",
  "past you doesn't trust this moment, and past you was right.",
  "nothing in that feed will matter tomorrow. the thing you're avoiding probably will."
];
let mockIdx = 0;
const mockLine = document.getElementById("mock-line");
if (mockLine && !noAnim) {
  setInterval(() => {
    mockIdx = (mockIdx + 1) % MOCK_LINES.length;
    mockLine.style.opacity = "0";
    setTimeout(() => {
      mockLine.textContent = MOCK_LINES[mockIdx];
      mockLine.style.opacity = "1";
    }, 500);
  }, 6000);
}

// ---------------------------------------------------------------------------
// FAQ: smooth open and close
// ---------------------------------------------------------------------------

document.querySelectorAll(".faq-list details").forEach(d => {
  const body = d.querySelector(".faq-body");
  d.querySelector("summary").addEventListener("click", e => {
    e.preventDefault();
    if (noAnim) { d.open = !d.open; return; }
    if (d.dataset.busy) return;
    d.dataset.busy = "1";
    if (d.open) {
      const a = body.animate(
        [{ height: body.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
        { duration: 260, easing: "cubic-bezier(0.4, 0, 0.2, 1)" }
      );
      a.onfinish = () => { d.open = false; delete d.dataset.busy; };
    } else {
      d.open = true;
      const a = body.animate(
        [{ height: "0px", opacity: 0 }, { height: body.offsetHeight + "px", opacity: 1 }],
        { duration: 320, easing: "cubic-bezier(0.3, 0.8, 0.3, 1)" }
      );
      a.onfinish = () => { delete d.dataset.busy; };
    }
  });
});

// ---------------------------------------------------------------------------
// Interactive demo: the unlock journal, exactly like the real thing
// ---------------------------------------------------------------------------

const demoInput = document.getElementById("demo-input");
const demoCount = document.getElementById("demo-count");
const demoBtn = document.getElementById("demo-btn");
const demoResult = document.getElementById("demo-result");
const MIN_WORDS = 20;

// Same bar the extension sets: enough words, mostly distinct, not key mash.
function demoWords(note) {
  return String(note || "").toLowerCase().split(/\s+/).filter(w => /[a-z]/i.test(w));
}
function demoNoteOk(note) {
  const words = demoWords(note);
  if (words.length < MIN_WORDS) return false;
  if (new Set(words).size < MIN_WORDS / 2) return false;
  const withVowels = words.filter(w => /[aeiouy]/i.test(w)).length;
  return withVowels >= words.length * 0.7;
}

function showResult(text) {
  demoResult.textContent = text;
  demoResult.classList.remove("hidden");
}

if (demoInput) {
  demoInput.addEventListener("input", () => {
    demoResult.classList.add("hidden");
    const ok = demoNoteOk(demoInput.value);
    const n = demoWords(demoInput.value).length;
    demoCount.textContent = ok ? `${n} words ✓`
      : n >= MIN_WORDS ? `${n} words, make them real ones`
      : `${n} / ${MIN_WORDS} words`;
    demoCount.classList.toggle("done", ok);
    demoBtn.classList.toggle("ready", ok);
  });

  // The real thing blocks pasting too.
  demoInput.addEventListener("paste", e => {
    e.preventDefault();
    showResult("nice try. the real thing blocks pasting too. you have to mean it.");
  });

  demoBtn.addEventListener("click", () => {
    if (demoNoteOk(demoInput.value)) {
      showResult("that took maybe forty seconds of honesty. now imagine paying that price every single time you reach for the feed. that's North.");
      demoInput.value = "";
      demoCount.textContent = `0 / ${MIN_WORDS} words`;
      demoCount.classList.remove("done");
      demoBtn.classList.remove("ready");
    } else {
      const n = demoWords(demoInput.value).length;
      showResult(n < MIN_WORDS
        ? `that's ${n} word${n === 1 ? "" : "s"}. the deal is ${MIN_WORDS} honest ones. keep going.`
        : "that doesn't read like a real reason yet. write it like you'd explain it to a friend.");
    }
  });
}
