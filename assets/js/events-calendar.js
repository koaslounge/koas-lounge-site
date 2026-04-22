(function () {
  const list = document.querySelector('[data-events-list]');
  const status = document.querySelector('[data-events-status]');
  const source = document.querySelector('[data-events-source]');
  const endpoint = '/.netlify/functions/office365-events';
  const timezone = 'Pacific/Honolulu';

  if (!list || !status) {
    return;
  }

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: timezone
  });

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone
  });

  loadEvents();

  async function loadEvents() {
    setStatus('Loading upcoming events...');

    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json'
        }
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to load events right now.');
      }

      renderEvents(payload.events || []);

      if (source && payload.fetchedAt) {
        source.textContent = `Last synced ${new Date(payload.fetchedAt).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: timezone
        })} HST`;
      }

      if (!payload.events || payload.events.length === 0) {
        setStatus('No upcoming events are scheduled right now.');
      } else {
        setStatus('');
      }
    } catch (error) {
      list.innerHTML = '';
      setStatus('The live calendar is temporarily unavailable. Please check back shortly.');
      if (source) {
        source.textContent = error.message;
      }
    }
  }

  function renderEvents(events) {
    list.innerHTML = '';

    const limited = events.slice(0, 12);

    for (const event of limited) {
      const article = document.createElement('article');
      article.className = 'live-event-card';

      const startDate = event.start ? new Date(event.start) : null;
      const endDate = event.end ? new Date(event.end) : null;
      const scheduleText = formatSchedule(startDate, endDate, event.isAllDay);

      article.innerHTML = `
        <div class="live-event-date">${escapeHtml(startDate ? dayFormatter.format(startDate) : 'TBA')}</div>
        <h3>${escapeHtml(event.title || 'Untitled Event')}</h3>
        <p class="live-event-time">${escapeHtml(scheduleText)}</p>
        ${event.location ? `<p class="live-event-location">${escapeHtml(event.location)}</p>` : ''}
        ${event.description ? `<p class="live-event-description">${escapeHtml(event.description)}</p>` : ''}
        ${event.url ? `<p class="live-event-link"><a href="${escapeAttribute(event.url)}" target="_blank" rel="noopener">View in Outlook</a></p>` : ''}
      `;

      list.appendChild(article);
    }
  }

  function formatSchedule(startDate, endDate, isAllDay) {
    if (!startDate) return 'Time to be announced';
    if (isAllDay) return 'All day';

    const start = timeFormatter.format(startDate);
    const end = endDate ? timeFormatter.format(endDate) : '';
    return end ? `${start} - ${end}` : start;
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
})();
