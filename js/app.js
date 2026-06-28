const state = {
  currentView: null,
  user: null,
  userType: null,
  activeUnitPref: 'metric',
  leaderboard: [],
  participantData: null,
  weightHistory: [],
  chartInstances: {}
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const STORAGE_KEY = 'km_session';

const ACTIVITIES = [
  { id: 'correr', label: 'Correr', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M10 10l-2 8 3-1 1-4 3 2 2-6"/></svg>' },
  { id: 'caminar', label: 'Caminar', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><path d="M9 9l1 8 3-1 2 4"/></svg>' },
  { id: 'pesas', label: 'Pesas', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="3" height="8" rx="1"/><rect x="17" y="8" width="3" height="8" rx="1"/><line x1="7" y1="12" x2="17" y2="12"/></svg>' },
  { id: 'yoga', label: 'Yoga', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 6v6l-5 8"/><path d="M17 20l-5-8"/></svg>' },
  { id: 'bici', label: 'Bici', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="16" r="3"/><circle cx="18" cy="16" r="3"/><path d="M6 13l4-4 2 1 3-2 2 5"/></svg>' },
  { id: 'nadar', label: 'Nadar', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="5" r="2"/><path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></svg>' },
  { id: 'deporte', label: 'Deporte', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><path d="M5 12h14M12 5a8 8 0 0 1 3 6 8 8 0 0 1-3 6 8 8 0 0 1-3-6 8 8 0 0 1 3-6"/></svg>' },
  { id: 'hogar', label: 'Hogar', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h3l2-9 2 9h10"/><path d="M8 20h8"/><path d="M10 12l1 8"/><path d="M14 12l-1 8"/></svg>' }
];

function getLocalDate() {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function saveSession() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    user: state.user,
    userType: state.userType,
    activeUnitPref: state.activeUnitPref
  }));
}

function loadSession() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && data.user && data.userType) {
      state.user = data.user;
      state.userType = data.userType;
      state.activeUnitPref = data.activeUnitPref || 'metric';
      return true;
    }
  } catch(_) {}
  return false;
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function showToast(message, type = 'info') {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ════════════════════════════════════════════
// VIEW ROUTER
// ════════════════════════════════════════════

function showView(viewId) {
  $$('.view').forEach(v => v.classList.add('hidden'));
  const view = $(`#view-${viewId}`);
  if (view) view.classList.remove('hidden');
  state.currentView = viewId;

  const isLoggedIn = state.user && (viewId === 'home' || viewId === 'leaderboard' || viewId === 'stats' || viewId === 'checkin' || viewId === 'info');
  const navbar = $('#navbar');
  const bottomNav = $('#bottom-nav');

  if (viewId === 'admin') {
    navbar.classList.remove('hidden');
    bottomNav.classList.add('hidden');
    document.body.classList.add('no-bottom-nav');
    $('#nav-username').textContent = 'Admin';
    updateUnitToggle();
  } else if (isLoggedIn) {
    navbar.classList.remove('hidden');
    bottomNav.classList.remove('hidden');
    document.body.classList.remove('no-bottom-nav');
    $('#nav-username').textContent = state.user?.nickname || '';
    updateUnitToggle();
  } else {
    navbar.classList.add('hidden');
    bottomNav.classList.add('hidden');
    document.body.classList.add('no-bottom-nav');
  }

  // Update bottom nav active
  $$('#bottom-nav .nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getUnitPref() {
  return state.activeUnitPref;
}

// ════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════

async function checkInitialSetup() {
  try {
    const exists = await checkAdminExists();
    if (!exists) showView('admin-setup');
    else showView('login');
  } catch (e) {
    showToast('Error conectando con Supabase', 'error');
  }
}

async function handleAdminSetup(e) {
  e.preventDefault();
  const username = $('#setup-username').value.trim();
  const password = $('#setup-password').value;
  const confirm = $('#setup-confirm').value;
  if (!username || !password) { showToast('Completa todos los campos', 'error'); return; }
  if (password !== confirm) { showToast('Las contraseñas no coinciden', 'error'); return; }
  if (password.length < 4) { showToast('Mínimo 4 caracteres', 'error'); return; }
  const btn = $('#setup-btn');
  btn.disabled = true; btn.textContent = 'Creando...';
  try {
    await createAdmin(username, password);
    showToast('Admin creado', 'success');
    showView('login');
  } catch (e) {
    showToast(e.message || 'Error', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Crear Admin';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const isAdmin = $('#login-tab-admin').classList.contains('active');
  const username = $('#login-username').value.trim();
  const password = $('#login-password').value;
  if (!username || !password) { showToast('Ingresa usuario y contraseña', 'error'); return; }
  const btn = $('#login-btn');
  btn.disabled = true; btn.textContent = 'Ingresando...';
  try {
    if (isAdmin) {
      const user = await adminLogin(username, password);
      state.user = user; state.userType = 'admin';
      saveSession();
      showView('admin');
      switchAdminView('participants');
      await renderAdminPanel();
      showToast('Bienvenido Admin', 'success');
    } else {
      const user = await participantLogin(username, password);
      state.user = user; state.userType = 'participant';
      state.activeUnitPref = user.unit_preference;
      saveSession();
      updateUnitToggle();
      showView('home');
      await renderHome();
      showToast(`Bienvenido ${user.nickname}!`, 'success');
    }
  } catch (e) {
    showToast(e.message || 'Error', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = isAdmin ? 'Ingresar como Admin' : 'Ingresar';
  }
}


function handleLogout() {
  Object.values(state.chartInstances).forEach(c => { try { c.destroy(); } catch(_) {} });
  state.chartInstances = {};
  state.user = null; state.userType = null;
  state.leaderboard = []; state.participantData = null; state.weightHistory = [];
  clearSession();
  showView('login');
  const banner = $('#report-banner');
  if (banner) banner.classList.add('hidden');
  showToast('Sesión cerrada', 'info');
}

// ════════════════════════════════════════════
// HOME
// ════════════════════════════════════════════

async function renderHome() {
  if (!state.user || state.userType !== 'participant') return;
  const p = state.user;
  const up = getUnitPref();
  const entries = await getWeightEntries(p.id);
  const currentLbs = entries.length > 0 ? entries[0].weight_lbs : p.starting_weight_lbs;
  const prevLbs = entries.length > 1 ? entries[1].weight_lbs : p.starting_weight_lbs;
  const idealLbs = CALC.idealWeight(p.sex, p.height_cm);
  const pctLost = CALC.percentLost(p.starting_weight_lbs, currentLbs);
  const bmi = CALC.bmi(currentLbs, p.height_cm);
  const bmiCat = CALC.bmiCategory(bmi);
  const tdee = CALC.tdee(p.sex, currentLbs, p.height_cm, p.age, p.activity_level);
  const progress = CALC.progressToIdeal(p.starting_weight_lbs, currentLbs, idealLbs);
  const change = CALC.weightChange(prevLbs, currentLbs);

  state.participantData = { currentLbs, prevLbs, idealLbs, pctLost, bmi, bmiCat, tdee, progress, change };
  state.weightHistory = entries;

  $('#home-welcome').textContent = `Hola ${p.nickname}!`;
  $('#home-subtitle').textContent = entries.length > 0
    ? `${entries.length} reportes · ${CALC.formatWeight(currentLbs, up)} actual`
    : '¡Registra tu primer reporte!';

  const changeEl = $('#home-change');
  if (entries.length > 1) {
    const absC = Math.abs(change);
    const cLabel = CALC.formatWeight(absC, up);
    if (change < 0) { changeEl.className = 'change-banner down'; changeEl.textContent = `${cLabel} menos desde el último reporte`; }
    else if (change > 0) { changeEl.className = 'change-banner up'; changeEl.textContent = `${cLabel} más desde el último reporte`; }
    else { changeEl.className = 'change-banner flat'; changeEl.textContent = 'Sin cambios'; }
  } else {
    changeEl.className = 'change-banner first';
    changeEl.textContent = 'Primer reporte! Regístrate cada semana.';
  }

  // Stats
  $('#hstat-weight').textContent = CALC.formatWeightShort(currentLbs, up);
  $('#hstat-weight').closest('.stat-pill').querySelector('.lbl').textContent = up === 'metric' ? 'Peso (kg)' : 'Peso (lbs)';
  $('#hstat-lost').textContent = CALC.formatPercent(pctLost);
  $('#hstat-bmi').textContent = bmi.toFixed(1);
  $('#hstat-tdee').textContent = tdee.toLocaleString();

  // Progress
  const pctColor = progress < 0 ? '#ef4444' : progress < 25 ? '#f97316' : progress < 50 ? '#eab308' : progress < 75 ? '#22c55e' : '#16a34a';
  $('#home-progress-label').textContent = `${progress.toFixed(0)}%`;
  $('#home-progress-label').style.color = pctColor;
  const fill = $('#home-progress-fill');
  fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  fill.style.background = pctColor;
  if (entries.length > 0) {
    const diffToIdeal = Math.abs(currentLbs - idealLbs);
    const dir = currentLbs > idealLbs ? 'perder' : 'ganar';
    const remain = CALC.formatWeight(diffToIdeal, up) + ' ' + (up === 'metric' ? 'kg' : 'lbs');
    if (diffToIdeal < 1) $('#home-progress-sub').textContent = '¡Peso ideal alcanzado!';
    else $('#home-progress-sub').textContent = `Te faltan ${remain} por ${dir}`;
  } else {
    $('#home-progress-sub').textContent = 'Registra tu primer reporte';
  }

  // BMI card
  const bmiVal = bmi.toFixed(1);
  const bmiBg = { bajo: '#fbbf24', normal: '#22c55e', sobrepeso: '#f97316', obesidad: '#ef4444' };
  const catKey = bmiCat.label.toLowerCase().includes('normal') ? 'normal'
    : bmiCat.label.toLowerCase().includes('bajo') ? 'bajo'
    : bmiCat.label.toLowerCase().includes('sobrepeso') ? 'sobrepeso' : 'obesidad';
  const catColor = bmiBg[catKey] || '#f97316';
  $('#home-bmi-value').textContent = bmiVal;
  $('#home-bmi-badge').textContent = bmiCat.label;
  $('#home-bmi-badge').style.background = catColor;
  $('#home-bmi-badge').style.color = '#fff';
  const bmiPct = Math.min(Math.max((bmi / 40) * 100, 2), 98);
  $('#home-bmi-marker').style.left = bmiPct + '%';

  // Mini leaderboard (top 3)
  await renderMiniLeaderboard(p.id);

  // Next check-in
  const lastDate = entries.length > 0 ? new Date(entries[0].date + 'T12:00:00') : null;
  const now = new Date();
  if (lastDate) {
    const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    const daysUntilNext = 7 - daysSince;
    if (daysSince === 0) $('#home-next-checkin').textContent = 'Ya te reportaste hoy';
    else if (daysSince < 7) $('#home-next-checkin').textContent = `Próximo reporte en ${daysUntilNext} día${daysUntilNext === 1 ? '' : 's'}`;
    else $('#home-next-checkin').textContent = 'Reportate! Han pasado más de 7 días.';
  } else {
    $('#home-next-checkin').textContent = 'Registra tu primer reporte!';
  }

  updateReportBanner(entries);
}

// ─── Report Banner ───

async function updateReportBanner(entries) {
  const banner = $('#report-banner');
  if (!banner) return;
  if (!state.user || state.userType !== 'participant') { banner.classList.add('hidden'); return; }
  if (!entries) entries = state.weightHistory;
  if (!entries.length && state.user) {
    try { entries = await getWeightEntries(state.user.id); state.weightHistory = entries; } catch (_) {}
  }
  const needsReport = entries.length === 0 || (() => {
    const lastDate = new Date(entries[0].date + 'T12:00:00');
    const now = new Date();
    return Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)) >= 7;
  })();
  banner.classList.toggle('hidden', !needsReport);
  $('#report-banner-text').textContent = entries.length === 0
    ? '¡Registra tu primer reporte semanal!'
    : '¡Te toca reportarte esta semana!';
}

async function renderMiniLeaderboard(currentId) {
  try {
    const data = await getLeaderboardData();
    state.leaderboard = data;
    const container = $('#home-mini-lb');
    container.innerHTML = '';
    const top = data.slice(0, 3);
    if (top.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:0.75rem"><p>Sin participantes</p></div>';
      return;
    }
    const ranks = ['1', '2', '3'];
    const rankClasses = ['gold', 'silver', 'bronze'];
    top.forEach((entry, i) => {
      const div = document.createElement('div');
      div.className = 'lb-item';
      div.innerHTML = `
        <span class="lb-rank rank-badge ${rankClasses[i]}">${ranks[i]}</span>
        <span class="lb-name">${entry.nickname}${entry.id === currentId ? ' (tu)' : ''}</span>
        <div class="lb-bar"><div class="lb-fill" style="width:${Math.abs(entry.percentLost) / Math.abs(top[0]?.percentLost || 1) * 100}%"></div></div>
        <span class="lb-pct ${entry.percentLost > 0 ? 'good' : 'bad'}">${CALC.formatPercent(entry.percentLost)}</span>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    $('#home-mini-lb').innerHTML = '<div class="empty-state" style="padding:0.75rem"><p>Error</p></div>';
  }
}

// ════════════════════════════════════════════
// LEADERBOARD
// ════════════════════════════════════════════

async function renderLeaderboard() {
  try {
    const data = state.leaderboard.length ? state.leaderboard : await getLeaderboardData();
    state.leaderboard = data;
    const currentId = state.user?.id;
    const up = getUnitPref();

    // Hero
    const hero = $('#ranking-hero');
    if (data.length > 0) {
      const top = data[0];
      const bmi = CALC.bmi(top.currentWeightLbs, top.heightCm);
      hero.querySelector('.hero-rank').textContent = '1';
      hero.querySelector('.hero-name').textContent = top.nickname;
      hero.querySelector('.hero-pct').textContent = CALC.formatPercent(top.percentLost);
      hero.querySelector('.hero-detail').textContent =
        `${CALC.formatWeight(top.startingWeightLbs, up)} → ${CALC.formatWeight(top.currentWeightLbs, up)} · ${top.entriesCount} reportes`;
    } else {
      hero.querySelector('.hero-rank').textContent = '—';
      hero.querySelector('.hero-name').textContent = 'Esperando participantes...';
      hero.querySelector('.hero-pct').textContent = '';
      hero.querySelector('.hero-detail').textContent = 'Registra tu primer peso';
    }

    // List
    const list = $('#ranking-list');
    list.innerHTML = '';
    if (data.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>Nadie registrado aún</p></div>';
      return;
    }

    let rank = 0;
    let prevPct = Infinity;
    const rankClasses = ['gold', 'silver', 'bronze'];

    data.forEach((entry) => {
      if (entry.percentLost < prevPct) rank++;
      prevPct = entry.percentLost;
      const isYou = entry.id === currentId;
      const lbsLost = entry.startingWeightLbs - entry.currentWeightLbs;
      const rankDisplay = rank <= 3
        ? `<span class="rank-badge ${rankClasses[rank - 1]}">#${rank}</span>`
        : `<span class="rank-badge">#${rank}</span>`;

      const div = document.createElement('div');
      div.className = `ranking-item${isYou ? ' is-you' : ''}`;
      div.innerHTML = `
        <div class="r-rank">${rankDisplay}</div>
        <div class="r-avatar">${getAvatar(entry.nickname)}</div>
        <div class="r-info">
          <div class="r-name">${entry.nickname}${isYou ? ' <span class="tag">TÚ</span>' : ''}</div>
          <div class="r-detail">
            ${CALC.formatWeight(entry.startingWeightLbs, up)} →
            ${CALC.formatWeight(entry.currentWeightLbs, up)}
            ${lbsLost > 0 ? ` · ${CALC.formatWeight(lbsLost, up)} perdidos` : ''}
            · BMI ${entry.bmi.toFixed(1)}
          </div>
        </div>
        <div class="r-side">
          <div class="r-pct ${entry.percentLost > 0 ? 'good' : 'bad'}">${CALC.formatPercent(entry.percentLost)}</div>
          <div class="r-sub">${entry.entriesCount} reportes</div>
        </div>
      `;
      list.appendChild(div);
    });
  } catch (e) {
    console.error('Ranking error:', e);
    $('#ranking-list').innerHTML = '<div class="empty-state"><p>Error al cargar</p></div>';
  }
}

// ════════════════════════════════════════════
// STATS
// ════════════════════════════════════════════

function safeDestroy(id) {
  if (state.chartInstances[id]) { state.chartInstances[id].destroy(); delete state.chartInstances[id]; }
}

function renderStats() {
  if (!state.user || state.userType !== 'participant') return;
  const p = state.user;
  const up = getUnitPref();
  const pd = state.participantData;
  const entries = state.weightHistory;

  // ─── Chart: Personal weight ───
  safeDestroy('chart-weight');
  const dates = entries.map(e => CALC.formatDate(e.date)).reverse();
  const weights = entries.map(e => up === 'metric' ? CALC.lbsToKg(e.weight_lbs) : e.weight_lbs).reverse();
  const unitLbl = up === 'metric' ? 'kg' : 'lbs';
  if (entries.length >= 2) {
    state.chartInstances['chart-weight'] = new Chart($('#chart-weight'), {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: `Peso (${unitLbl})`,
          data: weights,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249,115,22,0.08)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#f97316',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 } } },
          y: { ticks: { font: { size: 10 } } }
        }
      }
    });
  } else {
    $('#chart-weight').parentNode.innerHTML = '<div class="empty-state" style="padding:0.5rem"><p>Se necesitan al menos 2 registros</p></div>';
  }

  // ─── Chart: Group % Lost ───
  safeDestroy('chart-group');
  if (state.leaderboard.length > 0) {
    const sorted = [...state.leaderboard].sort((a, b) => b.percentLost - a.percentLost);
    state.chartInstances['chart-group'] = new Chart($('#chart-group'), {
      type: 'bar',
      data: {
        labels: sorted.map(e => e.nickname),
        datasets: [{
          label: '% Perdido',
          data: sorted.map(e => Math.abs(e.percentLost)),
          backgroundColor: sorted.map(e =>
            e.id === state.user?.id ? '#e11d48' : '#fb923c'
          ),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const entry = sorted[ctx.dataIndex];
                return `${CALC.formatWeight(entry.startingWeightLbs, up)} → ${CALC.formatWeight(entry.currentWeightLbs, up)}`;
              }
            }
          }
        },
        scales: {
          x: { ticks: { font: { size: 10 }, callback: v => v + '%' } },
          y: { ticks: { font: { size: 11 } } }
        }
      }
    });
  } else {
    $('#chart-group').parentNode.innerHTML = '<div class="empty-state" style="padding:0.5rem"><p>Esperando datos del grupo</p></div>';
  }

  // ─── Chart: BMI ───
  safeDestroy('chart-bmi');
  if (entries.length >= 2) {
    const bmiValues = entries.map(e => CALC.bmi(e.weight_lbs, p.height_cm)).reverse();
    state.chartInstances['chart-bmi'] = new Chart($('#chart-bmi'), {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'BMI',
          data: bmiValues,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168,85,247,0.08)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#a855f7',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 } } },
          y: { ticks: { font: { size: 10 } } }
        }
      }
    });
  } else {
    $('#chart-bmi').parentNode.innerHTML = '<div class="empty-state" style="padding:0.5rem"><p>Se necesitan al menos 2 registros</p></div>';
  }

  // ─── Chart: Weekly change ───
  safeDestroy('chart-weekly');
  if (entries.length >= 2) {
    const weeklyChanges = [];
    const weeklyLabels = [];
    for (let i = entries.length - 1; i > 0; i--) {
      const diff = entries[i - 1].weight_lbs - entries[i].weight_lbs;
      weeklyChanges.push(up === 'metric' ? CALC.lbsToKg(diff) : diff);
      weeklyLabels.push(CALC.formatDate(entries[i].date));
    }
    state.chartInstances['chart-weekly'] = new Chart($('#chart-weekly'), {
      type: 'bar',
      data: {
        labels: weeklyLabels,
        datasets: [{
          label: `Cambio (${unitLbl})`,
          data: weeklyChanges,
          backgroundColor: weeklyChanges.map(v => v <= 0 ? '#22c55e' : '#f43f5e'),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw;
                const dir = v <= 0 ? 'perdido' : 'ganado';
                return `${Math.abs(v).toFixed(1)} ${unitLbl} ${dir}`;
              }
            }
          }
        },
        scales: {
          x: { ticks: { font: { size: 9 } } },
          y: { ticks: { font: { size: 9 }, callback: v => Math.abs(v).toFixed(1) + unitLbl } }
        }
      }
    });
  } else {
    $('#chart-weekly').parentNode.innerHTML = '<div class="empty-state" style="padding:0.5rem"><p>Se necesitan al menos 2 registros</p></div>';
  }

  // ─── Chart: Waist circumference ───
  safeDestroy('chart-waist');
  const waistEntries = entries.filter(e => e.waist_cm).reverse();
  if (waistEntries.length >= 2) {
    $('#card-chart-waist').style.display = '';
    state.chartInstances['chart-waist'] = new Chart($('#chart-waist'), {
      type: 'line',
      data: {
        labels: waistEntries.map(e => CALC.formatDate(e.date)),
        datasets: [{
          label: 'Cintura (cm)',
          data: waistEntries.map(e => e.waist_cm),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6,182,212,0.08)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#06b6d4',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { font: { size: 10 } } },
          y: { ticks: { font: { size: 10 } } }
        }
      }
    });
  } else {
    $('#card-chart-waist').style.display = 'none';
  }
}

