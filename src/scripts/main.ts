/* Site script: header shadow, mobile drawer, FAQ, request popup, form
   stamps, home/business fields, locality strip, town finder, photo lightbox.
   No dependencies. Bundled once by Astro and loaded as a deferred module. */

const body = document.body;

/* ---------- sticky header shadow ---------- */
const header = document.querySelector<HTMLElement>('.header');
const onScroll = () => header?.classList.toggle('header-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- mobile drawer ---------- */
const burger = document.querySelector<HTMLButtonElement>('.hamburger');
function setDrawer(open: boolean) {
  body.classList.toggle('drawer-open', open);
  burger?.setAttribute('aria-expanded', String(open));
  body.style.overflow = open ? 'hidden' : '';
}
burger?.addEventListener('click', () => setDrawer(true));
document.querySelectorAll('.drawer-close, .drawer-overlay').forEach((el) => el.addEventListener('click', () => setDrawer(false)));
document.querySelectorAll<HTMLButtonElement>('.drawer-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    btn.nextElementSibling?.classList.toggle('open', !open);
  });
});

/* ---------- FAQ accordion ---------- */
document.querySelectorAll<HTMLButtonElement>('.faq-q').forEach((q) => {
  q.addEventListener('click', () => {
    const open = q.parentElement!.classList.toggle('open');
    q.setAttribute('aria-expanded', String(open));
  });
});

/* ---------- request popup ---------- */
const overlay = document.querySelector<HTMLElement>('.popup-overlay');
let lastTrigger: HTMLElement | null = null;
function openPopup(trigger: HTMLElement) {
  if (!overlay) return;
  lastTrigger = trigger;
  setDrawer(false);
  overlay.classList.add('active');
  body.style.overflow = 'hidden';
  setTimeout(() => overlay.querySelector<HTMLInputElement>('input[name="first_name"]')?.focus(), 50);
}
function closePopup() {
  if (!overlay?.classList.contains('active')) return;
  overlay.classList.remove('active');
  body.style.overflow = '';
  lastTrigger?.focus();
}
document.querySelectorAll<HTMLElement>('[data-popup="book"]').forEach((t) =>
  t.addEventListener('click', (e) => { e.preventDefault(); openPopup(t); }),
);
overlay?.querySelector('.popup-close')?.addEventListener('click', closePopup);
overlay?.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closePopup(); setDrawer(false); } });
if (location.hash === '#request' && overlay) openPopup(document.body);

/* ---------- form stamps: bot time trap + source page ---------- */
const now = String(Math.floor(Date.now() / 1000));
document.querySelectorAll<HTMLInputElement>('.js-ts').forEach((i) => (i.value = now));
document.querySelectorAll<HTMLInputElement>('.js-src').forEach((i) => (i.value = location.pathname));

/* ---------- error returned by contact-handler.php (?error=missing|send) ---------- */
const formError = new URLSearchParams(location.search).get('error');
if (formError) {
  const phone = document.querySelector('.header-phone span')?.lastChild?.textContent ?? 'us';
  const msg = formError === 'missing'
    ? 'Please add your first name and a valid phone number, then send again.'
    : `Sorry, your request did not go through. Please call ${phone} so we can help right away.`;
  const alert = document.querySelector<HTMLElement>('main .lead-form .form-alert');
  if (alert) { alert.textContent = msg; alert.hidden = false; alert.scrollIntoView({ block: 'center' }); }
}

/* ---------- preview build: the form cannot send on GitHub Pages ---------- */
if (__PREVIEW__) {
  document.querySelectorAll<HTMLFormElement>('.lead-form').forEach((form) => {
    form.noValidate = true;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = form.querySelector<HTMLElement>('.form-alert');
      if (!note) return;
      note.textContent = 'This is a preview. The form goes live after hosting is set up, so nothing was sent.';
      note.classList.add('preview-note');
      note.hidden = false;
      note.scrollIntoView({ block: 'nearest' });
    });
  });
}

/* ---------- home vs business fields ---------- */
document.querySelectorAll<HTMLFormElement>('.lead-form').forEach((form) => {
  const biz = form.querySelector<HTMLElement>('.biz-fields');
  if (!biz) return;
  form.querySelectorAll<HTMLInputElement>('input[name="customer_type"]').forEach((r) =>
    r.addEventListener('change', () => { biz.hidden = !(r.value === 'Business' && r.checked); }),
  );
});

