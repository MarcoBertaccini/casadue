/* ============================================
   CASADUE — app.js
   Marco & Sara shared expense tracker
   ============================================ */

const SUPABASE_URL = 'https://fcmoebirtrbswovqunch.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbW9lYmlydHJic3dvdnF1bmNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDgwMDEsImV4cCI6MjA5ODIyNDAwMX0.3htBw5U8WZHkew_urIBX5d380u8GgpU6vQNs1TbmaRM';
const CORRECT_PIN  = '1234';
const PERSON_A     = 'marco';
const PERSON_B     = 'sara';
const LABEL_A      = 'Marco';
const LABEL_B      = 'Sara';
const DEFAULT_SPLIT_A = 70;
const DEFAULT_SPLIT_B = 30;

// ---- Categories ----
const CATEGORIES = [
  { id: 'affitto',      emoji: '🏠', label: 'Affitto'  },
  { id: 'bollette',     emoji: '💡', label: 'Bollette' },
  { id: 'spesa',        emoji: '🛒', label: 'Spesa'    },
  { id: 'ristoranti',   emoji: '🍕', label: 'Ristora.' },
  { id: 'trasporti',    emoji: '🚗', label: 'Trasporti'},
  { id: 'abbonamenti',  emoji: '📱', label: 'Abbonam.' },
  { id: 'salute',       emoji: '💊', label: 'Salute'   },
  { id: 'sport',        emoji: '🏋️', label: 'Sport'    },
  { id: 'viaggi',       emoji: '✈️', label: 'Viaggi'   },
  { id: 'intrattenimento', emoji: '🎬', label: 'Svago' },
  { id: 'casa',         emoji: '🔧', label: 'Casa'     },
  { id: 'altro',        emoji: '📦', label: 'Altro'    },
  { id: 'saldo',        emoji: '🤝', label: 'Pareggio', hidden: true },
];

const REACTIONS = {
  zero:     ['Pari! 🎉', 'Siete in parità, bravi!', 'Zero a zero, bella storia ✌️'],
  marco_owes: [
    `${LABEL_A} le deve una cena 🍽️`,
    `Dai ${LABEL_A}, offri tu stavolta! 😏`,
    `${LABEL_A} è in debito... 💸`,
  ],
  sara_owes: [
    `${LABEL_B} ci deve un aperitivo 🥂`,
    `${LABEL_B}, tocca a te! 😄`,
    `${LABEL_B} è in debito... 💸`,
  ],
};

// ---- Supabase client ----
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---- State ----
let currentPage = 'home';
let viewYear  = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0-indexed
let statsYear  = new Date().getFullYear();
let statsMonth = new Date().getMonth();
let selectedPayer = PERSON_A;
let rfSelectedPayer = PERSON_A;
let selectedCategory = 'altro';
let rfSelectedCategory = 'affitto';
let learnedKeywords = {};
let seasonEnabled = true;

// ---- DOM refs ----
const pinScreen  = document.getElementById('pin-screen');
const mainApp    = document.getElementById('main-app');
const pinDigits  = document.querySelectorAll('.pin-digit');
const pinError   = document.getElementById('pin-error');
const pages      = document.querySelectorAll('.page');
const navItems   = document.querySelectorAll('.nav-item');

// ============================================
//  SEASON THEMING
// ============================================
function getSeason(month = new Date().getMonth()) {
  if (month >= 2  && month <= 4)  return 'spring';
  if (month >= 5  && month <= 7)  return 'summer';
  if (month >= 8  && month <= 10) return 'autumn';
  return 'winter';
}

function getSeasonEmoji(season) {
  return { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' }[season];
}

function applySeasonTheme() {
  const season = getSeason();
  document.body.classList.remove('spring', 'summer', 'autumn', 'winter', 'no-season');
  if (!seasonEnabled) {
    document.body.classList.add('no-season');
    document.getElementById('btn-season-toggle').textContent = '🎨';
  } else {
    document.body.classList.add(season);
    document.getElementById('btn-season-toggle').textContent = getSeasonEmoji(season);
  }
  // Holidays override season palette — apply after so class order wins
  applyHoliday();
}

// ============================================
//  HOLIDAY DETECTION
// ============================================

// Computus — Easter Sunday for a given year
function easterDate(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19*a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2*e + 2*i - h - k) % 7;
  const m = Math.floor((a + 11*h + 22*l) / 451);
  const month = Math.floor((h + l - 7*m + 114) / 31) - 1; // 0-indexed
  const day   = ((h + l - 7*m + 114) % 31) + 1;
  return { month, day };
}