// ════════════════════════════════════════════
// INFO (Guías)
// ════════════════════════════════════════════

async function renderInfo() {
  if (!state.user || state.userType !== 'participant') return;
  const p = state.user;
  let pd = state.participantData;
  let entries = state.weightHistory;
  if (!pd || !entries.length) {
    entries = await getWeightEntries(p.id);
    state.weightHistory = entries;
    const currentLbs = entries.length > 0 ? entries[0].weight_lbs : p.starting_weight_lbs;
    const bmi = CALC.bmi(currentLbs, p.height_cm);
    const bmiCat = CALC.bmiCategory(bmi);
    const tdee = CALC.tdee(p.sex, currentLbs, p.height_cm, p.age, p.activity_level);
    pd = { bmi, bmiCat, tdee };
  }

  if (pd) {
    $('#bmi-current-val').textContent = pd.bmi.toFixed(1);
    $('#bmi-current-cat').textContent = pd.bmiCat.label;
    $('#tdee-current-val').textContent = pd.tdee.toLocaleString();

    // BMI meter
    const marker = $('#bmi-marker');
    const pct = Math.min(100, Math.max(0, (pd.bmi / 45) * 100));
    marker.style.left = `${pct}%`;

    // Show correct tip
    ['normal', 'overweight', 'obese', 'underweight'].forEach(id => $(`#bmi-tip-${id}`).style.display = 'none');
    if (pd.bmi < 18.5) $('#bmi-tip-underweight').style.display = 'block';
    else if (pd.bmi < 25) $('#bmi-tip-normal').style.display = 'block';
    else if (pd.bmi < 30) $('#bmi-tip-overweight').style.display = 'block';
    else $('#bmi-tip-obese').style.display = 'block';
  }

  // Waist user status
  const latestWaist = entries.find(e => e.waist_cm)?.waist_cm;
  const waistEl = $('#waist-user-status');
  if (latestWaist) {
    const threshold = p.sex === 'male' ? 102 : 88;
    const atRisk = latestWaist >= threshold;
    waistEl.style.display = '';
    waistEl.style.background = atRisk ? 'rgba(244,63,94,0.08)' : 'rgba(34,197,94,0.08)';
    waistEl.style.borderLeft = `3px solid ${atRisk ? '#f43f5e' : '#22c55e'}`;
    waistEl.textContent = atRisk
      ? `Tu cintura (${latestWaist} cm) está por encima del umbral de riesgo (${threshold} cm).`
      : `Tu cintura (${latestWaist} cm) está por debajo del umbral de riesgo (${threshold} cm).`;
  } else {
    waistEl.style.display = 'none';
  }
}

