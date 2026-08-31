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
  // .3 -> 1   the letter rises up out of the envelope
  const flapProgress = clamp(progress / 0.5, 0, 1);
  const sealProgress = clamp(progress / 0.25, 0, 1);
  const peekProgress = clamp((progress - 0.3) / 0.7, 0, 1);

  flap.style.transform = `rotateX(${180 * flapProgress}deg)`;
  seal.style.opacity = `${1 - sealProgress}`;
  // At rest (0%) the peek sits fully inside the envelope's own box, so the
  // higher z-index envelope body hides it completely — nothing pokes out
  // underneath while the envelope is closed. As progress rises it lifts up
  // and out through the now-open flap.
  peek.style.transform = `translateY(${-42 * peekProgress}%)`;
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

/* ---------- RSVP form: repeatable guests ---------- */
const form = document.getElementById("rsvpForm");
const success = document.getElementById("success");
const guestsContainer = document.getElementById("guestsContainer");
const guestTemplate = document.getElementById("guestTemplate");
const addGuestBtn = document.getElementById("addGuestBtn");
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyrzlK7i2MNdY3ddudDYY8Q1hd4ot2HQPTFuFcZ5a0Sn9EJq-bP6seLwBgWxOlWJwFA/exec";

let guestCount = 0;

function renumberGuests() {
  const cards = guestsContainer.querySelectorAll(".guest-card");
  cards.forEach((card, i) => {
    card.querySelector(".guest-number").textContent = `Invitation confirmation ${i + 1}`;
  });
}

function wireGuestCard(card) {
  const radios = card.querySelectorAll(".guest-attending");
  const extra = card.querySelector(".guest-extra");
  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      const checked = card.querySelector(".guest-attending:checked");
      const attending = checked ? checked.value.startsWith("Yes") : false;
      extra.classList.toggle("is-hidden", !attending);
    });
  });

  // Allergy / dietary logic:
  //  - ticking "None" clears any real requirement and hides the extra info box
  //  - ticking any actual requirement unticks "None" and reveals the extra info box
  const dietBoxes = card.querySelectorAll(".guest-diet");
  const noneBox = card.querySelector('.guest-diet[value="None"]');
  dietBoxes.forEach((box) => {
    box.addEventListener("change", () => {
      if (box.value === "None" && box.checked) {
        dietBoxes.forEach((other) => { if (other !== box) other.checked = false; });
      } else if (box.checked) {
        noneBox.checked = false;
      }
      updateDietNotes(card);
    });
  });
}

function updateDietNotes(card) {
  const wrap = card.querySelector(".diet-notes");
  const notes = card.querySelector(".guest-diet-notes");
  const hasRequirement = [...card.querySelectorAll(".guest-diet:checked")]
    .some((box) => box.value !== "None");
  wrap.classList.toggle("is-hidden", !hasRequirement);
  if (!hasRequirement) notes.value = "";
}

function addGuestCard() {
  guestCount += 1;
  const node = guestTemplate.content.cloneNode(true);
  const card = node.querySelector(".guest-card");

  // Give this card's radios their own name so guests don't share a group
  card.querySelectorAll(".guest-attending").forEach((radio) => {
    radio.name = `attending-${guestCount}`;
  });

  // Only the first guest can't be removed — a form needs at least one
  if (guestCount === 1) {
    card.querySelector(".remove-guest").remove();
  } else {
    card.querySelector(".remove-guest").addEventListener("click", () => {
      card.remove();
      renumberGuests();
    });
  }

  wireGuestCard(card);
  guestsContainer.appendChild(card);
  renumberGuests();
}

addGuestBtn.addEventListener("click", addGuestCard);
addGuestCard(); // start with one guest already on the form

function collectGuests() {
  return [...guestsContainer.querySelectorAll(".guest-card")].map((card) => {
    const attendingEl = card.querySelector(".guest-attending:checked");
    const attending = attendingEl ? attendingEl.value : "";
    const isYes = attending.startsWith("Yes");
    const checkedDiets = [...card.querySelectorAll(".guest-diet:checked")];
    const diets = checkedDiets.map((x) => x.value).join(", ");
    const hasRequirement = checkedDiets.some((x) => x.value !== "None");
    const notesEl = card.querySelector(".guest-diet-notes");

    return {
      name: card.querySelector(".guest-name").value,
      attending,
      dietary: isYes ? diets || "None specified" : "",
      dietaryNotes: isYes && hasRequirement && notesEl ? notesEl.value.trim() : "",
      song: isYes ? card.querySelector(".guest-song").value : ""
    };
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const cards = [...guestsContainer.querySelectorAll(".guest-card")];
  const payload = {
    timestamp: new Date().toISOString(),
    // The first invitation confirmation card is the person the invite is for
    contactName: cards.length ? cards[0].querySelector(".guest-name").value : "",
    notes: form.querySelector('[name="notes"]').value || "",
    guests: collectGuests()
  };

  // Handy for checking exactly what's about to be sent — open your browser's
  // dev tools console (F12) before submitting to see this.
  console.log("RSVP payload being sent:", payload);

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