const HOLIDAYS = [
  {
    id: 'natale',
    emoji: '🎄',
    label: 'Buon Natale! 🎄🎁',
    decos: ['🎄','❄️','⭐','🎁','🔔','🕯️'],
    confetti: ['#C0392B','#1E8449','#F4D03F','#FFFFFF','#E74C3C','#27AE60'],
    match: (d) => d.month === 11 && d.day >= 20 && d.day <= 26,
  },
  {
    id: 'capodanno',
    emoji: '🎆',
    label: 'Felice Anno Nuovo! 🎆✨',
    decos: ['🎆','✨','🥂','🎇','⭐','🎊'],
    confetti: ['#9B59B6','#D4AC0D','#FFFFFF','#E8DAEF','#F9CA24','#6C5CE7'],
    match: (d) => (d.month === 11 && d.day >= 27) || (d.month === 0 && d.day <= 2),
  },
  {
    id: 'epifania',
    emoji: '⭐',
    label: 'Buona Epifania! ⭐🍬',
    decos: ['⭐','🌟','✨','🍬','🎁','👑'],
    confetti: ['#1A5276','#D4AC0D','#AED6F1','#FCF3CF','#2471A3','#F7DC6F'],
    match: (d) => d.month === 0 && d.day === 6,
  },
  {
    id: 'sanvalentino',
    emoji: '❤️',
    label: 'Buon San Valentino! ❤️🌹',
    decos: ['❤️','🌹','💕','💝','🌸','💋'],
    confetti: ['#C0392B','#E91E8C','#FADADD','#FF6B9D','#FF1744','#F48FB1'],
    match: (d) => d.month === 1 && d.day === 14,
  },
  {
    id: 'pasqua',
    emoji: '🐣',
    label: 'Buona Pasqua! 🐣🌷',
    decos: ['🐣','🌷','🥚','🌸','🐇','🌿'],
    confetti: ['#7D3C98','#28B463','#F9E79F','#E8DAEF','#A9DFBF','#FAD7A0'],
    match: (d) => {
      const e = easterDate(d.year);
      const diff = (d.month - e.month) * 30 + (d.day - e.day);
      return diff >= -1 && diff <= 1; // Sabato Santo, Pasqua, Pasquetta
    },
  },
  {
    id: 'ferragosto',
    emoji: '🏖️',
    label: 'Buon Ferragosto! 🏖️☀️',
    decos: ['🏖️','☀️','🌊','🍦','🌴','🕶️'],
    confetti: ['#1565C0','#F9A825','#BBDEFB','#FFF9C4','#29B6F6','#FFEE58'],
    match: (d) => d.month === 7 && d.day >= 14 && d.day <= 16,
  },
  {
    id: 'halloween',
    emoji: '🎃',
    label: 'Happy Halloween! 🎃👻',
    decos: ['🎃','👻','🦇','🕷️','🌙','💀'],
    confetti: ['#E65100','#6A1B9A','#FFD180','#CE93D8','#FF6D00','#9C27B0'],
    match: (d) => d.month === 9 && d.day >= 28,
  },
];

let activeHoliday = null;
let decoIntervals = [];

function getHoliday() {
  const now = new Date();
  const d = { month: now.getMonth(), day: now.getDate(), year: now.getFullYear() };
  return HOLIDAYS.find(h => h.match(d)) || null;
}

function applyHoliday() {
  // Clear previous decos
  decoIntervals.forEach(id => clearInterval(id));
  decoIntervals = [];
  document.querySelectorAll('.holiday-deco').forEach(el => el.remove());

  activeHoliday = getHoliday();
  const banner = document.getElementById('holiday-banner');
  const text   = document.getElementById('holiday-text');

  // Remove all holiday classes
  HOLIDAYS.forEach(h => document.body.classList.remove('holiday-' + h.id));

  if (!activeHoliday) {
    banner.classList.add('hidden');
    return;
  }

  document.body.classList.add('holiday-' + activeHoliday.id);
  text.textContent = activeHoliday.label;
  banner.classList.remove('hidden');

  // Floating decorations — spawn one every 2s, max 6 on screen
  let onScreen = 0;
  const spawnDeco = () => {
    if (onScreen >= 6) return;
    onScreen++;
    const el = document.createElement('span');
    el.className = 'holiday-deco';
    el.textContent = activeHoliday.decos[Math.floor(Math.random() * activeHoliday.decos.length)];
    el.style.left  = Math.random() * 90 + '%';
    el.style.top   = '-2rem';
    const dur = 6 + Math.random() * 6;
    el.style.animationDuration = dur + 's';
    el.style.fontSize = (0.9 + Math.random() * 0.8) + 'rem';
    document.body.appendChild(el);
    setTimeout(() => { el.remove(); onScreen--; }, dur * 1000);
  };
  decoIntervals.push(setInterval(spawnDeco, 2200));
  spawnDeco(); // first one immediately
}

// ============================================
//  PIN SCREEN
// ============================================
function initPin() {
  pinDigits.forEach((input, i) => {
    input.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.slice(-1);
      if (val && i < pinDigits.length - 1) pinDigits[i + 1].focus();
      checkPin();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && i > 0) pinDigits[i - 1].focus();
    });
  });
}

function checkPin() {
  const entered = [...pinDigits].map(d => d.value).join('');
  if (entered.length === 4) {
    if (entered === CORRECT_PIN) {
      unlockApp();
    } else {
      pinError.classList.remove('hidden');
      pinDigits.forEach(d => { d.value = ''; });
      pinDigits[0].focus();
      setTimeout(() => pinError.classList.add('hidden'), 2000);
    }
  }
}

function unlockApp() {
  sessionStorage.setItem('casadue_auth', '1');
  pinScreen.classList.add('hidden');
  mainApp.classList.remove('hidden');
  applySeasonTheme();
  initApp();
}

function lockApp() {
  sessionStorage.removeItem('casadue_auth');
  mainApp.classList.add('hidden');
  pinScreen.classList.remove('hidden');
  pinScreen.classList.add('active');
  pinDigits.forEach(d => d.value = '');
  pinDigits[0].focus();
}

