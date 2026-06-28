// ════════════════════════════════════════════════════════════
// 🔥 KILOS MORTALES — APLICACIÓN PRINCIPAL
// ════════════════════════════════════════════════════════════

const state = {
  currentView: null,
  user: null,
  userType: null,
  leaderboard: [],
  participantData: null,
  weightHistory: []
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ════════════════════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════
// VIEW ROUTER
// ════════════════════════════════════════════════════════════

function showView(viewId) {
  $$('.view').forEach(v => v.classList.add('hidden'));
  const view = $(`#view-${viewId}`);
  if (view) view.classList.remove('hidden');
  state.currentView = viewId;
  const navbar = $('#navbar');
  if (viewId === 'dashboard' || viewId === 'admin') {
    navbar.classList.remove('hidden');
  } else {
    navbar.classList.add('hidden');
  }
}

function navigateTo(viewId) {
  showView(viewId);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════

async function checkInitialSetup() {
  try {
    const exists = await checkAdminExists();
    if (!exists) navigateTo('admin-setup');
    else navigateTo('login');
  } catch (e) {
    console.error('Error checking admin:', e);
    showToast('Error conectando con Supabase. Verifica la configuración.', 'error');
  }
}

function getUnitPref() {
  if (state.userType === 'participant' && state.user) {
    return state.user.unit_preference;
  }
  return 'imperial';
}

// Admin setup
async function handleAdminSetup(e) {
  e.preventDefault();
  const username = $('#setup-username').value.trim();
  const password = $('#setup-password').value;
  const confirm = $('#setup-confirm').value;

  if (!username || !password) { showToast('Completa todos los campos', 'error'); return; }
  if (password !== confirm) { showToast('Las contraseñas no coinciden', 'error'); return; }
  if (password.length < 4) { showToast('La contraseña debe tener al menos 4 caracteres', 'error'); return; }

  const btn = $('#setup-btn');
  btn.disabled = true;
  btn.textContent = 'Creando...';
  try {
    await createAdmin(username, password);
    showToast('✅ Admin creado correctamente', 'success');
    navigateTo('login');
  } catch (e) {
    showToast(e.message || 'Error al crear admin', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔥 Crear Admin';
  }
}

// Login
async function handleLogin(e) {
  e.preventDefault();
  const isAdmin = $('#login-tab-admin').classList.contains('active');
  const username = $('#login-username').value.trim();
  const password = $('#login-password').value;

  if (!username || !password) { showToast('Ingresa usuario y contraseña', 'error'); return; }

  const btn = $('#login-btn');
  btn.disabled = true;
  btn.textContent = 'Ingresando...';

  try {
    if (isAdmin) {
      const user = await adminLogin(username, password);
      state.user = user;
      state.userType = 'admin';
      navigateTo('admin');
      await renderAdminPanel();
      showToast(`Bienvenido ${user.username} 🔥`, 'success');
    } else {
      const user = await participantLogin(username, password);
      state.user = user;
      state.userType = 'participant';
      navigateTo('dashboard');
      await renderDashboard();
      showToast(`¡Bienvenido ${user.nickname}! 💪`, 'success');
    }
  } catch (e) {
    showToast(e.message || 'Error al iniciar sesión', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = isAdmin ? '🔥 Ingresar como Admin' : '🔥 Ingresar';
  }
}

// Registration
async function handleRegister(e) {
  e.preventDefault();
  const nickname = $('#reg-nickname').value.trim();
  const password = $('#reg-password').value;
  const confirm = $('#reg-confirm').value;
  const age = parseInt($('#reg-age').value);
  const sex = document.querySelector('input[name="reg-sex"]:checked');
  const heightCm = parseFloat($('#reg-height').value) * 100;
  let startingWeightLbs;
  const weightMode = document.querySelector('input[name="reg-weight-mode"]:checked').value;
  const weightVal = parseFloat($('#reg-weight').value);
  if (weightMode === 'kg') startingWeightLbs = CALC.kgToLbs(weightVal);
  else startingWeightLbs = weightVal;
  const activityLevel = $('#reg-activity').value;
  const unitPref = document.querySelector('input[name="reg-unit-pref"]:checked').value;

  if (!nickname || !password || !confirm || !age || !sex || !heightCm || !weightVal || !activityLevel) {
    showToast('Completa todos los campos', 'error'); return;
  }
  if (password !== confirm) { showToast('Las contraseñas no coinciden', 'error'); return; }
  if (password.length < 4) { showToast('La contraseña debe tener al menos 4 caracteres', 'error'); return; }

  const btn = $('#reg-btn');
  btn.disabled = true;
  btn.textContent = 'Registrando...';

  try {
    await createParticipant({
      nickname, password, age, sex: sex.value,
      heightCm, activityLevel,
      startingWeightLbs, unitPreference: unitPref
    });
    showToast(`✅ ${nickname} registrado. Ahora inicia sesión.`, 'success');
    navigateTo('login');
  } catch (e) {
    showToast(e.message || 'Error al registrarse', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔥 Registrarse';
  }
}

function handleLogout() {
  state.user = null;
  state.userType = null;
  state.leaderboard = [];
  state.participantData = null;
  state.weightHistory = [];
  navigateTo('login');
  showToast('Sesión cerrada', 'info');
}

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════

async function renderDashboard() {
  if (!state.user || state.userType !== 'participant') return;

  const p = state.user;
  const up = p.unit_preference;
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

  const unitLabel = up === 'metric' ? 'kg' : 'lbs';
  const unitLabelShort = up === 'metric' ? 'kg' : 'lbs';

  // Welcome
  $('#dash-welcome').textContent = `¡Hola ${p.nickname}! 🔥`;
  const daysSince = entries.length > 0
    ? Math.floor((new Date() - new Date(entries[0].date + 'T12:00:00')) / (1000 * 60 * 60 * 24))
    : 0;
  $('#dash-subtitle').textContent = entries.length > 0
    ? `${entries.length} check-ins · Último ${daysSince === 0 ? 'hoy' : `hace ${daysSince} días`}`
    : '¡Registra tu primer check-in!';

  // Stats
  $('#stat-weight').textContent = CALC.formatWeight(currentLbs, up);
  $('#stat-lost').textContent = CALC.formatPercent(pctLost);
  $('#stat-bmi').textContent = bmi.toFixed(1);
  $('#stat-tdee').textContent = tdee.toLocaleString();

  const bmiBadge = $('#stat-bmi-badge');
  bmiBadge.textContent = bmiCat.label;
  bmiBadge.style.background = bmiCat.color + '22';
  bmiBadge.style.color = bmiCat.color;

  // Progress
  $('#progress-label').textContent = `${progress.toFixed(0)}% hacia tu peso ideal`;
  $('#progress-fill').style.width = `${progress}%`;

  // Weight change
  const changeEl = $('#dash-change');
  if (entries.length > 1) {
    const absChange = Math.abs(change);
    const changeLbl = CALC.formatWeight(absChange, up);
    if (change < 0) {
      changeEl.textContent = `⬇️ ${changeLbl} desde el último check-in`;
      changeEl.style.color = '#16a34a';
    } else if (change > 0) {
      changeEl.textContent = `⬆️ ${changeLbl} desde el último check-in`;
      changeEl.style.color = '#e11d48';
    } else {
      changeEl.textContent = '⏸️ Sin cambios';
      changeEl.style.color = '#78716c';
    }
  } else {
    changeEl.textContent = '🌟 ¡Primer check-in!';
    changeEl.style.color = '#f97316';
  }

  // Leaderboard
  await renderLeaderboard(p.id);

  // Weight history
  renderWeightHistory(entries, up);

  // Check-in form
  const placeholder = up === 'metric'
    ? `${CALC.lbsToKg(currentLbs).toFixed(1)} kg`
    : `${currentLbs.toFixed(1)} lbs`;
  $('#checkin-weight').value = '';
  $('#checkin-weight').placeholder = placeholder;
  $('#checkin-notes').value = '';

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === today);
  if (todayEntry) {
    $('#checkin-weight').value = CALC.lbsToInput(todayEntry.weight_lbs, up);
    $('#checkin-notes').value = todayEntry.notes || '';
    $('#checkin-submit').textContent = '✓ Actualizar';
  } else {
    $('#checkin-submit').textContent = '🔥 Registrar';
  }

  // Unit hint next to input
  let hint = $('#checkin-unit-hint');
  if (!hint) {
    hint = document.createElement('span');
    hint.id = 'checkin-unit-hint';
    hint.style.cssText = 'font-size:0.72rem;color:var(--stone-400);font-weight:600;flex-shrink:0;';
    $('#checkin-weight').parentNode.appendChild(hint);
  }
  hint.textContent = unitLabel;
}

async function renderLeaderboard(currentParticipantId) {
  try {
    const data = await getLeaderboardData();
    state.leaderboard = data;
    const container = $('#leaderboard-entries');
    container.innerHTML = '';

    if (data.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="emoji">🏆</div><p>Sin participantes aún</p></div>';
      return;
    }

    let currentRank = 0;
    let prevPct = Infinity;

    data.forEach((entry, idx) => {
      if (entry.percentLost < prevPct) currentRank = idx + 1;
      prevPct = entry.percentLost;

      const isYou = entry.id === currentParticipantId;
      const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
      const rankDisplay = medals[currentRank] || `#${currentRank}`;

      const row = document.createElement('div');
      row.className = 'leaderboard-entry';
      if (isYou) { row.style.background = 'rgba(249,115,22,0.05)'; row.style.borderRadius = '0.5rem'; }
      row.style.padding = '0.6rem 0.5rem';
      row.style.margin = '0 -0.5rem';

      const maxPct = Math.abs(data[0]?.percentLost || 1);
      const barWidth = maxPct > 0 ? (Math.abs(entry.percentLost) / maxPct) * 100 : 0;

      row.innerHTML = `
        <span class="rank">${rankDisplay}</span>
        <span class="avatar">${getAvatar(entry.nickname)}</span>
        <div class="info">
          <div class="name">${entry.nickname}${isYou ? ' <span class="you-tag">TÚ</span>' : ''}</div>
          <div class="detail">${CALC.formatWeight(entry.startingWeightLbs, entry.unitPreference)} → ${CALC.formatWeight(entry.currentWeightLbs, entry.unitPreference)}</div>
        </div>
        <div class="bar-wrap"><div class="bar-fill" style="width:${barWidth}%"></div></div>
        <span class="pct ${entry.percentLost > 0 ? 'success' : 'danger'}">${CALC.formatPercent(entry.percentLost)}</span>
      `;

      container.appendChild(row);
    });
  } catch (e) {
    console.error('Leaderboard error:', e);
    $('#leaderboard-entries').innerHTML = '<div class="empty-state"><p>Error al cargar clasificación</p></div>';
  }
}

function renderWeightHistory(entries, unitPref) {
  const container = $('#weight-history');
  container.innerHTML = '';

  if (entries.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="emoji">📝</div><p>No hay registros aún. ¡Haz tu primer check-in!</p></div>';
    return;
  }

  entries.slice(0, 7).forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'weight-entry';

    let changeHtml = '';
    if (idx < entries.length - 1) {
      const diff = entries[idx + 1].weight_lbs - entry.weight_lbs;
      if (diff !== 0) {
        const cls = diff < 0 ? 'down' : 'up';
        const sign = diff < 0 ? '⬇' : '⬆';
        const absDiff = unitPref === 'metric' ? CALC.lbsToKg(Math.abs(diff)) : Math.abs(diff);
        changeHtml = `<span class="we-change ${cls}">${sign} ${absDiff.toFixed(1)}</span>`;
      } else {
        changeHtml = `<span class="we-change" style="color:#a8a29e">⏸ 0.0</span>`;
      }
    }

    div.innerHTML = `
      <span class="we-date">${CALC.formatDate(entry.date)}</span>
      <span class="we-weight">${CALC.formatWeight(entry.weight_lbs, unitPref)}</span>
      ${changeHtml}
    `;
    container.appendChild(div);
  });
}

function getAvatar(nickname) {
  const emojis = ['🔥', '💪', '⚡', '🏃', '🎯', '🦅', '🌟', '🚀', '💥', '👑'];
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = ((hash << 5) - hash) + nickname.charCodeAt(i);
    hash |= 0;
  }
  return emojis[Math.abs(hash) % emojis.length];
}

// ════════════════════════════════════════════════════════════
// CHECK-IN
// ════════════════════════════════════════════════════════════

async function handleCheckIn(e) {
  e.preventDefault();
  if (!state.user || state.userType !== 'participant') return;

  const weightInput = $('#checkin-weight');
  const notesInput = $('#checkin-notes');
  const rawValue = parseFloat(weightInput.value);
  const up = getUnitPref();
  const weightLbs = up === 'metric' ? CALC.kgToLbs(rawValue) : rawValue;
  const notes = notesInput.value.trim();

  if (!rawValue || rawValue <= 0) { showToast('Ingresa un peso válido', 'error'); return; }

  const btn = $('#checkin-submit');
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Guardando...';

  try {
    const result = await addWeightEntry(state.user.id, weightLbs, notes);
    showToast(result.updated
      ? `✓ Actualizado a ${CALC.formatWeight(weightLbs, up)}`
      : `🔥 ${CALC.formatWeight(weightLbs, up)} registrado. ¡Sigue así!`, 'success');
    await renderDashboard();
  } catch (e) {
    showToast(e.message || 'Error al guardar', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ════════════════════════════════════════════════════════════
// ADMIN PANEL
// ════════════════════════════════════════════════════════════

async function renderAdminPanel() {
  if (!state.user || state.userType !== 'admin') return;
  $('#admin-title').textContent = `Panel de Admin · ${state.user.username} 🔥`;

  try {
    const participants = await getAllParticipants();
    const tbody = $('#admin-participants');
    tbody.innerHTML = '';

    if (participants.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state" style="padding:2rem;text-align:center"><div class="emoji">👥</div><p>No hay participantes aún</p></td></tr>';
      return;
    }

    for (const p of participants) {
      const entries = await getWeightEntries(p.id);
      const currentLbs = entries.length > 0 ? entries[0].weight_lbs : p.starting_weight_lbs;
      const idealLbs = CALC.idealWeight(p.sex, p.height_cm);
      const progress = CALC.progressToIdeal(p.starting_weight_lbs, currentLbs, idealLbs);
      const pctLost = CALC.percentLost(p.starting_weight_lbs, currentLbs);

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--orange-100)';
      tr.innerHTML = `
        <td style="padding:0.6rem 0;font-weight:700">${p.nickname} ${getAvatar(p.nickname)}</td>
        <td style="padding:0.6rem 0;font-size:0.85rem;color:var(--stone-400)">${CALC.formatHeight(p.height_cm, p.unit_preference)} · ${p.age} años</td>
        <td style="padding:0.6rem 0;font-size:0.85rem">${CALC.formatWeight(p.starting_weight_lbs, p.unit_preference)} → ${CALC.formatWeight(currentLbs, p.unit_preference)}</td>
        <td style="padding:0.6rem 0;font-weight:700;color:${pctLost > 0 ? '#16a34a' : 'var(--stone-400)'}">${CALC.formatPercent(pctLost)}</td>
        <td style="padding:0.6rem 0;text-align:right">
          <button class="btn btn-sm btn-danger admin-delete" data-id="${p.id}" data-name="${p.nickname}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    document.querySelectorAll('.admin-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        const name = btn.dataset.name;
        if (confirm(`¿Eliminar a ${name} y todo su historial?`)) {
          try {
            await deleteParticipant(id);
            showToast(`${name} eliminado`, 'info');
            await renderAdminPanel();
          } catch (e) {
            showToast('Error al eliminar', 'error');
          }
        }
      });
    });
  } catch (e) {
    console.error('Admin panel error:', e);
    showToast('Error cargando datos', 'error');
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
    showToast('Completa todos los campos', 'error'); return;
  }
  if (password.length < 4) { showToast('La contraseña debe tener al menos 4 caracteres', 'error'); return; }

  const btn = $('#admin-create-btn');
  btn.disabled = true;
  btn.textContent = 'Creando...';

  try {
    await createParticipant({
      nickname, password, age, sex: sex.value,
      heightCm, activityLevel, startingWeightLbs, unitPreference: unitPref
    });
    showToast(`✅ ${nickname} creado`, 'success');
    $('#admin-nickname').value = '';
    $('#admin-password').value = '';
    $('#admin-age').value = '';
    $('#admin-weight').value = '';
    await renderAdminPanel();
  } catch (e) {
    showToast(e.message || 'Error al crear participante', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔥 Crear Participante';
  }
}

// ════════════════════════════════════════════════════════════
// AUTH TABS
// ════════════════════════════════════════════════════════════

function initAuthTabs() {
  const adminTab = $('#login-tab-admin');
  const partTab = $('#login-tab-participant');
  adminTab.addEventListener('click', () => {
    adminTab.classList.add('active');
    partTab.classList.remove('active');
    $('#login-btn').textContent = '🔥 Ingresar como Admin';
    $('#login-title').textContent = 'Admin';
    $('#login-username').placeholder = 'Usuario admin';
  });
  partTab.addEventListener('click', () => {
    partTab.classList.add('active');
    adminTab.classList.remove('active');
    $('#login-btn').textContent = '🔥 Ingresar';
    $('#login-title').textContent = 'Participante';
    $('#login-username').placeholder = 'Nickname';
  });
}

// ════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initAuthTabs();

  $('#setup-form')?.addEventListener('submit', handleAdminSetup);
  $('#login-form')?.addEventListener('submit', handleLogin);
  $('#register-form')?.addEventListener('submit', handleRegister);
  $('#checkin-form')?.addEventListener('submit', handleCheckIn);
  $('#admin-create-form')?.addEventListener('submit', handleAdminCreateParticipant);
  $('#btn-logout')?.addEventListener('click', handleLogout);

  $('#go-to-register')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('register'); });
  $('#go-to-login')?.addEventListener('click', (e) => { e.preventDefault(); navigateTo('login'); });

  // ─── Weight mode toggle (register) ───
  $$('input[name="reg-weight-mode"]').forEach(r => {
    r.addEventListener('change', () => {
      const mode = document.querySelector('input[name="reg-weight-mode"]:checked').value;
      const input = $('#reg-weight');
      input.placeholder = mode === 'kg' ? '100 kg' : '220 lbs';
      input.value = '';
    });
  });

  // ─── Height hint converter ───
  function updateHeightHint(prefix) {
    const input = $(`#${prefix}-height`);
    const hint = $(`#${prefix}-height-hint`);
    const cm = parseFloat(input.value) * 100;
    if (cm && cm > 0) {
      const totalIn = Math.round(CALC.cmToInches(cm));
      const ft = Math.floor(totalIn / 12);
      const inches = totalIn % 12;
      hint.textContent = `${parseFloat(input.value).toFixed(2)} m ≈ ${ft}′${inches}″`;
    } else {
      hint.textContent = 'Ej: 1.75 m ≈ 5′9″';
    }
  }
  $('#reg-height')?.addEventListener('input', () => updateHeightHint('reg'));
  $('#admin-height')?.addEventListener('input', () => updateHeightHint('admin'));

  // ─── Weight mode toggle (admin) ───
  $$('input[name="admin-weight-mode"]').forEach(r => {
    r.addEventListener('change', () => {
      const mode = document.querySelector('input[name="admin-weight-mode"]:checked').value;
      const input = $('#admin-weight');
      input.placeholder = mode === 'kg' ? '100 kg' : '220 lbs';
      input.value = '';
    });
  });

  checkInitialSetup();
});