// ════════════════════════════════════════════
// CHECK-IN (semanal)
// ════════════════════════════════════════════

async function renderCheckin() {
  if (!state.user || state.userType !== 'participant') return;
  const p = state.user;
  const up = getUnitPref();
  const entries = state.weightHistory.length ? state.weightHistory : await getWeightEntries(p.id);
  state.weightHistory = entries;

  const currentLbs = entries.length > 0 ? entries[0].weight_lbs : p.starting_weight_lbs;
  const prevLbs = entries.length > 1 ? entries[1].weight_lbs : p.starting_weight_lbs;
  const change = CALC.weightChange(prevLbs, currentLbs);

  // Last weight display
  $('#checkin-last-weight').textContent = CALC.formatWeightShort(currentLbs, up);
  $('#checkin-last-label').textContent = entries.length > 0
    ? `${CALC.formatDate(entries[0].date)} · ${CALC.formatWeight(currentLbs, up)}`
    : 'Sin reportes aún';

  // Streak (semanal)
  let streak = 0;
  const todayLocal = getLocalDate();
  for (let i = 0; i < entries.length; i++) {
    const eDate = entries[i].date;
    const diffWeeks = Math.round(weeksBetween(eDate, todayLocal));
    if (diffWeeks === i) streak++;
    else break;
  }
  $('#checkin-streak').textContent = streak > 0
    ? `${streak} semana${streak > 1 ? 's' : ''} consecutiva${streak > 1 ? 's' : ''}`
    : 'Registra tu primer reporte semanal';

  // Grid: últimas 6 semanas
  const grid = $('#week-grid');
  grid.innerHTML = '';
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const dateStr = new Intl.DateTimeFormat('en-CA').format(d);
    const found = entries.find(e => e.date === dateStr);
    const dot = document.createElement('div');
    dot.className = 'week-dot';
    if (found) {
      dot.classList.add('filled');
      dot.textContent = '✓';
      const details = [CALC.formatWeightShort(found.weight_lbs, up)];
      if (found.waist_cm) details.push(`cintura ${found.waist_cm}cm`);
      if (found.body_fat_pct) details.push(`grasa ${found.body_fat_pct}%`);
      dot.title = `${dateStr}: ${details.join(' · ')}`;
    } else if (i === 0) {
      dot.classList.add('today');
      dot.textContent = '•';
    } else {
      dot.textContent = d.getDate();
    }
    grid.appendChild(dot);
  }

  // Unit label
  $('#checkin-unit-label').textContent = up === 'metric' ? 'kg' : 'lbs';

  // Activity picker
  renderActivityPicker();

  // Form
  $('#checkin-weight').value = '';
  $('#checkin-weight').placeholder = CALC.formatWeightShort(currentLbs, up);
  $('#checkin-waist').value = '';
  $('#checkin-bf').value = '';
  $('#checkin-notes').value = '';
  clearActivitySelection();

  const todayEntry = entries.find(e => e.date === getLocalDate());
  if (todayEntry) {
    $('#checkin-weight').value = CALC.lbsToInput(todayEntry.weight_lbs, up);
    $('#checkin-waist').value = todayEntry.waist_cm || '';
    $('#checkin-bf').value = todayEntry.body_fat_pct || '';
    $('#checkin-notes').value = todayEntry.notes || '';
    if (todayEntry.activities) {
      todayEntry.activities.split(',').forEach(id => {
        const btn = $(`.activity-btn[data-id="${id}"]`);
        if (btn) btn.classList.add('active');
      });
    }
    $('#checkin-submit').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;display:block;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg> ✓ Actualizar';
  } else {
    $('#checkin-submit').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;display:block;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/></svg> Reportar';
  }

  // History
  const hist = $('#checkin-history');
  hist.innerHTML = '';
  if (entries.length === 0) {
    hist.innerHTML = '<div class="empty-state"><p>No hay reportes. Regístrate cada semana.</p></div>';
    return;
  }
  entries.slice(0, 10).forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'weight-entry';
    let changeHtml = '';
    if (idx < entries.length - 1) {
      const diff = entries[idx + 1].weight_lbs - entry.weight_lbs;
      if (diff < 0) changeHtml = `<span class="we-change down">-${CALC.formatWeightShort(Math.abs(diff), up)} ${up === 'metric' ? 'kg' : 'lbs'}</span>`;
      else if (diff > 0) changeHtml = `<span class="we-change up">+${CALC.formatWeightShort(diff, up)} ${up === 'metric' ? 'kg' : 'lbs'}</span>`;
      else changeHtml = `<span class="we-change" style="color:#a8a29e">0</span>`;
    }
    let extra = '';
    if (entry.waist_cm) extra += ` · ${entry.waist_cm}cm`;
    if (entry.body_fat_pct) extra += ` · ${entry.body_fat_pct}%`;
    if (entry.activities) {
      const acts = entry.activities.split(',').map(id => ACTIVITIES.find(a => a.id === id)).filter(Boolean);
      if (acts.length) extra += ` · ${acts.map(a => a.label).join(', ')}`;
    }
    div.innerHTML = `
      <span class="we-date">${CALC.formatDate(entry.date)}</span>
      <span class="we-weight">${CALC.formatWeight(entry.weight_lbs, up)}</span>
      <span>${changeHtml}</span>
      ${extra ? `<span class="we-extra">${extra}</span>` : ''}
      ${idx === 0 ? `
        <span class="we-actions">
          <button class="btn-icon btn-icon-sm" data-entry-id="${entry.id}" data-action="edit" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-icon btn-icon-sm btn-icon-danger" data-entry-id="${entry.id}" data-action="delete" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </span>
      ` : ''}
    `;
    hist.appendChild(div);
  });

  // Attach event listeners for edit/delete
  hist.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', () => openEntryEdit(parseInt(btn.dataset.entryId)));
  });
  hist.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteEntry(parseInt(btn.dataset.entryId)));
  });
}

