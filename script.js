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


/* YWT — Lightweight Restaurant Promo */

(() => {
  "use strict";

  const KEY = "ywt_restaurant_promo_shown";
  const DELAY = 10000;

  const BANNER =
    "https://yadavwebtechnologies-softwares.github.io/yadavwebtechnologies/assets/projects/restaurant-billing-promo.svg";

  const WHATSAPP =
    "https://wa.me/917896579939?text=" +
    encodeURIComponent(
      "Hello Yadav Web Technologies, I am interested in your Restaurant Billing and Invoice Software. Please share the features, pricing, and demo details."
    );

  let shown;

  try {
    shown = sessionStorage.getItem(KEY);
  } catch {
    return;
  }

  if (shown) return;

  function showPromo() {
    try {
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
    } catch {
      return;
    }

    const style = document.createElement("style");
    style.textContent = `
      .ywt-promo{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:16px;background:#000a;opacity:0;visibility:hidden;transition:opacity .35s ease,visibility .35s ease}
      .ywt-promo.open{opacity:1;visibility:visible}
      .ywt-promo-card{position:relative;width:min(680px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:12px;transform:translateY(10px) scale(.99);transition:transform .35s ease}
      .ywt-promo.open .ywt-promo-card{transform:translateY(0) scale(1)}
      .ywt-promo a{display:block;line-height:0}
      .ywt-promo img{display:block;width:100%;height:auto;max-height:85vh;object-fit:contain}
      .ywt-promo button{position:absolute;top:8px;right:8px;z-index:1;width:38px;height:38px;display:grid;place-items:center;padding:0;border:1px solid #ccc;border-radius:50%;background:#fff;color:#000;cursor:pointer}
      @media(max-width:480px){.ywt-promo{padding:10px}.ywt-promo-card{max-height:85vh}}
      @media(prefers-reduced-motion:reduce){.ywt-promo,.ywt-promo-card{transition:none}.ywt-promo-card{transform:none}}
    `;
    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.className = "ywt-promo";
    overlay.innerHTML = `
      <div class="ywt-promo-card" role="dialog" aria-modal="true" aria-label="Restaurant Billing Software promotion">
        <a href="${WHATSAPP}" target="_blank" rel="noopener noreferrer" aria-label="Enquire on WhatsApp">
          <img src="${BANNER}" alt="Restaurant Billing and Invoice Software" decoding="async">
        </a>
        <button type="button" aria-label="Close popup">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 6L18 18M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => {
      overlay.classList.remove("open");
      setTimeout(() => {
        overlay.remove();
        style.remove();
      }, 350);
      document.removeEventListener("keydown", onKey);
    };

    const onKey = e => {
      if (e.key === "Escape") close();
    };

    overlay.querySelector("button").addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      close();
    });

    overlay.addEventListener("click", e => {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", onKey);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => overlay.classList.add("open"));
    });
  }

  // Schedule only after the document is ready.
  const schedule = () => setTimeout(showPromo, DELAY);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule, { once: true });
  } else {
    schedule();
  }
})();