// ============================================
//  APP INIT
// ============================================
async function initApp() {
  await loadLearnedKeywords();
  initCategoryGrids();
  initFormListeners();
  initNavigation();
  initDateDefault();
  await loadRecurringAlerts();
  await renderHome();
  checkAndGenerateRecurring();
}

function initDateDefault() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('f-date').value = today;
}

// ============================================
//  KEYWORDS (learned)
// ============================================
async function loadLearnedKeywords() {
  const { data } = await db.from('category_keywords').select('keyword, category');
  learnedKeywords = {};
  if (data) data.forEach(r => { learnedKeywords[r.keyword.toLowerCase()] = r.category; });
}

function detectCategory(desc) {
  const lower = desc.toLowerCase();
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (learnedKeywords[word]) return learnedKeywords[word];
  }
  for (const kw of Object.keys(learnedKeywords)) {
    if (lower.includes(kw)) return learnedKeywords[kw];
  }
  return null;
}

async function learnKeyword(keyword, category) {
  const kw = keyword.toLowerCase().trim();
  if (!kw || !category) return;
  await db.from('category_keywords').upsert({ keyword: kw, category }, { onConflict: 'keyword' });
  learnedKeywords[kw] = category;
}

// ============================================
//  CATEGORY GRIDS
// ============================================
function buildCategoryGrid(containerId, onSelect, defaultCat) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  CATEGORIES.filter(c => !c.hidden).forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cat-btn' + (cat.id === defaultCat ? ' active' : '');
    btn.dataset.cat = cat.id;
    btn.innerHTML = `<span class="cat-emoji">${cat.emoji}</span><span class="cat-name">${cat.label}</span>`;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onSelect(cat.id);
    });
    container.appendChild(btn);
  });
}

function initCategoryGrids() {
  buildCategoryGrid('category-grid', (id) => { selectedCategory = id; }, selectedCategory);
  buildCategoryGrid('rf-category-grid', (id) => { rfSelectedCategory = id; }, rfSelectedCategory);
}

function setCategoryInGrid(containerId, catId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === catId);
  });
}

// ============================================
//  SPLIT SYNC HELPER
// ============================================

// Given slider/pct-a/eur-a/eur-b IDs and the total-amount input ID,
// wires up full bidirectional sync: slider ↔ pct ↔ €
function initSplitSync(ids) {
  const { slider, pctA, pctB, eurA, eurB, totalId } = ids;

  const getTotal = () => parseFloat(document.getElementById(totalId)?.value) || 0;

  // Set all fields from a percentage for A (0-100, integer)
  function applyPct(pA, source) {
    const pB = 100 - pA;
    const total = getTotal();
    if (source !== 'slider') document.getElementById(slider).value = pA;
    if (source !== 'pctA')   document.getElementById(pctA).value  = pA;
    if (source !== 'pctB')   document.getElementById(pctB).value  = pB;
    if (total > 0) {
      if (source !== 'eurA') document.getElementById(eurA).value = (total * pA / 100).toFixed(2);
      if (source !== 'eurB') document.getElementById(eurB).value = (total * pB / 100).toFixed(2);
    }
  }

  // Slider moved
  document.getElementById(slider).addEventListener('input', () => {
    applyPct(parseInt(document.getElementById(slider).value), 'slider');
  });

  // pct-A typed
  document.getElementById(pctA).addEventListener('input', () => {
    let v = Math.min(100, Math.max(0, parseInt(document.getElementById(pctA).value) || 0));
    applyPct(v, 'pctA');
  });

  // pct-B typed
  document.getElementById(pctB).addEventListener('input', () => {
    let v = Math.min(100, Math.max(0, parseInt(document.getElementById(pctB).value) || 0));
    applyPct(100 - v, 'pctB');
  });

  // eur-A typed
  document.getElementById(eurA).addEventListener('input', () => {
    const total = getTotal();
    if (!total) return;
    const eA = Math.min(total, Math.max(0, parseFloat(document.getElementById(eurA).value) || 0));
    const pA = Math.round(eA / total * 100);
    document.getElementById(eurB).value = (total - eA).toFixed(2);
    applyPct(pA, 'eurA');
  });

  // eur-B typed
  document.getElementById(eurB).addEventListener('input', () => {
    const total = getTotal();
    if (!total) return;
    const eB = Math.min(total, Math.max(0, parseFloat(document.getElementById(eurB).value) || 0));
    const pA = Math.round((total - eB) / total * 100);
    document.getElementById(eurA).value = (total - eB).toFixed(2);
    applyPct(pA, 'eurB');
  });

  // When total amount changes, recalculate euro fields
  if (totalId) {
    document.getElementById(totalId)?.addEventListener('input', () => {
      applyPct(parseInt(document.getElementById(slider).value), 'total');
    });
  }
}

