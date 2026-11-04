(function attachRecordValidation(root, createValidator) {
  const validateRecord = createValidator();

  if (typeof module === "object" && module.exports) {
    module.exports = validateRecord;
  }

  if (!root || !root.document) return;

  root.validateRecord = validateRecord;
  const initializeForms = () => {
    root.document.querySelectorAll("[data-record-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        form.querySelectorAll(".field-error").forEach((message) => message.remove());
        form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
          field.removeAttribute("aria-invalid");
          field.removeAttribute("aria-describedby");
        });

        const values = Object.fromEntries(new FormData(form).entries());
        const errors = validateRecord(values, Number(form.dataset.currentYear));
        for (const [name, message] of Object.entries(errors)) {
          const input = form.elements.namedItem(name);
          const field = input?.closest(".field");
          if (!input || !field) continue;

          const error = root.document.createElement("span");
          error.className = "field-error";
          error.id = `${name}-client-error`;
          error.setAttribute("role", "alert");
          error.textContent = message;
          input.setAttribute("aria-invalid", "true");
          input.setAttribute("aria-describedby", error.id);
          field.append(error);
        }

        const firstInvalidName = Object.keys(errors)[0];
        if (firstInvalidName) {
          event.preventDefault();
          form.elements.namedItem(firstInvalidName)?.focus();
        }
      });
    });
  };

  if (root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", initializeForms, { once: true });
  } else {
    initializeForms();
  }
})(typeof globalThis === "undefined" ? this : globalThis, function createValidator() {
  return function validateRecord(values = {}, currentYear = new Date().getFullYear()) {
    const text = (name) => typeof values[name] === "string" ? values[name] : "";
    const errors = {};
    const yearText = text("releaseYear").trim();
    const ratingText = text("rating").trim();
    const priceText = text("pricePaid").trim();

    if (!text("title").trim()) errors.title = "Please add a title";
    if (!text("artistName").trim()) errors.artistName = "Please add an artist";
    if (!text("format").trim()) errors.format = "Please choose a format";

    if (yearText) {
      const year = Number(yearText);
      if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
        errors.releaseYear = `Release year must be between 1900 and ${currentYear}`;
      }
    }

    if (ratingText) {
      const rating = Number(ratingText);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        errors.rating = "Rating must be a whole number from 1 to 5";
      }
    }

    if (priceText) {
      const pricePaid = Number(priceText);
      if (!Number.isFinite(pricePaid)) {
        errors.pricePaid = "Enter a valid price";
      } else if (pricePaid < 0) {
        errors.pricePaid = "Price paid cannot be negative";
      }
    }

    return errors;
  };
});
