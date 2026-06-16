// North website — scroll engine (GSAP + ScrollTrigger + Lenis, CDN).
// Animations are on by default for everyone; ?noanim forces the static
// version, which is also the fallback when the CDN is blocked.

const qs = new URLSearchParams(location.search);
const noAnim = qs.has("noanim");
const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
const animated = hasGsap && !noAnim;

if (!animated) document.documentElement.classList.add("no-anim");

// Theme (auto sunset/sunrise + the toggle) lives in theme.js, shared by every
// page.

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

  // --- Pinned feature stack: scroll scrubs through the scenes -------------

  const stack = document.getElementById("feature-stack");
  if (stack && matchMedia("(min-width: 821px)").matches) {
    stack.classList.add("gsap");
    const frames = gsap.utils.toArray(".stack-frame");
    const dots = [...stack.querySelectorAll(".stack-dots .dot")];

    const setScene = idx => {
      frames.forEach((f, i) => f.classList.toggle("visible", i === idx));
      dots.forEach((d, i) => d.classList.toggle("on", i === idx));
    };

    const popVars = { autoAlpha: 1, scale: 1, y: 0, duration: 0.16, ease: "power2.out" };
    const sceneTimelines = frames.map((frame, i) => {
      const q = gsap.utils.selector(frame);
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

      if (i === 0) {
        tl.set(q(".ph-feed"), { yPercent: 0 }, 0)
          .set(q(".ph-block"), { autoAlpha: 0, y: 36 }, 0)
          .to(q(".ph-feed"), { yPercent: -50, duration: 0.68 }, 0)
          .to(q(".ph-block"), { autoAlpha: 1, y: 0, duration: 0.24, ease: "power2.out" }, 0.54);
      }

      if (i === 1) {
        tl.set(q(".msg, .reelcard"), { autoAlpha: 0, scale: 0.75, y: 10 }, 0)
          .set(q(".reel-timer i"), { width: "100%" }, 0)
          .to(q(".m1"), popVars, 0.06)
          .to(q(".m2"), popVars, 0.2)
          .to(q(".m3"), popVars, 0.34)
          .to(q(".m4"), { autoAlpha: 1, scale: 1, y: 0, duration: 0.18, ease: "power2.out" }, 0.5)
          .to(q(".reel-timer i"), { width: "6%", duration: 0.42 }, 0.58);
      }

      if (i === 2) {
        tl.set(q(".ig-row, .ig-lock"), { autoAlpha: 0, scale: 0.82, y: 10 }, 0)
          .set(q(".ig-grid"), { filter: "grayscale(0) opacity(1)" }, 0)
          .to(q(".ig-row:nth-child(1)"), popVars, 0.08)
          .to(q(".ig-row:nth-child(2)"), popVars, 0.22)
          .to(q(".ig-row:nth-child(3)"), popVars, 0.36)
          .to(q(".ig-grid"), { filter: "grayscale(1) opacity(0.35)", duration: 0.24 }, 0.56)
          .to(q(".ig-lock"), popVars, 0.72);
      }

      if (i === 3) {
        tl.set(q(".yt-type"), { width: "0ch" }, 0)
          .set(q(".yt-tile.cut"), { autoAlpha: 1, filter: "grayscale(0)", scale: 1 }, 0)
          .to(q(".yt-type"), { width: "5ch", duration: 0.42 }, 0.08)
          .to(q(".yt-tile.cut"), { autoAlpha: 0.16, filter: "grayscale(1)", scale: 0.94, duration: 0.28, stagger: 0.04, ease: "power1.out" }, 0.58);
      }

      if (i === 4) {
        tl.set(q(".breath-ring.r1"), { scale: 0.88, autoAlpha: 0.58 }, 0)
          .set(q(".breath-ring.r2"), { scale: 1.05, autoAlpha: 0.7 }, 0)
          .set(q(".breath-dot"), { scale: 0.82 }, 0)
          .set(q(".wait-bar i"), { width: "0%" }, 0)
          .set(q(".focus-note, .journal"), { autoAlpha: 0, y: 10 }, 0)
          .to(q(".breath-ring.r1"), { scale: 1.08, autoAlpha: 1, duration: 0.32, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.04)
          .to(q(".breath-ring.r2"), { scale: 0.9, autoAlpha: 1, duration: 0.32, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.04)
          .to(q(".breath-dot"), { scale: 1.12, duration: 0.32, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.04)
          .to(q(".wait-bar i"), { width: "72%", duration: 0.76 }, 0.06)
          .to(q(".focus-note"), { autoAlpha: 1, y: 0, duration: 0.16, ease: "power2.out" }, 0.36)
          .to(q(".journal"), { autoAlpha: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.68);
      }

      tl.progress(0);
      return tl;
    });

    const updateSceneProgress = progress => {
      const raw = Math.min(frames.length - 0.001, Math.max(0, progress * frames.length));
      const idx = Math.min(frames.length - 1, Math.floor(raw));
      const local = idx === frames.length - 1 && progress >= 0.999 ? 1 : raw - idx;

      setScene(idx);
      sceneTimelines.forEach((timeline, i) => {
        if (i < idx) timeline.progress(1);
        else if (i > idx) timeline.progress(0);
        else timeline.progress(local);
      });
    };

    gsap.set(frames[0], { autoAlpha: 1, y: 0, scale: 1 });
    updateSceneProgress(0);

    // Timeline layout: each scene owns one equal scroll segment. Scroll movement
    // scrubs the frame transition and the vignette internals together, so fast
    // scrolling makes them move fast and slow scrolling lets the product
    // moments breathe.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: stack,
        start: "top 70px",
        end: "bottom bottom",
        scrub: 0.45,
        onUpdate: self => updateSceneProgress(self.progress)
      }
    });
    gsap.set(frames.slice(1), { autoAlpha: 0, y: 34, scale: 0.988 });
    frames.forEach((f, i) => {
      if (i === 0) return;
      tl.to(frames[i - 1], { autoAlpha: 0, y: -34, scale: 0.988, duration: 0.22, ease: "power1.out" }, i)
        .fromTo(f, { autoAlpha: 0, y: 34, scale: 0.988 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: "power1.out" }, i);
    });
    tl.to({}, { duration: 1 }, frames.length - 1); // the last scene gets a full segment too

    // Clicking a dot jumps to the start of that scene segment; scrolling after
    // that controls the product vignette itself.
    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        const st = tl.scrollTrigger;
        const y = st.start + (i / frames.length) * (st.end - st.start);
        if (lenis) lenis.scrollTo(y, { duration: 0.7 });
        else window.scrollTo({ top: y, behavior: "smooth" });
      });
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

  for (const sel of ["#more-grid .more", "#why-grid .why-card", "#who-grid .who-card"]) {
    const items = gsap.utils.toArray(sel);
    if (!items.length) continue;
    gsap.from(items, {
      opacity: 0,
      duration: 0.55,
      ease: "power2.out",
      stagger: 0.06,
      clearProps: "opacity",
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
    const dots = [...stack.querySelectorAll(".stack-dots .dot")];
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