// ─── Edit / Delete entry ───

async function openEntryEdit(entryId) {
  const entry = state.weightHistory.find(e => e.id === entryId);
  if (!entry) return;
  const up = getUnitPref();

  $('#entry-edit-weight').value = up === 'metric' ? CALC.lbsToKg(entry.weight_lbs) : entry.weight_lbs;
  $('#entry-edit-waist').value = entry.waist_cm || '';
  $('#entry-edit-bf').value = entry.body_fat_pct || '';
  $('#entry-edit-notes').value = entry.notes || '';
  $('#entry-edit-unit-label').textContent = up === 'metric' ? 'kg' : 'lbs';

  // Activity picker inside modal
  const container = $('#entry-edit-activity-picker');
  container.innerHTML = '';
  const selectedActs = entry.activities ? entry.activities.split(',') : [];
  ACTIVITIES.forEach(a => {
    const wrapper = document.createElement('div');
    wrapper.className = 'activity-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'activity-btn' + (selectedActs.includes(a.id) ? ' active' : '');
    btn.dataset.id = a.id;
    btn.title = a.label;
    btn.innerHTML = a.svg;
    btn.addEventListener('click', () => btn.classList.toggle('active'));
    wrapper.appendChild(btn);
    const label = document.createElement('span');
    label.className = 'activity-label';
    label.textContent = a.label;
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  });

  // Store editing id on form
  $('#entry-edit-form').dataset.entryId = entryId;
  $('#entry-edit-modal').classList.remove('hidden');
}

