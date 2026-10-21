
/* YWT — Restaurant Billing Promotional Popup */

(() => {
  "use strict";

  const SESSION_KEY = "ywt_restaurant_promo_shown";
  const DELAY_MS = 5000;

  const BANNER_URL =
    "https://yadavwebtechnologies-softwares.github.io/yadavwebtechnologies/assets/projects/restaurant-billing-promo.svg";

  const WHATSAPP_URL =
    "https://wa.me/917896579939?text=" +
    encodeURIComponent(
      "Hello Yadav Web Technologies, I am interested in your Restaurant Billing and Invoice Software. Please share the features, pricing, and demo details."
    );

  function initPromo() {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (document.getElementById("ywt-promo-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "ywt-promo-overlay";
    overlay.className = "ywt-promo-overlay";

    overlay.innerHTML = `
      <div
        class="ywt-promo-card"
        role="dialog"
        aria-modal="true"
        aria-label="Restaurant Billing Software promotion"
      >
        <button
          class="ywt-promo-close"
          type="button"
          aria-label="Close promotion"
        >&times;</button>

        <a
          class="ywt-promo-link"
          href="${WHATSAPP_URL}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Enquire about Restaurant Billing Software on WhatsApp"
        >
          <img
            class="ywt-promo-image"
            src="${BANNER_URL}"
            alt="Restaurant Billing and Invoice Software by Yadav Web Technologies"
          >
        </a>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeButton = overlay.querySelector(".ywt-promo-close");

    function closePromo() {
      overlay.classList.remove("ywt-promo-open");
      document.removeEventListener("keydown", handleKeydown);

      window.setTimeout(() => overlay.remove(), 350);
    }

    function handleKeydown(event) {
      if (event.key === "Escape") closePromo();
    }

    closeButton.addEventListener("click", closePromo);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closePromo();
    });

    document.addEventListener("keydown", handleKeydown);

    sessionStorage.setItem(SESSION_KEY, "1");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("ywt-promo-open");
      });
    });
  }

  function loadPromoStyles() {
    if (document.querySelector('link[data-ywt-promo-css]')) return;

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href =
      "https://yadavwebtechnologies-softwares.github.io/yadavwebtechnologies/promo.css";
    stylesheet.dataset.ywtPromoCss = "true";

    stylesheet.onload = () => {
      window.setTimeout(initPromo, DELAY_MS);
    };

    stylesheet.onerror = () => {
      console.error("YWT Promo: promo.css failed to load.");
    };

    document.head.appendChild(stylesheet);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadPromoStyles, {
      once: true
    });
  } else {
    loadPromoStyles();
  }
})();