// ============================================
//  FORM LISTENERS
// ============================================
function initFormListeners() {
  // Payer toggle (expense form)
  document.querySelectorAll('#expense-form .payer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#expense-form .payer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPayer = btn.dataset.payer;
    });
  });

  // Payer toggle (recurring form)
  document.querySelectorAll('#recurring-form .payer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#recurring-form .payer-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rfSelectedPayer = btn.dataset.payer;
    });
  });

  // Split sync — expense form
  initSplitSync({ slider: 'f-split', pctA: 'f-pct-a', pctB: 'f-pct-b', eurA: 'f-eur-a', eurB: 'f-eur-b', totalId: 'f-amount' });

  // Split sync — recurring form
  initSplitSync({ slider: 'rf-split', pctA: 'rf-pct-a', pctB: 'rf-pct-b', eurA: 'rf-eur-a', eurB: 'rf-eur-b', totalId: 'rf-amount' });

  // Auto-detect category from description
  const descInput = document.getElementById('f-desc');
  descInput.addEventListener('input', () => {
    const detected = detectCategory(descInput.value);
    const preview = document.getElementById('category-preview');
    if (detected) {
      const cat = CATEGORIES.find(c => c.id === detected);
      preview.innerHTML = `${cat.emoji} Categoria: <strong>${cat.label}</strong>`;
      selectedCategory = detected;
      setCategoryInGrid('category-grid', detected);
    } else {
      preview.innerHTML = '';
    }
  });

  // Expense form submit
  document.getElementById('expense-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount   = parseFloat(document.getElementById('f-amount').value);
    const desc     = document.getElementById('f-desc').value.trim();
    const date     = document.getElementById('f-date').value;
    const splitVal = parseInt(document.getElementById('f-split').value);

    const expense = {
      amount,
      description: desc,
      date,
      paid_by: selectedPayer,
      category: selectedCategory,
      split_marco: splitVal,
      split_sara: 100 - splitVal,
    };

    const { data, error } = await db.from('expenses').insert(expense).select().single();
    if (error) { alert('Errore nel salvataggio: ' + error.message); return; }

    // Learn keyword from first word of description
    const firstWord = desc.split(/\s+/)[0];
    if (firstWord && firstWord.length > 2) {
      await learnKeyword(firstWord, selectedCategory);
    }

    showReceipt(data);
    document.getElementById('expense-form').reset();
    document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('f-split').value  = DEFAULT_SPLIT_A;
    document.getElementById('f-pct-a').value  = DEFAULT_SPLIT_A;
    document.getElementById('f-pct-b').value  = DEFAULT_SPLIT_B;
    document.getElementById('f-eur-a').value  = '';
    document.getElementById('f-eur-b').value  = '';
    selectedPayer = PERSON_A;
    selectedCategory = 'altro';
    document.querySelectorAll('#expense-form .payer-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
    setCategoryInGrid('category-grid', 'altro');
    document.getElementById('category-preview').innerHTML = '';

    viewMonth = new Date(date).getMonth();
    viewYear  = new Date(date).getFullYear();
    navigateTo('home');
    await renderHome(true); // allowConfetti: user just saved a real expense
  });

  // Recurring form
  document.getElementById('btn-add-recurring').addEventListener('click', () => {
    document.getElementById('recurring-modal').classList.remove('hidden');
  });
  document.getElementById('btn-cancel-recurring').addEventListener('click', () => {
    document.getElementById('recurring-modal').classList.add('hidden');
  });
  document.getElementById('recurring-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const desc    = document.getElementById('rf-desc').value.trim();
    const amount  = parseFloat(document.getElementById('rf-amount').value);
    const day     = parseInt(document.getElementById('rf-day').value);
    const splitVal = parseInt(document.getElementById('rf-split').value);

    const { error } = await db.from('recurring_expenses').insert({
      description: desc,
      amount,
      day_of_month: day,
      paid_by: rfSelectedPayer,
      category: rfSelectedCategory,
      split_marco: splitVal,
      split_sara: 100 - splitVal,
    });
    if (error) { alert('Errore: ' + error.message); return; }

    document.getElementById('recurring-modal').classList.add('hidden');
    document.getElementById('recurring-form').reset();
    await renderRecurring();
    await loadRecurringAlerts();
  });

  // Month navigation (home) — capped at current month
  document.getElementById('prev-month').addEventListener('click', () => {
    if (viewMonth === 0) { viewMonth = 11; viewYear--; }
    else viewMonth--;
    renderHome();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    const now = new Date();
    if (viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())) return;
    if (viewMonth === 11) { viewMonth = 0; viewYear++; }
    else viewMonth++;
    renderHome();
  });

  // Stats month navigation — capped at current month
  document.getElementById('stats-prev-month').addEventListener('click', () => {
    if (statsMonth === 0) { statsMonth = 11; statsYear--; }
    else statsMonth--;
    renderStats();
  });
  document.getElementById('stats-next-month').addEventListener('click', () => {
    const now = new Date();
    if (statsYear > now.getFullYear() || (statsYear === now.getFullYear() && statsMonth >= now.getMonth())) return;
    if (statsMonth === 11) { statsMonth = 0; statsYear++; }
    else statsMonth++;
    renderStats();
  });

  // Season toggle
  document.getElementById('btn-season-toggle').addEventListener('click', () => {
    seasonEnabled = !seasonEnabled;
    applySeasonTheme();
  });

  // Close "Aggiungi spesa" without saving
  document.getElementById('btn-close-add').addEventListener('click', () => navigateTo('home'));

  // Settle up
  document.getElementById('btn-settle').addEventListener('click', settleUp);

  // Logout
  document.getElementById('btn-logout').addEventListener('click', lockApp);
}

