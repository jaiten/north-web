// North website: reveals, Nori the scroll companion, smooth FAQ, demo

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Reveal on scroll ---

const observer = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      observer.unobserve(e.target);
    }
  }
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// --- Nav: deeper shadow once you leave the top ---

const nav = document.getElementById("nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 10), { passive: true });

// --- Theme toggle ---

document.getElementById("btn-theme").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("north-theme", next); } catch { /* private mode */ }
});

// --- Eyes follow the cursor (hero orb, companion orb, vignette orbs) ---

if (!reducedMotion) {
  let eyeRaf = null;
  addEventListener("mousemove", e => {
    if (eyeRaf) return;
    eyeRaf = requestAnimationFrame(() => {
      eyeRaf = null;
      document.querySelectorAll(".eyes").forEach(eyes => {
        const r = eyes.getBoundingClientRect();
        if (!r.width || r.top > innerHeight || r.bottom < 0) return;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const reach = Math.min(2.4, d / 60);
        eyes.style.setProperty("--px", (dx / d) * reach + "px");
        eyes.style.setProperty("--py", (dy / d) * reach + "px");
      });
    });
  }, { passive: true });
}

// --- Nori, the scroll companion ---

const nori = document.getElementById("nori");
const noriBubble = document.getElementById("nori-bubble");
const noriOrb = document.getElementById("nori-orb");

const NORI_QUIPS = [
  "You found my button.",
  "I'd wave, but I'm a sphere.",
  "North is up. I checked.",
  "Imagine me on every blocked tab. Cozy, right?",
  "Scroll on. I'll keep up."
];
let quipIdx = 0;

function noriSay(text) {
  if (!text || noriBubble.textContent === text) return;
  noriBubble.textContent = text;
  noriBubble.classList.remove("pop");
  void noriBubble.offsetWidth; // restart the pop animation
  noriBubble.classList.add("pop");
}

if (nori && !reducedMotion) {
  // Appears once you're past the hero, steps aside before the footer.
  addEventListener("scroll", () => {
    const past = scrollY > innerHeight * 0.6;
    const nearEnd = scrollY + innerHeight > document.body.scrollHeight - 120;
    nori.classList.toggle("here", past && !nearEnd);
  }, { passive: true });

  // Speaks about whatever section you're looking at.
  const sectionWatch = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) noriSay(e.target.dataset.nori);
    }
  }, { rootMargin: "-35% 0px -45% 0px" });
  document.querySelectorAll("[data-nori]").forEach(s => sectionWatch.observe(s));

  noriOrb.addEventListener("click", () => {
    noriSay(NORI_QUIPS[quipIdx++ % NORI_QUIPS.length]);
  });
}

// --- Hero mock: gentle parallax + rotating buddy lines ---

const heroMock = document.getElementById("hero-mock");
if (heroMock && !reducedMotion) {
  addEventListener("scroll", () => {
    if (scrollY < innerHeight) heroMock.style.transform = `translateY(${scrollY * 0.06}px)`;
  }, { passive: true });
}

const MOCK_LINES = [
  "Habit brought you here, not intention. Let's point that energy somewhere real.",
  "The algorithm wanted your next 40 minutes. I said no for you.",
  "Past you doesn't trust this moment, and past you was right.",
  "Nothing in that feed will matter tomorrow. The thing you're avoiding probably will."
];
let mockIdx = 0;
const mockLine = document.getElementById("mock-line");
if (mockLine) {
  setInterval(() => {
    mockIdx = (mockIdx + 1) % MOCK_LINES.length;
    mockLine.style.opacity = "0";
    setTimeout(() => {
      mockLine.textContent = MOCK_LINES[mockIdx];
      mockLine.style.opacity = "1";
    }, 500);
  }, 6000);
}

// --- FAQ: smooth open and close ---

document.querySelectorAll(".faq-list details").forEach(d => {
  const body = d.querySelector(".faq-body");
  d.querySelector("summary").addEventListener("click", e => {
    e.preventDefault();
    if (reducedMotion) { d.open = !d.open; return; }
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

// --- Interactive challenge demo ---

const demoInput = document.getElementById("demo-input");
const demoPhrase = document.getElementById("demo-phrase");
const demoResult = document.getElementById("demo-result");

if (demoInput) {
  // The real thing blocks pasting too.
  demoInput.addEventListener("paste", e => {
    e.preventDefault();
    showResult("Nice try. The real thing blocks pasting too. You have to type it.");
  });
  demoInput.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const ok = demoInput.value.trim() === demoPhrase.textContent.trim();
    if (ok) {
      showResult("That took about twenty seconds of honesty. Now imagine doing it every single time you reach for the feed. That's North.");
      demoInput.value = "";
    } else {
      showResult("Not quite. It has to match word for word. Annoying? Exactly.");
    }
  });
}

function showResult(text) {
  demoResult.textContent = text;
  demoResult.classList.remove("hidden");
}
