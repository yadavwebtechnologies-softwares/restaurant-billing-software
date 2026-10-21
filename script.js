/* ==========================================================
   YADAV WEB TECHNOLOGIES
   Shared JavaScript — All Website Pages
   ========================================================== */

"use strict";

document.documentElement.classList.add("js-enabled");


/* 1. Shared DOM Helpers */

const select = (selector, parent = document) =>
  parent.querySelector(selector);

const selectAll = (selector, parent = document) =>
  Array.from(parent.querySelectorAll(selector));


/* 2. Current Year */

function initializeCurrentYear() {
  const yearElement = select("#currentYear");

  if (yearElement) {
    yearElement.textContent = String(new Date().getFullYear());
  }
}


/* 3. Mobile Navigation */

function initializeNavigation() {
  const menuButton = select("#menuBtn");
  const navigation = select("#primaryNav");

  if (!menuButton || !navigation) {
    return;
  }

  function setMenuState(isOpen) {
    navigation.classList.toggle("is-open", isOpen);

    menuButton.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    menuButton.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
  }

  menuButton.addEventListener("click", () => {
    const isOpen =
      menuButton.getAttribute("aria-expanded") === "true";

    setMenuState(!isOpen);
  });

  navigation.addEventListener("click", (event) => {
    const link = event.target.closest("a");

    if (link) {
      setMenuState(false);
    }
  });

  document.addEventListener("click", (event) => {
    const isOpen =
      menuButton.getAttribute("aria-expanded") === "true";

    if (
      isOpen &&
      !navigation.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
      menuButton.focus();
    }
  });

  /*
   * Close the mobile menu when returning to desktop layout.
   * The breakpoint matches the shared stylesheet.
   */

  const desktopQuery = window.matchMedia("(min-width: 861px)");

  desktopQuery.addEventListener("change", (event) => {
    if (event.matches) {
      setMenuState(false);
    }
  });

  setMenuState(false);
}


/* 4. Scroll-Based Fade Animations */

function initializeScrollReveal() {
  const revealElements = selectAll("[data-reveal]");

  if (revealElements.length === 0) {
    return;
  }

  /*
   * Respect users who prefer reduced motion.
   * All elements remain visible without scroll animation.
   */

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  if (reducedMotion.matches) {
    document.documentElement.classList.remove("js-enabled");

    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });

    return;
  }

  /*
   * Reveal elements as they enter the viewport.
   * Remove the visible state when they leave, enabling
   * both fade-in and fade-out during scrolling.
   */

  if (!("IntersectionObserver" in window)) {
    document.documentElement.classList.remove("js-enabled");

    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });

    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -6% 0px",
      threshold: 0.08
    }
  );

  revealElements.forEach((element) => {
    observer.observe(element);
  });
}


/* 5. Contact Form — Prepare an Email Draft */