async function deleteEntry(entryId) {
  if (!confirm('¿Eliminar este reporte permanentemente?')) return;
  try {
    await deleteWeightEntry(entryId);
    state.weightHistory = state.weightHistory.filter(e => e.id !== entryId);
    await renderCheckin();
    updateReportBanner(state.weightHistory);
    showToast('Reporte eliminado', 'success');
  } catch (e) {
    showToast(e.message || 'Error al eliminar', 'error');
  }
}

// ─── Entry edit modal handlers ───

function initEntryEditModal() {
  $('#entry-edit-close').addEventListener('click', () => $('#entry-edit-modal').classList.add('hidden'));
  $('#entry-edit-modal').addEventListener('click', e => { if (e.target === e.currentTarget) e.target.classList.add('hidden'); });
  $('#entry-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const entryId = parseInt($('#entry-edit-form').dataset.entryId);
    if (!entryId) return;
    const btn = $('#entry-edit-save');
    btn.disabled = true; btn.textContent = 'Guardando...';

    const up = getUnitPref();
    const raw = parseFloat($('#entry-edit-weight').value);
    if (!raw || raw <= 0) { showToast('Ingresa un peso válido', 'error'); btn.disabled = false; btn.textContent = 'Guardar cambios'; return; }
    const weightLbs = up === 'metric' ? CALC.kgToLbs(raw) : raw;
    const waistCm = parseFloat($('#entry-edit-waist').value) || null;
    const bodyFatPct = parseFloat($('#entry-edit-bf').value) || null;
    const notes = $('#entry-edit-notes').value || null;
    const acts = $$('#entry-edit-activity-picker .activity-btn.active').map(b => b.dataset.id);
    const activities = acts.length > 0 ? acts.join(',') : null;

    try {
      await updateWeightEntry(entryId, { weight_lbs: weightLbs, waist_cm: waistCm, body_fat_pct: bodyFatPct, activities, notes });
      $('#entry-edit-modal').classList.add('hidden');
      state.weightHistory = await getWeightEntries(state.user.id);
      await renderCheckin();
      updateReportBanner(state.weightHistory);
      showToast('Reporte actualizado', 'success');
    } catch (e) {
      showToast(e.message || 'Error al actualizar', 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Guardar cambios';
    }
  });
}

