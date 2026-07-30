(function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderMenuList(items, withNotes) {
    return (items || []).map(function (item) {
      var note = withNotes && item.note ? '<span class="price-sub">' + escapeHtml(item.note) + '</span>' : '';
      return '<li><div class="menu-copy"><span>' + escapeHtml(item.name) + '</span><small>' + escapeHtml(item.description) + '</small></div><div class="price">' + escapeHtml(item.price) + note + '</div></li>';
    }).join('');
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value || '';
  }

  function fillSection(prefix, section, withNotes) {
    if (!section) return;
    setText(prefix + '-eyebrow', section.eyebrow);
    setText(prefix + '-title', section.title);
    var note = document.getElementById(prefix + '-note');
    if (note) {
      note.textContent = section.note || '';
      note.hidden = !section.note;
    }
    var list = document.getElementById(prefix + '-list');
    if (list) list.innerHTML = renderMenuList(section.items, withNotes);
  }

  function render() {
    var data = window.MENU_DATA;
    if (!data) return;

    if (data.hero) {
      setText('menu-hero-eyebrow', data.hero.eyebrow);
      setText('menu-hero-title', data.hero.title);
      setText('menu-hero-lead', data.hero.lead);
    }

    var strip = document.getElementById('menu-pricing-strip');
    if (strip && data.pricingStrip) {
      strip.innerHTML = data.pricingStrip.map(function (item) {
        var price = item.price || '';
        return '<article class="menu-price-card"><span>' + escapeHtml(item.label) + '</span><strong>' + escapeHtml(price) + '</strong><small>' + escapeHtml(item.value) + '</small></article>';
      }).join('');
    }

    fillSection('signature', data.signatureSection, true);
    fillSection('pricing', data.pricingSection, false);
    fillSection('classics', data.classicsSection, false);
    fillSection('flexible', data.flexibleSection, false);

    if (data.notesSection) {
      setText('notes-eyebrow', data.notesSection.eyebrow);
      setText('notes-title', data.notesSection.title);
      var notes = document.getElementById('notes-highlights');
      if (notes) {
        notes.innerHTML = (data.notesSection.highlights || []).map(function (item) {
          return '<div class="menu-highlight"><strong>' + escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.text) + '</p></div>';
        }).join('');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
