(function () {
  "use strict";

  function encodeFormData(formData) {
    var params = new URLSearchParams();
    formData.forEach(function (value, key) {
      params.append(key, value);
    });
    return params.toString();
  }

  function getStatusNode(form) {
    var status = form.querySelector("[data-koa-form-status]");
    if (status) return status;

    status = document.createElement("div");
    status.className = "koa-netlify-form-status";
    status.setAttribute("data-koa-form-status", "");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("tabindex", "-1");
    form.appendChild(status);
    return status;
  }

  function setStatus(status, state, title, message) {
    status.className = "koa-netlify-form-status is-visible is-" + state;
    status.innerHTML = "<strong>" + title + "</strong><span>" + message + "</span>";
    status.focus({ preventScroll: true });
  }

  function mountForm(form) {
    if (form.dataset.koaNetlifyMounted === "true") return;
    form.dataset.koaNetlifyMounted = "true";

    var submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
    var status = getStatusNode(form);
    var originalLabel = submitButton ? submitButton.innerHTML : "";

    form.addEventListener("submit", function (event) {
      if (!form.checkValidity()) return;

      event.preventDefault();

      var formData = new FormData(form);
      var formName = form.getAttribute("name") || formData.get("form-name") || "website-form";
      if (!formData.get("form-name")) formData.set("form-name", formName);

      var successTitle = form.dataset.successTitle || "Message received.";
      var successMessage = form.dataset.successMessage || "Thank you. The Koa's Lounge team will follow up soon.";

      status.className = "koa-netlify-form-status";
      status.innerHTML = "";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute("aria-busy", "true");
        submitButton.innerHTML = "Sending...";
      }

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encodeFormData(formData)
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Submission failed with status " + response.status);
          form.reset();
          setStatus(status, "success", successTitle, successMessage);
        })
        .catch(function () {
          setStatus(
            status,
            "error",
            "We could not send that yet.",
            "Please try again, call (808) 965-6644, or email info@koaslounge.com."
          );
        })
        .finally(function () {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.removeAttribute("aria-busy");
            submitButton.innerHTML = originalLabel;
          }
        });
    });
  }

  function mount() {
    document.querySelectorAll('form[data-koa-netlify-form]').forEach(mountForm);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