function renderActivityPicker() {
  const container = $('#activity-picker');
  container.innerHTML = '';
  ACTIVITIES.forEach(a => {
    const wrapper = document.createElement('div');
    wrapper.className = 'activity-item';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'activity-btn';
    btn.dataset.id = a.id;
    btn.title = a.label;
    btn.innerHTML = a.svg;
    btn.addEventListener('click', () => btn.classList.toggle('active'));
    wrapper.appendChild(btn);
    const label = document.createElement('span');
    label.className = 'activity-label';
    label.textContent = a.label;
    wrapper.appendChild(label);
    container.appendChild(wrapper);
  });
}

function clearActivitySelection() {
  $$('.activity-btn').forEach(b => b.classList.remove('active'));
}

function weeksBetween(dateA, dateB) {
  const a = new Date(dateA + 'T12:00:00');
  const b = new Date(dateB + 'T12:00:00');
  return (b - a) / (7 * 24 * 60 * 60 * 1000);
}

async function handleCheckIn(e) {
  e.preventDefault();
  if (!state.user || state.userType !== 'participant') return;
  const raw = parseFloat($('#checkin-weight').value);
  const up = getUnitPref();
  const weightLbs = up === 'metric' ? CALC.kgToLbs(raw) : raw;
  if (!raw || raw <= 0) { showToast('Ingresa un peso válido', 'error'); return; }

  const waistRaw = parseFloat($('#checkin-waist').value);
  const waistCm = waistRaw > 0 ? waistRaw : null;
  const bfRaw = parseFloat($('#checkin-bf').value);
  const bodyFatPct = bfRaw > 0 ? bfRaw : null;
  const notes = $('#checkin-notes').value.trim();
  const activities = Array.from($$('.activity-btn.active')).map(b => b.dataset.id).join(',') || null;

  const btn = $('#checkin-submit');
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = 'Guardando...';
  try {
    const result = await addWeightEntry(state.user.id, weightLbs, waistCm, bodyFatPct, activities, notes);
    showToast(result.updated
      ? `Actualizado a ${CALC.formatWeight(weightLbs, up)}`
      : `${CALC.formatWeight(weightLbs, up)} registrado. Semana #${state.weightHistory.length + 1}!`, 'success');
    await renderHome();
    await renderCheckin();
    updateReportBanner(state.weightHistory);
  } catch (e) {
    showToast(e.message || 'Error', 'error');
  } finally {
    btn.disabled = false; btn.textContent = orig;
  }
}

// ════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════

