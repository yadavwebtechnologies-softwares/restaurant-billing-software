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
