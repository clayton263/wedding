/* ---------- Envelope opening animation (scroll-driven) ---------- */
const sequence = document.getElementById("invitation");
const envelope = document.getElementById("scrollEnvelope");
const flap = document.querySelector(".scroll-flap");
const seal = document.querySelector(".scroll-seal");
const peek = document.querySelector(".scroll-peek");

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function updateOpening() {
  if (!sequence || !envelope) return;

  const rect = sequence.getBoundingClientRect();
  const total = Math.max(sequence.offsetHeight - window.innerHeight, 1);
  const progress = clamp(-rect.top / total, 0, 1);

  // 0 -> .5   flap swings open
  // 0 -> .25  wax seal fades away
  // .3 -> .85 the letter rises up out of the envelope
  // .85 -> 1  whole envelope fades, handing off to the letter section below
  const flapProgress = clamp(progress / 0.5, 0, 1);
  const sealProgress = clamp(progress / 0.25, 0, 1);
  const peekProgress = clamp((progress - 0.3) / 0.55, 0, 1);
  const fadeProgress = clamp((progress - 0.85) / 0.15, 0, 1);

  flap.style.transform = `rotateX(${180 * flapProgress}deg)`;
  seal.style.opacity = `${1 - sealProgress}`;
  peek.style.transform = `translateY(${55 - 50 * peekProgress}%)`;
  envelope.style.opacity = `${1 - fadeProgress}`;
}

window.addEventListener("scroll", updateOpening, { passive: true });
window.addEventListener("resize", updateOpening);
updateOpening();

/* ---------- Letter reveal once scrolled into view ---------- */
const letterPaper = document.querySelector(".letter-section .paper");
if (letterPaper && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          letterPaper.classList.add("in-view");
          observer.unobserve(letterPaper);
        }
      });
    },
    { threshold: 0.25 }
  );
  observer.observe(letterPaper);
} else if (letterPaper) {
  letterPaper.classList.add("in-view");
}

/* ---------- RSVP form ---------- */
const form = document.getElementById("rsvpForm");
const success = document.getElementById("success");
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzSRxbNvXxbl3MUfhd0PbTtw9EyGxfAoR5WRKKM-wbm699WiY6rO6J4Dp0ky3NJ3-louw/exec";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const diets = [...form.querySelectorAll('input[name="diet"]:checked')].map((x) => x.value);

  const payload = {
    timestamp: new Date().toISOString(),
    name: data.get("name"),
    attending: data.get("attending"),
    dietary: diets.join(", ") || "None specified",
    notes: data.get("notes") || ""
  };

  if (!GOOGLE_SCRIPT_URL) {
    console.log("RSVP:", payload);
    form.hidden = true;
    success.hidden = false;
    return;
  }

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    form.hidden = true;
    success.hidden = false;
  } catch (err) {
    alert("There was a problem sending your RSVP. Please try again.");
  }
});