async function renderAdminPanel() {
  if (!state.user || state.userType !== 'admin') return;
  const up = getUnitPref();

  try {
    const participants = await getAllParticipants();
    const tbody = $('#admin-participants');
    tbody.innerHTML = '';
    if (participants.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state" style="padding:1.5rem;text-align:center"><p>Sin participantes</p></td></tr>';
      return;
    }
    for (const p of participants) {
      const entries = await getWeightEntries(p.id);
      const currentLbs = entries.length > 0 ? entries[0].weight_lbs : p.starting_weight_lbs;
      const pctLost = CALC.percentLost(p.starting_weight_lbs, currentLbs);
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--orange-100)';
      tr.innerHTML = `
        <td style="padding:0.5rem 0;font-weight:700;font-size:0.85rem;">${p.nickname}</td>
        <td style="padding:0.5rem 0;font-size:0.78rem;color:var(--stone-400)">${CALC.formatHeight(p.height_cm, up)} · ${p.age}a</td>
        <td style="padding:0.5rem 0;font-size:0.8rem;">${CALC.formatWeight(p.starting_weight_lbs, up)} → ${CALC.formatWeight(currentLbs, up)}</td>
        <td style="padding:0.5rem 0;font-weight:700;font-size:0.85rem;color:${pctLost > 0 ? '#16a34a' : 'var(--stone-400)'}">${CALC.formatPercent(pctLost)}</td>
        <td style="padding:0.5rem 0;text-align:right"><button class="btn btn-sm btn-outline admin-edit" data-id="${p.id}" data-name="${p.nickname}">Editar</button></td>
        <td style="padding:0.5rem 0;text-align:right"><button class="btn btn-sm btn-outline admin-pw" data-id="${p.id}" data-name="${p.nickname}">Clave</button></td>
        <td style="padding:0.5rem 0;text-align:right"><button class="btn btn-sm btn-danger admin-delete" data-id="${p.id}" data-name="${p.nickname}">Eliminar</button></td>
      `;
      tbody.appendChild(tr);
    }
    document.querySelectorAll('.admin-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm(`¿Eliminar a ${btn.dataset.name}?`)) {
          try {
            await deleteParticipant(parseInt(btn.dataset.id));
            showToast('Eliminado', 'info');
            await renderAdminPanel();
          } catch (e) { showToast('Error', 'error'); }
        }
      });
    });
    document.querySelectorAll('.admin-pw').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.name;
        const newPw = prompt(`Nueva contraseña para ${name}:`);
        if (!newPw || newPw.length < 3) return showToast('Mínimo 3 caracteres', 'error');
        try {
          await updateParticipantPassword(parseInt(btn.dataset.id), newPw);
          showToast(`Contraseña de ${name} actualizada`, 'success');
        } catch (e) { showToast('Error al actualizar', 'error'); }
      });
    });
    document.querySelectorAll('.admin-edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const pid = parseInt(btn.dataset.id);
        try {
          const p = await getParticipant(pid);
          const up = getUnitPref();
          $('#edit-nickname').value = p.nickname;
          $('#edit-age').value = p.age;
          document.querySelector(`input[name="edit-sex"][value="${p.sex}"]`).checked = true;
          $('#edit-height').value = (p.height_cm / 100).toFixed(2);
          const weightMode = up === 'imperial' ? 'lbs' : 'kg';
          document.querySelector(`input[name="edit-weight-mode"][value="${weightMode}"]`).checked = true;
          $('#edit-weight').value = up === 'metric' ? CALC.lbsToKg(p.starting_weight_lbs).toFixed(1) : p.starting_weight_lbs.toFixed(1);
          $('#edit-activity').value = p.activity_level;
          document.querySelector(`input[name="edit-unit-pref"][value="${p.unit_preference}"]`).checked = true;
          $('#admin-edit-modal').dataset.pid = pid;
          $('#admin-edit-title').textContent = `Editar · ${p.nickname}`;
          $('#admin-edit-modal').classList.remove('hidden');
        } catch (e) { showToast('Error al cargar datos', 'error'); }
      });
    });
  } catch (e) {
    console.error(e);
    $('#admin-participants').innerHTML = '<tr><td colspan="7" class="empty-state"><p>Error</p></td></tr>';
  }
}

