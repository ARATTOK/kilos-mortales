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

  const isLoggedIn = state.user && (viewId === 'home' || viewId === 'leaderboard' || viewId === 'stats' || viewId === 'checkin');
  const navbar = $('#navbar');
  const bottomNav = $('#bottom-nav');

  if (viewId === 'admin') {
    navbar.classList.remove('hidden');
    bottomNav.classList.add('hidden');
    document.body.classList.add('no-bottom-nav');
  } else if (isLoggedIn) {
    navbar.classList.remove('hidden');
    bottomNav.classList.remove('hidden');
    document.body.classList.remove('no-bottom-nav');
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
      showView('admin');
      await renderAdminPanel();
      showToast(`Bienvenido ${user.username}`, 'success');
    } else {
      const user = await participantLogin(username, password);
      state.user = user; state.userType = 'participant';
      state.activeUnitPref = user.unit_preference;
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
  showView('login');
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
    ? `${entries.length} check-ins · ${CALC.formatWeight(currentLbs, up)} actual`
    : '¡Registra tu primer check-in!';

  const changeEl = $('#home-change');
  if (entries.length > 1) {
    const absC = Math.abs(change);
    const cLabel = CALC.formatWeight(absC, up);
    if (change < 0) { changeEl.className = 'change-banner down'; changeEl.textContent = `${cLabel} menos desde el último check-in`; }
    else if (change > 0) { changeEl.className = 'change-banner up'; changeEl.textContent = `${cLabel} más desde el último check-in`; }
    else { changeEl.className = 'change-banner flat'; changeEl.textContent = 'Sin cambios'; }
  } else {
    changeEl.className = 'change-banner first';
    changeEl.textContent = 'Primer check-in! Registra tu peso cada 3 días.';
  }

  // Stats
  $('#hstat-weight').textContent = CALC.formatWeightShort(currentLbs, up);
  $('#hstat-lost').textContent = CALC.formatPercent(pctLost);
  $('#hstat-bmi').textContent = bmi.toFixed(1);
  $('#hstat-tdee').textContent = tdee.toLocaleString();

  // Progress
  $('#home-progress-label').textContent = `${progress.toFixed(0)}%`;
  $('#home-progress-fill').style.width = `${progress}%`;

  // Mini leaderboard (top 3)
  await renderMiniLeaderboard(p.id);

  // Next check-in
  const lastDate = entries.length > 0 ? new Date(entries[0].date + 'T12:00:00') : null;
  const now = new Date();
  if (lastDate) {
    const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    const daysUntilNext = 3 - daysSince;
    if (daysSince === 0) $('#home-next-checkin').textContent = 'Ya te pesaste hoy';
    else if (daysSince < 3) $('#home-next-checkin').textContent = `Próximo pesaje en ${daysUntilNext} día${daysUntilNext === 1 ? '' : 's'}`;
    else $('#home-next-checkin').textContent = 'Pesate! Han pasado más de 3 días.';
  } else {
    $('#home-next-checkin').textContent = 'Registra tu primer peso!';
  }
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

    // Hero
    const hero = $('#ranking-hero');
    if (data.length > 0) {
      const top = data[0];
      const bmi = CALC.bmi(top.currentWeightLbs, top.heightCm);
      hero.querySelector('.hero-rank').textContent = '1';
      hero.querySelector('.hero-name').textContent = top.nickname;
      hero.querySelector('.hero-pct').textContent = CALC.formatPercent(top.percentLost);
      hero.querySelector('.hero-detail').textContent =
        `${CALC.formatWeight(top.startingWeightLbs, top.unitPreference)} → ${CALC.formatWeight(top.currentWeightLbs, top.unitPreference)} · ${top.entriesCount} check-ins`;
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
            ${CALC.formatWeight(entry.startingWeightLbs, entry.unitPreference)} →
            ${CALC.formatWeight(entry.currentWeightLbs, entry.unitPreference)}
            ${lbsLost > 0 ? ` · ${CALC.formatWeight(lbsLost, entry.unitPreference)} perdidos` : ''}
            · BMI ${entry.bmi.toFixed(1)}
          </div>
        </div>
        <div class="r-side">
          <div class="r-pct ${entry.percentLost > 0 ? 'good' : 'bad'}">${CALC.formatPercent(entry.percentLost)}</div>
          <div class="r-sub">${entry.entriesCount} check-ins</div>
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

  // BMI info
  if (pd) {
    $('#bmi-current-val').textContent = pd.bmi.toFixed(1);
    $('#bmi-current-cat').textContent = pd.bmiCat.label + ' ' + pd.bmiCat.emoji;
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
                return `${CALC.formatWeight(entry.startingWeightLbs, entry.unitPreference)} → ${CALC.formatWeight(entry.currentWeightLbs, entry.unitPreference)}`;
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
}

// ════════════════════════════════════════════
// CHECK-IN
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
    : 'Sin registros aún';

  // Streak (cada 3 días)
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < entries.length; i++) {
    const d = new Date(entries[i].date + 'T12:00:00');
    const diff = Math.round((today - d) / (3 * 24 * 60 * 60 * 1000));
    if (diff === i) streak++;
    else break;
  }
  $('#checkin-streak').textContent = streak > 0
    ? `${streak} período${streak > 1 ? 's' : ''} consecutivo${streak > 1 ? 's' : ''}`
    : 'Registra tu primer check-in';

  // Grid: últimos 7 check-ins (cada 3 días)
  const grid = $('#week-grid');
  grid.innerHTML = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 3);
    const dateStr = d.toISOString().split('T')[0];
    const found = entries.find(e => e.date === dateStr);
    const dot = document.createElement('div');
    dot.className = 'week-dot';
    if (found) {
      dot.classList.add('filled');
      dot.textContent = '✓';
      dot.title = `${dateStr}: ${found.weight_lbs.toFixed(1)} lbs`;
    } else if (i === 0) {
      dot.classList.add('today');
      dot.textContent = '•';
    } else {
      const month = d.toLocaleDateString('es-ES', { month: 'short' });
      dot.textContent = d.getDate();
    }
    grid.appendChild(dot);
  }

  // Unit label
  $('#checkin-unit-label').textContent = up === 'metric' ? 'kg' : 'lbs';

  // Form
  $('#checkin-weight').value = '';
  $('#checkin-weight').placeholder = CALC.formatWeightShort(currentLbs, up);
  $('#checkin-notes').value = '';

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === todayStr);
  if (todayEntry) {
    $('#checkin-weight').value = CALC.lbsToInput(todayEntry.weight_lbs, up);
    $('#checkin-notes').value = todayEntry.notes || '';
    $('#checkin-submit').textContent = '✓ Actualizar';
  } else {
    $('#checkin-submit').textContent = 'Registrar';
  }

  // History
  const hist = $('#checkin-history');
  hist.innerHTML = '';
  if (entries.length === 0) {
    hist.innerHTML = '<div class="empty-state"><p>No hay registros. Pésate cada 3 días.</p></div>';
    return;
  }
  entries.slice(0, 8).forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'weight-entry';
    let changeHtml = '';
    if (idx < entries.length - 1) {
      const diff = entries[idx + 1].weight_lbs - entry.weight_lbs;
      if (diff < 0) changeHtml = `<span class="we-change down">-${CALC.lbsToKg(Math.abs(diff)).toFixed(1)} kg</span>`;
      else if (diff > 0) changeHtml = `<span class="we-change up">+${CALC.lbsToKg(diff).toFixed(1)} kg</span>`;
      else changeHtml = `<span class="we-change" style="color:#a8a29e">0</span>`;
    }
    div.innerHTML = `
      <span class="we-date">${CALC.formatDate(entry.date)}</span>
      <span class="we-weight">${CALC.formatWeight(entry.weight_lbs, up)}</span>
      <span>${changeHtml}</span>
    `;
    hist.appendChild(div);
  });
}

