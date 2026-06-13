// North suggestion box — theme toggle + Formspree AJAX submit.
// Lives on northfocus.app/suggest.html. Submissions are stored by Formspree and
// emailed to the form owner; the address never appears in this page's source.

document.getElementById("btn-theme").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("north-theme", next); } catch { /* private mode */ }
});

const form = document.getElementById("suggest-form");
const messageEl = document.getElementById("message");
const countEl = document.getElementById("count");
const submitBtn = document.getElementById("submit-btn");
const result = document.getElementById("result");
const thanks = document.getElementById("thanks");
const configWarn = document.getElementById("config-warn");

const formId = (window.FORMSPREE_ID || "").trim();
const configured = formId && formId !== "YOUR_FORM_ID";
if (!configured) configWarn.classList.remove("hidden");

// Arriving from the goodbye page preselects the "why i uninstalled" reason.
if (new URLSearchParams(location.search).get("from") === "uninstall") {
  document.getElementById("kind").value = "why i uninstalled";
}

const wordCount = s => s.trim().split(/\s+/).filter(Boolean).length;
messageEl.addEventListener("input", () => {
  const n = wordCount(messageEl.value);
  countEl.textContent = `${n} ${n === 1 ? "word" : "words"}`;
  countEl.classList.toggle("done", n >= 3);
  result.classList.add("hidden");
});

function showResult(text, kind) {
  result.textContent = text;
  result.className = `result ${kind}`;
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!messageEl.value.trim()) {
    showResult("write a line or two first, then send.", "err");
    messageEl.focus();
    return;
  }
  if (!configured) {
    showResult("this box isn't connected to a form yet. set FORMSPREE_ID in suggest.html.", "err");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "sending...";

  try {
    const res = await fetch(`https://formspree.io/f/${formId}`, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: new FormData(form)
    });
    if (res.ok) {
      form.classList.add("hidden");
      thanks.classList.remove("hidden");
    } else {
      const data = await res.json().catch(() => ({}));
      const msg = data?.errors?.map(x => x.message).join(", ");
      showResult(msg || "something went wrong sending that. try again in a moment?", "err");
    }
  } catch {
    showResult("couldn't reach the server. check your connection and try again.", "err");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "send it";
  }
});

document.getElementById("another").addEventListener("click", () => {
  form.reset();
  countEl.textContent = "0 words";
  countEl.classList.remove("done");
  result.classList.add("hidden");
  thanks.classList.add("hidden");
  form.classList.remove("hidden");
  messageEl.focus();
});