// ============================================
//  NAVIGATION
// ============================================
function initNavigation() {
  navItems.forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });
}

async function navigateTo(page) {
  currentPage = page;
  pages.forEach(p => p.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');

  if (page === 'home')      await renderHome();
  if (page === 'recurring') await renderRecurring();
  if (page === 'stats')     await renderStats();
}

// ============================================
//  HOME — expense list
// ============================================
async function renderHome(allowConfetti = false) {
  updateMonthLabel();
  const from = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
  const to   = new Date(viewYear, viewMonth + 1, 0).toISOString().split('T')[0];

  const { data: expenses } = await db.from('expenses')
    .select('*').gte('date', from).lte('date', to).order('date', { ascending: false });

  const list = document.getElementById('expenses-list');

  if (!expenses || expenses.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🧾</div><p>Nessuna spesa questo mese</p></div>`;
    updateBalance([]);
    return;
  }

  list.innerHTML = expenses.map(e => {
    const cat = CATEGORIES.find(c => c.id === e.category) || CATEGORIES.at(-1);
    const dateStr = new Date(e.date + 'T00:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    const payerLabel = e.paid_by === PERSON_A ? LABEL_A : LABEL_B;
    return `
      <div class="expense-card" data-id="${e.id}">
        <div class="expense-cat-icon">${cat.emoji}</div>
        <div class="expense-info">
          <div class="expense-desc">${e.description}</div>
          <div class="expense-meta">${dateStr} · ${cat.label} · ${payerLabel} (${e.paid_by === PERSON_A ? e.split_marco : e.split_sara}%)</div>
        </div>
        <div class="expense-right">
          <div class="expense-amount">€${parseFloat(e.amount).toFixed(2)}</div>
          <div class="expense-payer">pag. ${payerLabel}</div>
        </div>
        <button class="delete-btn" data-id="${e.id}" title="Elimina">🗑</button>
      </div>`;
  }).join('');

  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      if (!confirm('Eliminare questa spesa?')) return;
      await db.from('expenses').delete().eq('id', btn.dataset.id);
      await renderHome();
    });
  });

  updateBalance(expenses, allowConfetti);
}

function updateMonthLabel() {
  const label = new Date(viewYear, viewMonth, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  document.getElementById('month-label').textContent = label.charAt(0).toUpperCase() + label.slice(1);
  const now = new Date();
  document.getElementById('next-month').disabled =
    viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth());
}

// ============================================
//  BALANCE & SCALE
// ============================================
async function settleUp() {
  const btn = document.getElementById('btn-settle');
  const net = parseFloat(btn.dataset.net || '0');
  if (Math.abs(net) < 0.01) return;

  const debtor  = net > 0 ? LABEL_B : LABEL_A;
  const creditor = net > 0 ? LABEL_A : LABEL_B;
  const amount  = Math.abs(net).toFixed(2);

  if (!confirm(`${debtor} ha dato €${amount} a ${creditor}?\nViene registrato il pareggio.`)) return;

  const today = new Date().toISOString().split('T')[0];
  // The debtor pays an expense that's 100% the creditor's share → net goes to 0
  const paidBy     = net > 0 ? PERSON_B : PERSON_A;
  const splitMarco = net > 0 ? 100 : 0;
  const splitSara  = net > 0 ? 0   : 100;

  const { error } = await db.from('expenses').insert({
    amount: parseFloat(amount),
    description: 'Pareggio conti 🤝',
    date: today,
    paid_by: paidBy,
    category: 'saldo',
    split_marco: splitMarco,
    split_sara:  splitSara,
  });

  if (error) { alert('Errore: ' + error.message); return; }
  await renderHome(true);
}

function updateBalance(expenses, allowConfetti = false) {
  // For each expense, compute what Marco and Sara each owe
  // paid_by is who actually paid; split determines the share each should pay
  // If Marco paid 100 and split is 70/30:
  //   Marco advanced 100, his share is 70 → Sara owes Marco 30
  // Net: positive = Marco is in credit (Sara owes Marco), negative = Sara is in credit

  let net = 0; // positive → Sara owes Marco, negative → Marco owes Sara
  expenses.forEach(e => {
    const amt = parseFloat(e.amount);
    if (e.paid_by === PERSON_A) {
      // Marco paid; Sara's share = amt * sara_split/100
      net += amt * (e.split_sara / 100);
    } else {
      // Sara paid; Marco's share = amt * marco_split/100
      net -= amt * (e.split_marco / 100);
    }
  });

  const absNet = Math.abs(net);
  const balanceText = document.getElementById('balance-text');
  const beam = document.getElementById('scale-beam');
  const marcoCredit = document.getElementById('marco-credit');
  const saraCredit  = document.getElementById('sara-credit');
  const settleBtn = document.getElementById('btn-settle');
  settleBtn.dataset.net = net.toFixed(4);
  settleBtn.classList.toggle('hidden', absNet < 0.01 || expenses.length === 0);

  marcoCredit.textContent = `€${absNet > 0 && net > 0 ? absNet.toFixed(2) : '0.00'}`;
  saraCredit.textContent  = `€${absNet > 0 && net < 0 ? absNet.toFixed(2) : '0.00'}`;

  const reactions = absNet < 0.01
    ? REACTIONS.zero
    : net > 0 ? REACTIONS.sara_owes : REACTIONS.marco_owes;
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];

  if (absNet < 0.01) {
    balanceText.textContent = reaction;
    beam.className = 'scale-beam balanced';
    if (allowConfetti && expenses.length > 0) showConfetti();
  } else if (net > 0) {
    balanceText.textContent = `${LABEL_B} deve a ${LABEL_A} €${absNet.toFixed(2)} — ${reaction}`;
    beam.className = 'scale-beam tilt-left';
  } else {
    balanceText.textContent = `${LABEL_A} deve a ${LABEL_B} €${absNet.toFixed(2)} — ${reaction}`;
    beam.className = 'scale-beam tilt-right';
  }
}

// ============================================
//  RECURRING
// ============================================
async function renderRecurring() {
  const { data } = await db.from('recurring_expenses').select('*').order('day_of_month');
  const list = document.getElementById('recurring-list');
  if (!data || data.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔄</div><p>Nessuna spesa fissa</p></div>`;
    return;
  }
  list.innerHTML = data.map(r => {
    const cat = CATEGORIES.find(c => c.id === r.category) || CATEGORIES.at(-1);
    const payerLabel = r.paid_by === PERSON_A ? LABEL_A : LABEL_B;
    return `
      <div class="recurring-card${r.active ? '' : ' inactive'}" data-id="${r.id}">
        <div class="expense-cat-icon">${cat.emoji}</div>
        <div class="recurring-info">
          <div class="recurring-title">${r.description}</div>
          <div class="recurring-meta">€${parseFloat(r.amount).toFixed(2)} · ogni ${r.day_of_month}° · pag. ${payerLabel}</div>
        </div>
        <div class="recurring-actions">
          <button class="toggle-btn" data-id="${r.id}" data-active="${r.active}" title="${r.active ? 'Disattiva' : 'Attiva'}">${r.active ? '⏸' : '▶️'}</button>
          <button class="delete-recurring-btn" data-id="${r.id}" title="Elimina">🗑</button>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('.delete-recurring-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Eliminare?')) return;
      await db.from('recurring_expenses').delete().eq('id', btn.dataset.id);
      await renderRecurring();
    });
  });
  list.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newActive = btn.dataset.active === 'true' ? false : true;
      await db.from('recurring_expenses').update({ active: newActive }).eq('id', btn.dataset.id);
      await renderRecurring();
    });
  });
}

async function loadRecurringAlerts() {
  const { data } = await db.from('recurring_expenses').select('*').eq('active', true);
  const alerts = document.getElementById('recurring-alerts');
  if (!data || data.length === 0) { alerts.classList.add('hidden'); return; }

  const today = new Date();
  const todayDay = today.getDate();
  const upcoming = data.filter(r => {
    const diff = r.day_of_month - todayDay;
    return diff >= 0 && diff <= 5;
  });

  if (upcoming.length === 0) { alerts.classList.add('hidden'); return; }

  alerts.classList.remove('hidden');
  alerts.innerHTML = upcoming.map(r => {
    const diff = r.day_of_month - todayDay;
    const badge = diff === 0 ? 'Oggi!' : `in ${diff}g`;
    return `
      <div class="recurring-alert">
        <span>${r.description} — €${parseFloat(r.amount).toFixed(2)}</span>
        <span class="days-badge">${badge}</span>
      </div>`;
  }).join('');
}

async function checkAndGenerateRecurring() {
  const { data: recurrings } = await db.from('recurring_expenses').select('*').eq('active', true);
  if (!recurrings) return;

  const now = new Date();
  const thisYear  = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const from = `${thisYear}-${String(thisMonth).padStart(2, '0')}-01`;
  const to   = `${thisYear}-${String(thisMonth).padStart(2, '0')}-${new Date(thisYear, thisMonth, 0).getDate()}`;

  const { data: existing } = await db.from('expenses')
    .select('recurring_id').eq('is_recurring_instance', true).gte('date', from).lte('date', to);

  const existingIds = new Set((existing || []).map(e => e.recurring_id));

  for (const r of recurrings) {
    if (existingIds.has(r.id)) continue;
    const day = Math.min(r.day_of_month, new Date(thisYear, thisMonth, 0).getDate());
    const date = `${thisYear}-${String(thisMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await db.from('expenses').insert({
      amount: r.amount,
      description: r.description,
      date,
      paid_by: r.paid_by,
      category: r.category,
      split_marco: r.split_marco,
      split_sara: r.split_sara,
      is_recurring_instance: true,
      recurring_id: r.id,
    });
  }
}

// ============================================
//  STATS
// ============================================
async function renderStats() {
  updateStatsMonthLabel();
  const from = `${statsYear}-${String(statsMonth + 1).padStart(2, '0')}-01`;
  const to   = new Date(statsYear, statsMonth + 1, 0).toISOString().split('T')[0];

  const { data: expenses } = await db.from('expenses').select('*').gte('date', from).lte('date', to);

  // Last 6 months data
  const monthlyTotals = [];
  for (let i = 5; i >= 0; i--) {
    let m = statsMonth - i;
    let y = statsYear;
    while (m < 0) { m += 12; y--; }
    const mFrom = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const mTo   = new Date(y, m + 1, 0).toISOString().split('T')[0];
    const { data: mData } = await db.from('expenses').select('amount').gte('date', mFrom).lte('date', mTo);
    const total = (mData || []).reduce((s, e) => s + parseFloat(e.amount), 0);
    const label = new Date(y, m, 1).toLocaleDateString('it-IT', { month: 'short' });
    monthlyTotals.push({ label, total, month: m, year: y });
  }

  const content = document.getElementById('stats-content');
  const exps = expenses || [];

  // By category
  const byCat = {};
  exps.forEach(e => {
    byCat[e.category] = (byCat[e.category] || 0) + parseFloat(e.amount);
  });
  const catEntries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const totalSpent = exps.reduce((s, e) => s + parseFloat(e.amount), 0);

  // Marco vs Sara advanced
  let marcoAdv = 0, saraAdv = 0;
  exps.forEach(e => {
    if (e.paid_by === PERSON_A) marcoAdv += parseFloat(e.amount);
    else saraAdv += parseFloat(e.amount);
  });

  const maxMonthly = Math.max(...monthlyTotals.map(m => m.total), 1);
  const topCat = catEntries[0];
  const topCatObj = topCat ? CATEGORIES.find(c => c.id === topCat[0]) || CATEGORIES.at(-1) : null;

  // Donut colors
  const DONUT_COLORS = ['#E8629A','#6BBF8E','#F4844B','#4BADE0','#9B84BE','#F4C842','#5BC0EB','#C0623A','#8B6B4A','#4CAF50','#FF7043','#78909C'];

  content.innerHTML = `
    <!-- Monthly trend -->
    <div class="stat-card">
      <h3>📈 Andamento ultimi 6 mesi</h3>
      <div class="bar-chart">
        ${monthlyTotals.map((m, i) => `
          <div class="bar-row">
            <span class="bar-label">${m.label}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:${m.total === 0 ? 0 : Math.max(8, (m.total / maxMonthly) * 100)}%">
                <span class="bar-value">${m.total > 0 ? '€' + m.total.toFixed(0) : ''}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Top category -->
    ${topCatObj ? `
    <div class="top-category-card">
      <div class="top-cat-icon">${topCatObj.emoji}</div>
      <div class="top-cat-text">
        <h4>Categoria top del mese</h4>
        <p>${topCatObj.label} — €${topCat[1].toFixed(2)}</p>
      </div>
    </div>` : ''}

    <!-- Donut by category -->
    <div class="stat-card">
      <h3>🍩 Spese per categoria</h3>
      ${catEntries.length === 0 ? '<p style="color:var(--c-text-soft);font-weight:700">Nessuna spesa</p>' : `
      <div class="donut-wrap">
        <div class="donut-svg-wrap">
          ${buildDonut(catEntries, totalSpent, DONUT_COLORS)}
        </div>
        <div class="donut-legend">
          ${catEntries.map((e, i) => {
            const cat = CATEGORIES.find(c => c.id === e[0]) || CATEGORIES.at(-1);
            return `<div class="legend-item"><span class="legend-dot" style="background:${DONUT_COLORS[i % DONUT_COLORS.length]}"></span>${cat.emoji} ${cat.label} <strong>€${e[1].toFixed(0)}</strong></div>`;
          }).join('')}
        </div>
      </div>`}
    </div>

    <!-- Who paid more -->
    <div class="stat-card">
      <h3>💳 Chi ha anticipato di più</h3>
      <div class="comparison-row">
        <div class="comparison-label">
          <span>${LABEL_A} ${marcoAdv > 0 ? '€' + marcoAdv.toFixed(2) : '€0'}</span>
          <span>${LABEL_B} ${saraAdv > 0 ? '€' + saraAdv.toFixed(2) : '€0'}</span>
        </div>
        <div class="comparison-track">
          <div class="comparison-fill" style="width:${totalSpent > 0 ? (marcoAdv/totalSpent*100).toFixed(1) : 50}%;background:var(--c-primary)"></div>
        </div>
      </div>
      <p style="font-size:0.8rem;color:var(--c-text-soft);font-weight:700;margin-top:0.5rem">
        Totale mese: €${totalSpent.toFixed(2)}
      </p>
    </div>

    <!-- Postcard export -->
    <button class="postcard-btn" id="btn-postcard">🖼 Genera cartolina del mese</button>
  `;

  document.getElementById('btn-postcard').addEventListener('click', () => generatePostcard(exps, catEntries, totalSpent, marcoAdv, saraAdv));
}

function updateStatsMonthLabel() {
  const label = new Date(statsYear, statsMonth, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  document.getElementById('stats-month-label').textContent = label.charAt(0).toUpperCase() + label.slice(1);
  const now = new Date();
  document.getElementById('stats-next-month').disabled =
    statsYear > now.getFullYear() || (statsYear === now.getFullYear() && statsMonth >= now.getMonth());
}

function buildDonut(catEntries, total, colors) {
  if (total === 0) return '<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="45" fill="none" stroke="#eee" stroke-width="20"/></svg>';
  const r = 45, cx = 60, cy = 60, circum = 2 * Math.PI * r;
  let offset = 0;
  const slices = catEntries.map((e, i) => {
    const pct = e[1] / total;
    const dash = pct * circum;
    const gap  = circum - dash;
    const slice = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${colors[i % colors.length]}" stroke-width="20"
      stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
      stroke-dashoffset="${(-offset * circum).toFixed(2)}"
      transform="rotate(-90 ${cx} ${cy})" />`;
    offset += pct;
    return slice;
  });
  return `<svg width="120" height="120" viewBox="0 0 120 120">${slices.join('')}</svg>`;
}

// ============================================
//  POSTCARD GENERATOR
// ============================================
function generatePostcard(expenses, catEntries, totalSpent, marcoAdv, saraAdv) {
  const now = new Date(statsYear, statsMonth, 1);
  const monthStr = now.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  const overlay = document.createElement('div');
  overlay.className = 'postcard-overlay';

  const canvas = document.createElement('canvas');
  canvas.width  = 680;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 680, 400);
  const season = getSeason(statsMonth);
  const gradColors = {
    spring: ['#F9C4DB', '#C2E8D2'],
    summer: ['#FFD4BA', '#C0E4F8'],
    autumn: ['#F0C4A8', '#E0D0BC'],
    winter: ['#BACFE8', '#DDD4F0'],
  };
  grad.addColorStop(0, gradColors[season][0]);
  grad.addColorStop(1, gradColors[season][1]);
  ctx.fillStyle = grad;
  ctx.roundRect(0, 0, 680, 400, 20);
  ctx.fill();

  // Title
  ctx.fillStyle = '#333';
  ctx.font = 'bold 28px serif';
  ctx.fillText('🏠 CasaDue', 36, 52);

  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#555';
  ctx.fillText(monthStr.charAt(0).toUpperCase() + monthStr.slice(1), 36, 80);

  // Total
  ctx.font = 'bold 48px serif';
  ctx.fillStyle = '#222';
  ctx.fillText(`€${totalSpent.toFixed(2)}`, 36, 145);

  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#666';
  ctx.fillText('spesa totale del mese', 36, 168);

  // Marco vs Sara
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#333';
  ctx.fillText(`${LABEL_A}: €${marcoAdv.toFixed(2)}  ·  ${LABEL_B}: €${saraAdv.toFixed(2)}`, 36, 210);

  // Top categories
  const topThree = catEntries.slice(0, 3);
  topThree.forEach((e, i) => {
    const cat = CATEGORIES.find(c => c.id === e[0]) || CATEGORIES.at(-1);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#444';
    ctx.fillText(`${cat.emoji} ${cat.label}: €${e[1].toFixed(2)}`, 36, 245 + i * 26);
  });

  // Footer
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText('casadue.app • generato il ' + new Date().toLocaleDateString('it-IT'), 36, 375);

  // Buttons
  const btns = document.createElement('div');
  btns.className = 'postcard-btns';
  btns.innerHTML = `
    <button id="dl-postcard">⬇️ Scarica</button>
    <button id="close-postcard">✕ Chiudi</button>
  `;

  overlay.appendChild(canvas);
  overlay.appendChild(btns);
  document.body.appendChild(overlay);

  btns.querySelector('#dl-postcard').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `casadue-${statsYear}-${statsMonth + 1}.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
  btns.querySelector('#close-postcard').addEventListener('click', () => overlay.remove());
}

// ============================================
//  RECEIPT ANIMATION
// ============================================
function showReceipt(expense) {
  const cat = CATEGORIES.find(c => c.id === expense.category) || CATEGORIES.at(-1);
  document.getElementById('receipt-icon').textContent   = cat.emoji;
  document.getElementById('receipt-desc').textContent   = expense.description;
  document.getElementById('receipt-amount').textContent = `€${parseFloat(expense.amount).toFixed(2)}`;

  const overlay = document.getElementById('receipt-overlay');
  overlay.classList.remove('hidden');

  // Animate the icon
  const icon = document.getElementById('receipt-icon');
  icon.style.animation = 'none';
  void icon.offsetWidth;
  icon.style.animation = 'pop-in 0.4s 0.2s both cubic-bezier(0.34, 1.56, 0.64, 1)';

  setTimeout(() => overlay.classList.add('hidden'), 2200);
  overlay.addEventListener('click', () => overlay.classList.add('hidden'), { once: true });
}

// ============================================
//  CONFETTI
// ============================================
let confettiAnimId = null;
function showConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  canvas.classList.remove('hidden');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const confettiColors = activeHoliday
    ? activeHoliday.confetti
    : ['#E8629A','#6BBF8E','#F4844B','#4BADE0','#F4C842'];
  const pieces = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    r: Math.random() * 8 + 4,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    speed: Math.random() * 3 + 2,
    swing: Math.random() * 3 - 1.5,
    rot: Math.random() * 360,
    rotSpeed: Math.random() * 6 - 3,
  }));

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.speed;
      p.x += p.swing;
      p.rot += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.5);
      ctx.restore();
    });
    frame++;
    if (frame < 120) {
      confettiAnimId = requestAnimationFrame(animate);
    } else {
      canvas.classList.add('hidden');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
  animate();
}

// ============================================
//  ENTRY POINT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  applySeasonTheme();
  initPin();

  // Auto-login if session active
  if (sessionStorage.getItem('casadue_auth') === '1') {
    unlockApp();
  } else {
    pinDigits[0].focus();
  }
});