/* ---------- remembered locality in the top bar ---------- */
try {
  const KEY = 'site_locality';
  const here = body.dataset.locality;
  if (here) sessionStorage.setItem(KEY, here);
  const remembered = here || sessionStorage.getItem(KEY);
  const strip = document.querySelector<HTMLElement>('.local-strip');
  if (remembered && strip) {
    strip.querySelector('.local-name')!.textContent = `Serving ${remembered}`;
    strip.hidden = false;
  }
} catch { /* storage blocked: strip stays hidden */ }

/* ---------- town / ZIP finder ---------- */
type Place = { n: string; u: string; t: string; z?: string };
document.querySelectorAll<HTMLElement>('.finder').forEach((finder) => {
  const input = finder.querySelector('input')!;
  const results = finder.querySelector<HTMLElement>('.finder-results')!;
  const src = finder.dataset.index!;
  /* Index paths are root-relative; prefix the base path on the GitHub Pages preview. */
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const phone = document.querySelector<HTMLAnchorElement>('.header-phone')?.getAttribute('href') ?? '';
  let index: Place[] | null = null;
  let hl = -1;
  const load = async () => {
    if (index) return index;
    try { index = await (await fetch(src)).json(); } catch { index = []; }
    return index!;
  };
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  const render = async () => {
    const list = await load();
    const q = input.value.trim().toLowerCase();
    hl = -1;
    if (q.length < 2) { results.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); results.innerHTML = ''; return; }
    const starts = list.filter((p) => p.n.toLowerCase().startsWith(q) || (p.z && p.z.split(' ').some((z) => z.startsWith(q))));
    const contains = list.filter((p) => !starts.includes(p) && p.n.toLowerCase().includes(q));
    const hits = starts.concat(contains).slice(0, 7);
    results.innerHTML = hits.length
      ? hits.map((p) => `<a href="${esc(base + p.u)}" role="option">${esc(p.n)}<small>${esc(p.t)}</small></a>`).join('')
      : `<div class="none">We serve the whole state. <a href="${esc(phone)}">Call us</a> and we will confirm scheduling for your town.</div>`;
    results.classList.add('open');
    input.setAttribute('aria-expanded', 'true');
  };
  input.addEventListener('input', render);
  input.addEventListener('focus', () => { load(); });
  input.addEventListener('keydown', (e) => {
    const links = results.querySelectorAll<HTMLAnchorElement>('a[role="option"]');
    if (!links.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      hl = (hl + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach((l, i) => l.classList.toggle('hl', i === hl));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      (links[hl] || links[0]).click();
    }
  });
  finder.querySelector('button')!.addEventListener('click', async () => {
    await render();
    results.querySelector<HTMLAnchorElement>('a[role="option"]')?.click();
  });
  document.addEventListener('click', (e) => { if (!finder.contains(e.target as Node)) results.classList.remove('open'); });
});

/* ---------- job photo lightbox ---------- */
const openers = document.querySelectorAll<HTMLAnchorElement>('.work-open');
if (openers.length) {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Project photo');
  box.innerHTML = '<button class="lb-close" aria-label="Close photo">&times;</button><button class="lb-prev" aria-label="Previous photo">&#8249;</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-next" aria-label="Next photo">&#8250;</button>';
  body.appendChild(box);
  const img = box.querySelector('img')!;
  const cap = box.querySelector('figcaption')!;
  let cur = 0;
  let last: HTMLElement | null = null;
  const show = (i: number) => {
    cur = (i + openers.length) % openers.length;
    const o = openers[cur];
    img.src = o.href;
    img.alt = o.querySelector('img')?.alt ?? '';
    cap.textContent = o.dataset.caption ?? '';
  };
  const close = () => { box.hidden = true; body.style.overflow = ''; last?.focus(); };
  openers.forEach((o, i) => o.addEventListener('click', (e) => {
    e.preventDefault(); last = o; show(i); box.hidden = false; body.style.overflow = 'hidden';
    box.querySelector<HTMLButtonElement>('.lb-close')!.focus();
  }));
  box.querySelector('.lb-close')!.addEventListener('click', close);
  box.querySelector('.lb-prev')!.addEventListener('click', () => show(cur - 1));
  box.querySelector('.lb-next')!.addEventListener('click', () => show(cur + 1));
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
  });
}
