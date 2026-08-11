(() => {
  "use strict";

  const FOOD_HREF = "#craft-dogs";
  const KNOWN_HREFS = [
    "#signature-cocktails",
    "#martinis-classics",
    "#core-pricing",
    "#beer-wine",
    "#zero-proof"
  ];

  function normalizeHash(anchor) {
    if (!anchor) return "";
    const raw = anchor.getAttribute("href") || "";
    const hashIndex = raw.indexOf("#");
    return hashIndex >= 0 ? raw.slice(hashIndex) : "";
  }

  function alreadyExists() {
    return Array.from(document.querySelectorAll('a[href*="#craft-dogs"]'))
      .some((a) => normalizeHash(a) === FOOD_HREF);
  }

  function findBestAnchor() {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const known = anchors.filter((a) => KNOWN_HREFS.includes(normalizeHash(a)));

    if (!known.length) return null;

    // Prefer the Zero-Proof button when present.
    const zeroProof = known.find((a) => normalizeHash(a) === "#zero-proof");
    if (zeroProof) return zeroProof;

    // Otherwise find a parent that contains several of the known jump links.
    for (const anchor of known) {
      let parent = anchor.parentElement;
      for (let depth = 0; parent && depth < 4; depth++, parent = parent.parentElement) {
        const siblings = Array.from(parent.querySelectorAll("a[href]"))
          .filter((a) => KNOWN_HREFS.includes(normalizeHash(a)));
        if (siblings.length >= 2) return siblings[siblings.length - 1];
      }
    }

    return known[known.length - 1];
  }

  function installFoodButton() {
    if (alreadyExists()) return true;

    const source = findBestAnchor();
    if (!source || !source.parentNode) return false;

    const food = source.cloneNode(true);
    food.setAttribute("href", FOOD_HREF);
    food.removeAttribute("aria-current");
    food.classList.remove("active");

    // Preserve any nested markup while replacing the visible label.
    if (food.children.length === 0) {
      food.textContent = "Food";
    } else {
      const labelNode = Array.from(food.childNodes)
        .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (labelNode) {
        labelNode.textContent = "Food";
      } else {
        food.textContent = "Food";
      }
    }

    source.insertAdjacentElement("afterend", food);
    return true;
  }

  function start() {
    if (installFoodButton()) return;

    // The menu jump navigation may be rendered by another script.
    const observer = new MutationObserver(() => {
      if (installFoodButton()) observer.disconnect();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.setTimeout(() => observer.disconnect(), 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