async function handleCheckIn(e) {
  e.preventDefault();
  if (!state.user || state.userType !== 'participant') return;
  const raw = parseFloat($('#checkin-weight').value);
  const up = getUnitPref();
  const weightLbs = up === 'metric' ? CALC.kgToLbs(raw) : raw;
  const notes = $('#checkin-notes').value.trim();
  if (!raw || raw <= 0) { showToast('Ingresa un peso válido', 'error'); return; }
  const btn = $('#checkin-submit');
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = 'Guardando...';
  try {
    const result = await addWeightEntry(state.user.id, weightLbs, notes);
    showToast(result.updated
      ? `Actualizado a ${CALC.formatWeight(weightLbs, up)}`
      : `${CALC.formatWeight(weightLbs, up)} registrado. Check-in #${state.weightHistory.length + 1}!`, 'success');
    await renderHome();
    await renderCheckin();
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
  $('#admin-title').textContent = `Panel · ${state.user.username}`;

  try {
    const participants = await getAllParticipants();
    const tbody = $('#admin-participants');
    tbody.innerHTML = '';
    if (participants.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state" style="padding:1.5rem;text-align:center"><p>Sin participantes</p></td></tr>';
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
        <td style="padding:0.5rem 0;font-size:0.78rem;color:var(--stone-400)">${CALC.formatHeight(p.height_cm, p.unit_preference)} · ${p.age}a</td>
        <td style="padding:0.5rem 0;font-size:0.8rem;">${CALC.formatWeight(p.starting_weight_lbs, p.unit_preference)} → ${CALC.formatWeight(currentLbs, p.unit_preference)}</td>
        <td style="padding:0.5rem 0;font-weight:700;font-size:0.85rem;color:${pctLost > 0 ? '#16a34a' : 'var(--stone-400)'}">${CALC.formatPercent(pctLost)}</td>
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
  } catch (e) {
    console.error(e);
    $('#admin-participants').innerHTML = '<tr><td colspan="5" class="empty-state"><p>Error</p></td></tr>';
  }
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
  btn.style.borderColor = isMetric ? '#22c55e' : '#f97316';
  btn.style.color = isMetric ? '#22c55e' : '#f97316';
}

async function handleUnitToggle() {
  state.activeUnitPref = state.activeUnitPref === 'metric' ? 'imperial' : 'metric';
  updateUnitToggle();

  // Destroy charts so they re-render with new units
  Object.values(state.chartInstances).forEach(c => { try { c.destroy(); } catch(_) {} });
  state.chartInstances = {};

  const view = state.currentView;
  if (view === 'home') await renderHome();
  else if (view === 'leaderboard') await renderLeaderboard();
  else if (view === 'stats') renderStats();
  else if (view === 'checkin') await renderCheckin();

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

  // Forms
  $('#setup-form')?.addEventListener('submit', handleAdminSetup);
  $('#login-form')?.addEventListener('submit', handleLogin);
  $('#checkin-form')?.addEventListener('submit', handleCheckIn);
  $('#admin-create-form')?.addEventListener('submit', handleAdminCreateParticipant);
  $('#btn-logout')?.addEventListener('click', handleLogout);
  $('#unit-toggle')?.addEventListener('click', handleUnitToggle);
  $('#home-go-ranking')?.addEventListener('click', () => showView('leaderboard'));
  $('#admin-go-dashboard')?.addEventListener('click', () => { handleLogout(); showView('login'); });

  // Weight mode toggles
  $$('input[name="admin-weight-mode"]').forEach(r => r.addEventListener('change', () => {
    const mode = document.querySelector('input[name="admin-weight-mode"]:checked').value;
    $('#admin-weight').placeholder = mode === 'kg' ? '100 kg' : '220 lbs';
    $('#admin-weight').value = '';
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
    });
  });

  // Start
  checkInitialSetup();
});