function initializeContactForms() {
  const forms = selectAll("[data-contact-form]");

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const status = select("#contactFormStatus", form);

      const email = (
        form.dataset.contactEmail || ""
      ).trim();

      if (!email) {
        showFormStatus(
          status,
          "The contact email has not been configured yet.",
          "error"
        );

        return;
      }

      if (!form.reportValidity()) {
        return;
      }

      const formData = new FormData(form);

      const name = getFieldValue(formData, "name");
      const senderEmail = getFieldValue(formData, "email");
      const organization = getFieldValue(
        formData,
        "organization"
      );

      const service = getFieldValue(formData, "service");
      const budget = getFieldValue(formData, "budget");
      const timeline = getFieldValue(formData, "timeline");
      const message = getFieldValue(formData, "message");

      const subject = `Project Enquiry - ${service || "New Enquiry"}`;

      const body = [
        "Project Enquiry",
        "",
        `Name: ${name}`,
        `Email: ${senderEmail}`,
        `Business / Organization: ${organization || "Not provided"}`,
        `Service Required: ${service || "Not specified"}`,
        `Estimated Budget: ${budget || "Not specified"}`,
        `Expected Timeline: ${timeline || "Not specified"}`,
        "",
        "Project Requirements:",
        message
      ].join("\n");

      const mailtoURL =
        `mailto:${email}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

      showFormStatus(
        status,
        "Opening your email application. Review the draft and send it to submit your enquiry.",
        "success"
      );

      /*
       * This opens a draft. It does not send the email
       * automatically or store form data on a server.
       */

      window.location.href = mailtoURL;
    });
  });
}


/* 6. Form Helpers */

function getFieldValue(formData, fieldName) {
  const value = formData.get(fieldName);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function showFormStatus(status, message, type) {
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.remove("is-success", "is-error");

  if (type === "success") {
    status.classList.add("is-success");
  } else if (type === "error") {
    status.classList.add("is-error");
  }
}


/* 7. Initialize Shared Features */

function initializeWebsite() {
  initializeCurrentYear();
  initializeNavigation();
  initializeScrollReveal();
  initializeContactForms();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeWebsite,
    { once: true }
  );
} else {
  initializeWebsite();
}

/* 7. Popup */

(() => {
  "use strict";

  const popupKey = "ywt_restaurant_promo_shown";
  const bannerURL =
    "https://yadavwebtechnologies-softwares.github.io/yadavwebtechnologies/assets/projects/restaurant-billing-promo.svg";

  const whatsappURL =
    "https://wa.me/917896579939?text=" +
    encodeURIComponent(
      "Hello Yadav Web Technologies, I am interested in your Restaurant Billing and Invoice Software. Please share the features, pricing, and demo details."
    );

  // Prevent duplicate popups if this script is loaded more than once.
  if (window.__ywtRestaurantPromoInitialized) return;
  window.__ywtRestaurantPromoInitialized = true;

  // Show only once per browser-tab session.
  try {
    if (sessionStorage.getItem(popupKey)) return;
  } catch (_) {
    // Continue if session storage is unavailable.
  }

  const styles = document.createElement("style");

  styles.textContent = `
    .ywt-promo-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0, 0, 0, 0.58);
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 380ms ease,
        visibility 380ms ease;
      box-sizing: border-box;
    }

    .ywt-promo-overlay.ywt-promo-visible {
      opacity: 1;
      visibility: visible;
    }

    .ywt-promo-card {
      position: relative;
      width: min(100%, 560px);
      max-height: calc(100vh - 40px);
      overflow: auto;
      border-radius: 18px;
      background: #ffffff;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
      transform: translateY(22px) scale(0.97);
      opacity: 0;
      transition:
        transform 420ms cubic-bezier(0.2, 0.75, 0.25, 1),
        opacity 350ms ease;
    }

    .ywt-promo-visible .ywt-promo-card {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    .ywt-promo-link {
      display: block;
      line-height: 0;
      border-radius: inherit;
      cursor: pointer;
      outline-offset: 4px;
    }

    .ywt-promo-banner {
      display: block;
      width: 100%;
      height: auto;
      border-radius: 18px;
    }

    .ywt-promo-close {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 2;
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: 1px solid #d5d5d5;
      border-radius: 50%;
      background: #ffffff;
      color: #111111;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.16);
      transition:
        transform 220ms ease,
        background 220ms ease;
    }

    .ywt-promo-close:hover {
      background: #eeeeee;
      transform: rotate(90deg);
    }

    .ywt-promo-close:focus-visible {
      outline: 2px solid #111111;
      outline-offset: 3px;
    }

    .ywt-promo-close svg {
      width: 19px;
      height: 19px;
    }

    .ywt-promo-overlay.ywt-promo-closing {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .ywt-promo-closing .ywt-promo-card {
      transform: translateY(12px) scale(0.97);
      opacity: 0;
    }

    @media (max-width: 600px) {
      .ywt-promo-overlay {
        padding: 14px;
      }

      .ywt-promo-card {
        width: 100%;
        max-height: calc(100vh - 28px);
        border-radius: 13px;
      }

      .ywt-promo-banner {
        border-radius: 13px;
      }

      .ywt-promo-close {
        top: 7px;
        right: 7px;
        width: 35px;
        height: 35px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ywt-promo-overlay,
      .ywt-promo-card,
      .ywt-promo-close {
        transition: none !important;
      }
    }
  `;

  document.head.appendChild(styles);

  const overlay = document.createElement("div");
  overlay.className = "ywt-promo-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Restaurant billing software offer");

  overlay.innerHTML = `
    <div class="ywt-promo-card">
      <button
        class="ywt-promo-close"
        type="button"
        aria-label="Close promotional popup"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>

      <a
        class="ywt-promo-link"
        href="${whatsappURL}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Enquire about restaurant billing software on WhatsApp"
      >
        <img
          class="ywt-promo-banner"
          src="${bannerURL}"
          alt="Restaurant Billing and Invoice Software by Yadav Web Technologies"
          width="1200"
          height="1200"
        >
      </a>
    </div>
  `;

  function closePopup() {
    overlay.classList.add("ywt-promo-closing");
    overlay.classList.remove("ywt-promo-visible");

    document.removeEventListener("keydown", handleEscape);

    window.setTimeout(() => {
      overlay.remove();
      styles.remove();
    }, 430);
  }

  function handleEscape(event) {
    if (event.key === "Escape") {
      closePopup();
    }
  }

  overlay.querySelector(".ywt-promo-close")
    .addEventListener("click", closePopup);

  // Clicking the dark background also closes the popup.
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closePopup();
    }
  });

  function showPopup() {
    try {
      if (sessionStorage.getItem(popupKey)) return;
      sessionStorage.setItem(popupKey, "1");
    } catch (_) {
      // The in-memory guard still prevents repeated display in this page.
    }

    document.body.appendChild(overlay);

    // Allow the initial hidden state to render before animating in.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add("ywt-promo-visible");
        overlay.querySelector(".ywt-promo-close").focus();
      });
    });

    document.addEventListener("keydown", handleEscape);
  }

  // Show the popup five seconds after the page is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      window.setTimeout(showPopup, 5000);
    }, { once: true });
  } else {
    window.setTimeout(showPopup, 5000);
  }
})();