function switchAdminView(view) {
  $$('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.adminView === view));
  $$('.admin-subview').forEach(v => v.classList.toggle('hidden', v.id !== `admin-view-${view}`));
}

async function handleAdminCreateParticipant(e) {
  e.preventDefault();
  const nickname = $('#admin-nickname').value.trim();
  const password = $('#admin-password').value;
  const age = parseInt($('#admin-age').value);
  const sex = document.querySelector('input[name="admin-sex"]:checked');
  const heightCm = parseFloat($('#admin-height').value) * 100;
  const weightMode = document.querySelector('input[name="admin-weight-mode"]:checked').value;
  const weightVal = parseFloat($('#admin-weight').value);
  const startingWeightLbs = weightMode === 'kg' ? CALC.kgToLbs(weightVal) : weightVal;
  const activityLevel = $('#admin-activity').value;
  const unitPref = document.querySelector('input[name="admin-unit-pref"]:checked').value;

  if (!nickname || !password || !age || !sex || !heightCm || !weightVal || !activityLevel) {
    showToast('Completa todos', 'error'); return;
  }

  const btn = $('#admin-create-btn');
  btn.disabled = true; btn.textContent = 'Creando...';
  try {
    await createParticipant({ nickname, password, age, sex: sex.value, heightCm, activityLevel, startingWeightLbs, unitPreference: unitPref });
    showToast(`${nickname} creado`, 'success');
    $('#admin-nickname').value = ''; $('#admin-password').value = ''; $('#admin-age').value = ''; $('#admin-weight').value = '';
    switchAdminView('participants');
    await renderAdminPanel();
  } catch (e) { showToast(e.message || 'Error', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Crear'; }
}

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════

function getAvatar(nickname) {
  return `<span class="avatar-init">${nickname.charAt(0).toUpperCase()}</span>`;
}

function updateUnitToggle() {
  const btn = $('#unit-toggle');
  if (!btn) return;
  const isMetric = state.activeUnitPref === 'metric';
  btn.textContent = isMetric ? 'kg' : 'lbs';
  btn.title = isMetric ? 'Cambiar a imperial (lbs)' : 'Cambiar a métrico (kg)';
  btn.style.borderColor = isMetric ? '#22c55e' : '#f97316';
  btn.style.color = isMetric ? '#22c55e' : '#f97316';
}

async function handleUnitToggle() {
  state.activeUnitPref = state.activeUnitPref === 'metric' ? 'imperial' : 'metric';
  saveSession();
  updateUnitToggle();

  // Persist preference to DB for participants (survives logout)
  if (state.userType === 'participant' && state.user) {
    try {
      await updateParticipant(state.user.id, { unit_preference: state.activeUnitPref });
      state.user.unit_preference = state.activeUnitPref;
    } catch (_) {}
  }

  // Destroy charts so they re-render with new units
  Object.values(state.chartInstances).forEach(c => { try { c.destroy(); } catch(_) {} });
  state.chartInstances = {};

  const view = state.currentView;
  if (view === 'home') await renderHome();
  else if (view === 'leaderboard') await renderLeaderboard();
  else if (view === 'stats') renderStats();
  else if (view === 'checkin') await renderCheckin();
  else if (view === 'info') await renderInfo();
  else if (view === 'admin') { switchAdminView('participants'); await renderAdminPanel(); }
  await updateReportBanner();

  const label = state.activeUnitPref === 'metric' ? 'métrico' : 'imperial';
  showToast(`Cambiado a sistema ${label}`, 'info');
}

function initAuthTabs() {
  const adminTab = $('#login-tab-admin');
  const partTab = $('#login-tab-participant');
  adminTab.addEventListener('click', () => {
    adminTab.classList.add('active'); partTab.classList.remove('active');
    $('#login-btn').textContent = 'Ingresar como Admin';
    $('#login-title').textContent = 'Admin';
    $('#login-username').placeholder = 'Usuario admin';
  });
  partTab.addEventListener('click', () => {
    partTab.classList.add('active'); adminTab.classList.remove('active');
    $('#login-btn').textContent = 'Ingresar';
    $('#login-title').textContent = 'Participante';
    $('#login-username').placeholder = 'Nickname';
  });
}

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initAuthTabs();
  initEntryEditModal();

  // Forms
  $('#setup-form')?.addEventListener('submit', handleAdminSetup);
  $('#login-form')?.addEventListener('submit', handleLogin);
  $('#checkin-form')?.addEventListener('submit', handleCheckIn);
  $('#admin-create-form')?.addEventListener('submit', handleAdminCreateParticipant);
  $('#btn-logout')?.addEventListener('click', handleLogout);
  $('#unit-toggle')?.addEventListener('click', handleUnitToggle);
  $('#home-go-ranking')?.addEventListener('click', () => showView('leaderboard'));
  $('#report-banner-btn')?.addEventListener('click', () => { showView('checkin'); renderCheckin(); });
  $('#admin-go-dashboard')?.addEventListener('click', () => handleLogout());

  // Admin sub-views
  $$('.admin-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const view = tab.dataset.adminView;
      switchAdminView(view);
      if (view === 'participants') await renderAdminPanel();
    });
  });

  // Admin edit modal
  $('#admin-edit-close')?.addEventListener('click', () => $('#admin-edit-modal').classList.add('hidden'));
  $('#admin-edit-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) e.target.classList.add('hidden'); });
  $('#admin-edit-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const pid = parseInt($('#admin-edit-modal').dataset.pid);
    const nickname = $('#edit-nickname').value.trim();
    const age = parseInt($('#edit-age').value);
    const sex = document.querySelector('input[name="edit-sex"]:checked')?.value;
    const heightCm = parseFloat($('#edit-height').value) * 100;
    const weightMode = document.querySelector('input[name="edit-weight-mode"]:checked').value;
    const weightVal = parseFloat($('#edit-weight').value);
    const startingWeightLbs = weightMode === 'kg' ? CALC.kgToLbs(weightVal) : weightVal;
    const activityLevel = $('#edit-activity').value;
    const unitPref = document.querySelector('input[name="edit-unit-pref"]:checked').value;
    if (!nickname || !age || !sex || !heightCm || !weightVal || !activityLevel) {
      showToast('Completa todos', 'error'); return;
    }
    const btn = $('#admin-edit-save');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      await updateParticipant(pid, { nickname, age, sex, height_cm: heightCm, starting_weight_lbs: startingWeightLbs, activity_level: activityLevel, unit_preference: unitPref });
      showToast(`${nickname} actualizado`, 'success');
      $('#admin-edit-modal').classList.add('hidden');
      await renderAdminPanel();
    } catch (e) { showToast(e.message || 'Error', 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Guardar'; }
  });

  // Weight mode toggles
  $$('input[name="admin-weight-mode"]').forEach(r => r.addEventListener('change', () => {
    const mode = document.querySelector('input[name="admin-weight-mode"]:checked').value;
    $('#admin-weight').placeholder = mode === 'kg' ? '100 kg' : '220 lbs';
    $('#admin-weight').value = '';
  }));
  $$('input[name="edit-weight-mode"]').forEach(r => r.addEventListener('change', () => {
    const mode = document.querySelector('input[name="edit-weight-mode"]:checked').value;
    $('#edit-weight').placeholder = mode === 'kg' ? '80 kg' : '176 lbs';
  }));

  // Height hint converter
  function updateHeightHint(prefix) {
    const input = $(`#${prefix}-height`);
    const hint = $(`#${prefix}-height-hint`);
    const m = parseFloat(input.value);
    if (m && m > 0) {
      const totalIn = Math.round(CALC.cmToInches(m * 100));
      const ft = Math.floor(totalIn / 12);
      const inches = totalIn % 12;
      hint.textContent = `${m.toFixed(2)} m ≈ ${ft}′${inches}″`;
    } else {
      hint.textContent = 'Ej: 1.75 m ≈ 5′9″';
    }
  }
  $('#admin-height')?.addEventListener('input', () => updateHeightHint('admin'));

  // Bottom navigation
  $$('#bottom-nav .nav-item').forEach(item => {
    item.addEventListener('click', async () => {
      const view = item.dataset.view;
      showView(view);
      if (view === 'home') await renderHome();
      else if (view === 'leaderboard') await renderLeaderboard();
      else if (view === 'stats') renderStats();
      else if (view === 'checkin') await renderCheckin();
      else if (view === 'info') await renderInfo();
      await updateReportBanner();
    });
  });

  // Start
  if (loadSession()) {
    if (state.userType === 'admin') {
      showView('admin');
      switchAdminView('participants');
      renderAdminPanel();
    } else {
      updateUnitToggle();
      showView('home');
      renderHome();
    }
  } else {
    checkInitialSetup();
  }
});
