(function () {
  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderMenuList(items, withNotes) {
    return (items || []).map(function (item) {
      var noteHtml = withNotes && item.note
        ? '<span class="price-sub">' + escapeHtml(item.note) + '</span>'
        : '';
      return [
        '<li>',
          '<div class="menu-copy">',
            '<span>' + escapeHtml(item.name) + '</span>',
            '<small>' + escapeHtml(item.description || "") + '</small>',
          '</div>',
          '<div class="price">' + escapeHtml(item.price || "") + noteHtml + '</div>',
        '</li>'
      ].join("");
    }).join("");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var data = window.MENU_DATA;
    if (!data) return;

    var heroEyebrow = document.getElementById("menu-hero-eyebrow");
    var heroTitle = document.getElementById("menu-hero-title");
    var heroLead = document.getElementById("menu-hero-lead");
    if (heroEyebrow) heroEyebrow.textContent = data.hero?.eyebrow || "";
    if (heroTitle) heroTitle.textContent = data.hero?.title || "";
    if (heroLead) heroLead.textContent = data.hero?.lead || "";

    var strip = document.getElementById("menu-pricing-strip");
    if (strip) {
      strip.innerHTML = (data.pricingStrip || []).map(function (item) {
        return '<div class="info-strip-item"><strong>' + escapeHtml(item.label) + '</strong><span>' + escapeHtml(item.value) + '</span></div>';
      }).join("");
    }

    function fillSection(prefix, section, withNotes) {
      var eyebrow = document.getElementById(prefix + "-eyebrow");
      var title = document.getElementById(prefix + "-title");
      var note = document.getElementById(prefix + "-note");
      var list = document.getElementById(prefix + "-list");

      if (eyebrow) eyebrow.textContent = section?.eyebrow || "";
      if (title) title.textContent = section?.title || "";
      if (note) {
        if (section?.note) {
          note.textContent = section.note;
          note.style.display = "";
        } else {
          note.style.display = "none";
        }
      }
      if (list) list.innerHTML = renderMenuList(section?.items || [], withNotes);
    }

    fillSection("signature", data.signatureSection, true);
    fillSection("pricing", data.pricingSection, false);
    fillSection("classics", data.classicsSection, false);
    fillSection("flexible", data.flexibleSection, false);

    var notesEyebrow = document.getElementById("notes-eyebrow");
    var notesTitle = document.getElementById("notes-title");
    var notesWrap = document.getElementById("notes-highlights");
    if (notesEyebrow) notesEyebrow.textContent = data.notesSection?.eyebrow || "";
    if (notesTitle) notesTitle.textContent = data.notesSection?.title || "";
    if (notesWrap) {
      notesWrap.innerHTML = (data.notesSection?.highlights || []).map(function (item, idx) {
        var extraStyle = idx > 0 ? ' style="margin-top:1rem;"' : "";
        return '<div class="menu-highlight"' + extraStyle + '><strong>' + escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.text) + '</p></div>';
      }).join("");
    }
  });
})();
