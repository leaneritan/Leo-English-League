(function () {
  const lessons = [
    { id: 'opener', label: 'Unit Opener', file: 'opener.html' },
    { id: 'vocab1', label: 'Vocabulary 1', file: 'vocab-1.html' },
    { id: 'song', label: 'Song', file: 'song.html' },
    { id: 'grammar1', label: 'Grammar 1', file: 'grammar-1.html' },
    { id: 'vocab2', label: 'Vocabulary 2', file: 'vocab-2.html' },
    { id: 'grammar2', label: 'Grammar 2', file: 'grammar-2.html' },
    { id: 'reading', label: 'Reading', file: 'reading.html' },
    { id: 'writing', label: 'Writing', file: 'writing.html' },
    { id: 'values', label: 'Values', file: 'values.html' },
    { id: 'mission', label: 'Mission', file: 'mission.html' },
    { id: 'project', label: 'Project', file: 'project.html' },
    { id: 'book-reading', label: 'Book Reading', file: 'book-reading.html' }
  ];

  const currentFile = location.pathname.split('/').pop().toLowerCase();
  const index = lessons.findIndex(lesson => lesson.file === currentFile);
  if (index < 0 || document.getElementById('leea-unit-nav')) return;

  const prev = lessons[index - 1];
  const current = lessons[index];
  const next = lessons[index + 1];
  const dashboardUrl = '../../../../index.html#leo/our-world';

  const style = document.createElement('style');
  style.textContent = `
    .leea-unit-nav {
      position: fixed;
      left: 50%;
      bottom: 14px;
      transform: translateX(-50%);
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border: 2px solid #E5E3DC;
      border-radius: 4px;
      background: rgba(255,255,255,.96);
      box-shadow: 0 8px 28px rgba(0,0,0,.16);
      font-family: Inter, Nunito, Arial, sans-serif;
    }
    .leea-unit-nav a,
    .leea-unit-nav span {
      border-radius: 3px;
      padding: 7px 11px;
      font-size: 12px;
      font-weight: 900;
      color: #111;
      text-decoration: none;
      white-space: nowrap;
    }
    .leea-unit-nav a {
      border: 2px solid #E5E3DC;
      background: #FAFAF7;
    }
    .leea-unit-nav a:hover {
      border-color: #1A6BB5;
      background: #EEF5FF;
    }
    .leea-unit-nav .unit-home {
      background: #1A6BB5;
      border-color: #1A6BB5;
      color: #fff;
    }
    .leea-unit-nav .unit-current {
      color: #5A5853;
      font-family: Oswald, Inter, sans-serif;
      letter-spacing: 1px;
    }
    .leea-unit-nav .disabled {
      opacity: .35;
      border: 2px solid #E5E3DC;
      background: #FAFAF7;
    }
    @media (max-width: 680px) {
      .leea-unit-nav {
        left: 10px;
        right: 10px;
        bottom: 10px;
        transform: none;
        justify-content: space-between;
      }
      .leea-unit-nav .unit-current { display: none; }
      .leea-unit-nav a,
      .leea-unit-nav span {
        flex: 1;
        text-align: center;
        padding: 8px 6px;
      }
    }
  `;
  document.head.appendChild(style);

  const nav = document.createElement('nav');
  nav.id = 'leea-unit-nav';
  nav.className = 'leea-unit-nav';
  nav.setAttribute('aria-label', 'Unit 7 lesson navigation');
  nav.innerHTML = `
    ${prev ? `<a href="${prev.file}">← ${prev.label}</a>` : '<span class="disabled">← Previous</span>'}
    <a class="unit-home" href="${dashboardUrl}">Unit 7</a>
    <span class="unit-current">${index + 1}/12 · ${current.label}</span>
    ${next ? `<a href="${next.file}">${next.label} →</a>` : '<span class="disabled">Next →</span>'}
  `;
  document.body.appendChild(nav);
})();
