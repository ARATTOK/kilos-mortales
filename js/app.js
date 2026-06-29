const state = {
  currentView: null,
  user: null,
  userType: null,
  weightUnit: 'kg',
  heightUnit: 'metric',
  leaderboard: [],
  participantData: null,
  weightHistory: [],
  chartInstances: {}
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const STORAGE_KEY = 'km_session';

const ACTIVITIES = [
  { cat: 'exercise', id: 'correr', label: 'Correr', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M11 8l-2 6 3-1 1 6"/><path d="M5 13l5-1 1 3"/><path d="M15 10l4-2"/></svg>' },
  { cat: 'exercise', id: 'caminar', label: 'Caminar', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M10 8l-1 6 3-1 1 5"/><path d="M6 13l4-1"/><path d="M15 12l3-2"/></svg>' },
  { cat: 'exercise', id: 'pesas', label: 'Pesas', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="4" height="6" rx="1"/><rect x="18" y="9" width="4" height="6" rx="1"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="8" y1="9" x2="16" y2="15"/><line x1="8" y1="15" x2="16" y2="9"/></svg>' },
  { cat: 'exercise', id: 'yoga', label: 'Yoga', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><path d="M12 8v4l-5 5"/><path d="M17 17l-5-5"/><path d="M6 14h12"/></svg>' },
  { cat: 'exercise', id: 'bici', label: 'Bici', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="16" r="3"/><circle cx="17" cy="16" r="3"/><path d="M10 16l2-7h4"/><path d="M7 16l4-3 3 3"/><path d="M12 9l3 3-3 3"/></svg>' },
  { cat: 'exercise', id: 'nadar', label: 'Nadar', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="2"/><path d="M11 8l-1 4h4l1 4"/><path d="M2 16c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/><path d="M2 20c2-1 4-1 6 0s4 1 6 0 4-1 6 0"/></svg>' },
  { cat: 'exercise', id: 'deporte', label: 'Deporte', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 4v16"/><path d="M4 12h16"/><circle cx="12" cy="12" r="3"/></svg>' },
  { cat: 'exercise', id: 'hogar', label: 'Hogar', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h2l7-7 7 7h2"/><path d="M8 21v-8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8"/></svg>' },
  { cat: 'nutrition', id: 'no-soda', label: 'Sin Coca', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12l-1 4H7Z"/><path d="M7 6v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6"/><line x1="3" y1="3" x2="21" y2="21"/></svg>' },
  { cat: 'nutrition', id: 'no-bread', label: 'Sin Pan', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11c0-4 3-7 7-7s7 3 7 7c0 2-1 3-2 4H7c-1-1-2-2-2-4Z"/><path d="M9 15l-1 5h8l-1-5"/><line x1="3" y1="3" x2="21" y2="21"/></svg>' },
  { cat: 'nutrition', id: 'ayuno', label: 'Ayuno', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>' },
  { cat: 'nutrition', id: 'agua', label: 'Agua', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C7 9 5 13 5 17a7 7 0 0 0 14 0c0-4-2-8-7-15Z"/></svg>' }
];

function getLocalDate() {
  return new Intl.DateTimeFormat('en-CA').format(new Date());
}

function saveSession() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    user: state.user,
    userType: state.userType,
    weightUnit: state.weightUnit,
    heightUnit: state.heightUnit
  }));
}

function loadSession() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (data && data.user && data.userType) {
      state.user = data.user;
      state.userType = data.userType;
      state.weightUnit = data.weightUnit || 'kg';
      state.heightUnit = data.heightUnit || 'metric';
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

  const isLoggedIn = state.user && (viewId === 'home' || viewId === 'leaderboard' || viewId === 'rules' || viewId === 'stats' || viewId === 'checkin' || viewId === 'info');
  const navbar = $('#navbar');
  const bottomNav = $('#bottom-nav');
  const footer = $('#site-footer');

  document.body.classList.add('has-navbar');
  if (viewId === 'admin') {
    navbar.querySelector('.nav-right').classList.remove('hidden');
    document.body.classList.remove('has-bottom-nav');
    bottomNav.classList.add('hidden');
    footer.classList.add('hidden');
    document.body.classList.add('no-bottom-nav');
    $('#nav-username').textContent = 'Admin';
    updateToggles();
  } else if (isLoggedIn) {
    navbar.querySelector('.nav-right').classList.remove('hidden');
    document.body.classList.add('has-bottom-nav');
    bottomNav.classList.remove('hidden');
    footer.classList.remove('hidden');
    document.body.classList.remove('no-bottom-nav');
    $('#nav-username').textContent = state.user?.nickname || '';
    updateToggles();
  } else {
    document.body.classList.remove('has-bottom-nav');
    bottomNav.classList.add('hidden');
    footer.classList.add('hidden');
    document.body.classList.add('no-bottom-nav');
  }

  // Update bottom nav active
  $$('#bottom-nav .nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewId);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getWeightUnit() {
  return state.weightUnit;
}

function getHeightUnit() {
  return state.heightUnit;
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
      state.weightUnit = user.weight_unit || 'kg';
      state.heightUnit = user.height_unit || 'metric';
      saveSession();
      updateToggles();
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
  const wu = getWeightUnit();
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
    ? `${entries.length} reportes · ${CALC.formatWeight(currentLbs, wu)} actual`
    : '¡Registra tu primer reporte!';

  const changeEl = $('#home-change');
  if (entries.length > 1) {
    const absC = Math.abs(change);
    const cLabel = CALC.formatWeight(absC, wu);
    if (change < 0) { changeEl.className = 'change-banner down'; changeEl.textContent = `${cLabel} menos desde el último reporte`; }
    else if (change > 0) { changeEl.className = 'change-banner up'; changeEl.textContent = `${cLabel} más desde el último reporte`; }
    else { changeEl.className = 'change-banner flat'; changeEl.textContent = 'Sin cambios'; }
  } else {
    changeEl.className = 'change-banner first';
    changeEl.textContent = 'Primer reporte! Regístrate cada semana.';
  }

  // Stats
  $('#hstat-weight').textContent = CALC.formatWeightShort(currentLbs, wu);
  $('#hstat-weight').closest('.stat-pill').querySelector('.lbl').textContent = wu === 'kg' ? 'Peso (kg)' : 'Peso (lbs)';
  $('#hstat-lost').textContent = CALC.formatPercent(pctLost);
  $('#hstat-bmi').textContent = bmi.toFixed(1);
  $('#hstat-tdee').textContent = tdee.toLocaleString();

  // Progress
  const pctColor = progress < 0 ? '#ef4444' : progress < 25 ? '#f97316' : progress < 50 ? '#eab308' : progress < 75 ? '#22c55e' : '#16a34a';
  $('#home-current-weight').textContent = CALC.formatWeight(currentLbs, wu);
  $('#home-ideal-weight').textContent = CALC.formatWeight(idealLbs, wu);
  $('#home-progress-label').textContent = `${progress.toFixed(0)}%`;
  $('#home-progress-label').style.color = pctColor;
  const fill = $('#home-progress-fill');
  fill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  fill.style.background = pctColor;
  if (entries.length > 0) {
    const diffToIdeal = Math.abs(currentLbs - idealLbs);
    const dir = currentLbs > idealLbs ? 'perder' : 'ganar';
    const remain = CALC.formatWeight(diffToIdeal, wu) + ' ' + wu;
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
  renderTips(entries);
}

// ─── Daily Tips ───

const TIPS = [
  // ── TDEE tips ──
  { cat: 'tdee', icon: 'tdee', text: (p, tdee, bmi) => `Tu cuerpo gasta aproximadamente <strong>${tdee.toLocaleString()} kcal/día</strong> (TDEE). Consumir entre <strong>${(tdee - 500).toLocaleString()}–${(tdee - 1000).toLocaleString()} kcal/día</strong> te haría perder 0.5–1 kg por semana, según el NIH.` },
  { cat: 'tdee', icon: 'tdee', text: () => 'El TDEE se compone de: metabolismo basal (60–75%), actividad física (15–30%) y efecto térmico de los alimentos (~10%). Aumentar tu actividad diaria es la forma más efectiva de incrementarlo.' },
  { cat: 'tdee', icon: 'tdee', text: () => 'Comer por debajo de <strong>1200 kcal/día</strong> (mujeres) o <strong>1500 kcal/día</strong> (hombres) puede ralentizar tu metabolismo y causar pérdida muscular. No bajes de esos mínimos sin supervisión médica.' },
  { cat: 'tdee', icon: 'tdee', text: () => 'El efecto térmico de los alimentos (TEF) representa ~10% del TDEE. Las proteínas tienen el TEF más alto (20–30%), seguidas de carbohidratos (5–10%) y grasas (0–3%).' },
  { cat: 'tdee', icon: 'tdee', text: () => 'Caminar 10,000 pasos al día quema entre 300–500 kcal adicionales. Incorporar una caminata de 30 min después de comer ayuda a la digestión y mejora el control de glucosa.' },
  { cat: 'tdee', icon: 'tdee', text: (p, tdee) => `Según tu nivel de actividad (${p.activity_level}), tu TDEE es de <strong>${tdee.toLocaleString()} kcal</strong>. Si aumentas tu nivel de actividad, podrías elevar tu TDEE en 200–500 kcal sin cambiar tu dieta.` },
  { cat: 'tdee', icon: 'tdee', text: () => 'El músculo quema más calorías en reposo que la grasa (~6 kcal/kg vs ~2 kcal/kg). Incorporar entrenamiento de fuerza 2–3 veces por semana ayuda a mantener tu metabolismo elevado.' },
  { cat: 'tdee', icon: 'tdee', text: () => 'Un déficit de 500 kcal/día es considerado moderado y sostenible. Déficits mayores a 1000 kcal/día pueden aumentar el riesgo de pérdida muscular y deficiencias nutricionales.' },

  // ── BMI tips ──
  { cat: 'bmi', icon: 'bmi', condition: (p, tdee, bmi) => bmi < 18.5, text: () => 'Tu BMI indica bajo peso. Un BMI menor a 18.5 puede estar asociado con deficiencias nutricionales. Consulta con un profesional para asegurar una ingesta calórica y proteica adecuada.' },
  { cat: 'bmi', icon: 'bmi', condition: (p, tdee, bmi) => bmi >= 18.5 && bmi < 25, text: () => 'Tu BMI está en el rango normal (18.5–24.9). Según la OMS, este rango se asocia con menor riesgo de enfermedades crónicas. Enfócate en mantener hábitos saludables.' },
  { cat: 'bmi', icon: 'bmi', condition: (p, tdee, bmi) => bmi >= 25 && bmi < 30, text: () => 'Tu BMI indica sobrepeso (25–29.9). Reducir un 5–10% de tu peso corporal ya mejora significativamente tu salud cardiovascular y metabólica, según el NIH.' },
  { cat: 'bmi', icon: 'bmi', condition: (p, tdee, bmi) => bmi >= 30, text: () => 'Tu BMI indica obesidad (≥30). La OMS reconoce la obesidad como una enfermedad crónica. Perder incluso un 5% de tu peso reduce el riesgo de diabetes tipo 2 e hipertensión.' },
  { cat: 'bmi', icon: 'bmi', text: () => 'El BMI es una herramienta de cribado, no un diagnóstico. Personas con mucha masa muscular pueden tener un BMI elevado sin tener exceso de grasa corporal.' },

  // ── Waist tips ──
  { cat: 'waist', icon: 'waist', condition: (p, tdee, bmi, entries) => { const w = entries.find(e => e.waist_cm); return w && w.waist_cm >= (p.sex === 'male' ? 102 : 88); }, text: (p, tdee, bmi, entries) => { const w = entries.find(e => e.waist_cm); const threshold = p.sex === 'male' ? 102 : 88; return `Tu cintura (${w.waist_cm} cm) supera el umbral de riesgo (${threshold} cm). La grasa abdominal es un predictor independiente de enfermedades cardiovasculares y diabetes tipo 2 (CDC, NIH).`; } },
  { cat: 'waist', icon: 'waist', condition: (p, tdee, bmi, entries) => { const w = entries.find(e => e.waist_cm); return w && w.waist_cm < (p.sex === 'male' ? 102 : 88); }, text: (p, tdee, bmi, entries) => { const w = entries.find(e => e.waist_cm); const threshold = p.sex === 'male' ? 102 : 88; return `Tu cintura (${w.waist_cm} cm) está por debajo del umbral de riesgo (${threshold} cm). Mantener este nivel reduce significativamente el riesgo de síndrome metabólico.`; } },
  { cat: 'waist', icon: 'waist', text: () => 'La circunferencia de cintura mide la grasa visceral, que es metabólicamente más activa que la grasa subcutánea. Reducir 5–10 cm de cintura se asocia con mejoras significativas en marcadores de salud.' },

  // ── Progress tips ──
  { cat: 'progress', icon: 'progress', condition: (p, tdee, bmi, entries, progress) => entries.length > 0 && progress >= 100, text: () => '¡Has alcanzado tu peso ideal! Ahora enfócate en mantenerlo. El NIH recomienda pesarse semanalmente y mantener el mismo nivel de actividad para evitar recuperar el peso perdido.' },
  { cat: 'progress', icon: 'progress', condition: (p, tdee, bmi, entries, progress) => entries.length > 0 && progress >= 50 && progress < 100, text: (p, tdee, bmi, entries, progress) => `¡Excelente! Has completado el <strong>${progress.toFixed(0)}%</strong> del camino a tu peso ideal. Sigue así — la constancia es la clave.` },
  { cat: 'progress', icon: 'progress', condition: (p, tdee, bmi, entries, progress) => entries.length > 0 && progress >= 25 && progress < 50, text: (p, tdee, bmi, entries, progress) => `Vas por buen camino: <strong>${progress.toFixed(0)}%</strong> de tu meta. Recuerda que perder peso muy rápido (>1 kg/semana) puede aumentar la pérdida muscular.` },
  { cat: 'progress', icon: 'progress', condition: (p, tdee, bmi, entries, progress) => entries.length > 0 && progress >= 0 && progress < 25, text: (p, tdee, bmi, entries, progress) => `Has comenzado tu viaje: <strong>${progress.toFixed(0)}%</strong> hacia tu peso ideal. Los primeros cambios son los más importantes — establece una rutina sostenible.` },
  { cat: 'progress', icon: 'progress', condition: (p, tdee, bmi, entries, progress) => entries.length > 0 && progress < 0, text: () => 'Tu peso actual se ha alejado de tu peso ideal. No te desanimes — analiza qué cambios en tu rutina pudieron afectar y retoma el plan. La consistencia es más importante que la perfección.' },

  // ── Nutrition tips ──
  { cat: 'nutrition', icon: 'nutrition', text: () => 'Aumentar el consumo de proteína magra (pollo, pescado, huevos, legumbres) ayuda a preservar masa muscular durante el déficit calórico. Apunta a 1.6–2.2 g de proteína por kg de peso corporal.' },
  { cat: 'nutrition', icon: 'nutrition', text: () => 'Las verduras de hoja verde y los vegetales ricos en fibra (brócoli, espinaca, coliflor) aportan volumen a tus comidas con muy pocas calorías. Llena la mitad de tu plato con ellos.' },
  { cat: 'nutrition', icon: 'nutrition', text: () => 'Beber agua antes de las comidas puede reducir la ingesta calórica en un 13%, según estudios. Apunta a 2–3 litros de agua al día.' },
  { cat: 'nutrition', icon: 'nutrition', text: () => 'Dormir 7–9 horas es crucial para la pérdida de peso. La falta de sueño aumenta el cortisol y la grelina (hormona del hambre), lo que dificulta mantener un déficit calórico.' },
  { cat: 'nutrition', icon: 'nutrition', text: () => 'Las dietas muy restrictivas suelen fallar a largo plazo. El NIH recomienda un déficit de 500–1000 kcal/día combinado con cambios sostenibles en el estilo de vida.' },
  { cat: 'nutrition', icon: 'nutrition', text: () => 'Comer conscientemente (sin pantallas, masticando lento) puede reducir naturalmente la ingesta calórica. El cerebro tarda ~20 minutos en registrar la saciedad.' },

  // ── Activity tips ──
  { cat: 'activity', icon: 'activity', text: () => 'El ejercicio aeróbico (correr, nadar, bici) quema calorías durante la actividad. El entrenamiento de fuerza (pesas, calistenia) eleva el metabolismo basal por horas después del ejercicio.' },
  { cat: 'activity', icon: 'activity', text: () => 'La combinación de cardio + fuerza es más efectiva para la pérdida de grasa que cualquiera de los dos por separado. Ideal: 3 días de fuerza + 2–3 días de cardio.' },
  { cat: 'activity', icon: 'activity', text: () => 'El NEAT (Non-Exercise Activity Thermogenesis) —actividades cotidianas como caminar, limpiar, subir escaleras— puede representar hasta 500 kcal/día adicionales. Pequeños cambios suman.' },
  { cat: 'activity', icon: 'activity', text: () => 'El entrenamiento HIIT (intervalos de alta intensidad) quema más calorías en menos tiempo y produce el "afterburn" (EPOC): tu cuerpo sigue quemando calorías hasta 24 horas después.' },

  // ── Motivation tips ──
  { cat: 'motivation', icon: 'motivation', text: () => 'La consistencia supera a la intensidad. Es mejor hacer ejercicio moderado 5 días a la semana que uno muy intenso que no puedas mantener.' },
  { cat: 'motivation', icon: 'motivation', text: () => 'Llevar un registro semanal (como haces aquí) es una de las estrategias más efectivas para mantener el rumbo. ¡Sigue reportándote!' },
  { cat: 'motivation', icon: 'motivation', text: () => 'Celebra las pequeñas victorias: cada kilo perdido, cada semana consistente, cada hábito nuevo. El cambio real se construye con pequeñas decisiones diarias.' },
  { cat: 'motivation', icon: 'motivation', text: () => 'Compartir tu progreso con amigos (o competir en el ranking) aumenta la adherencia. El apoyo social es uno de los predictores más fuertes de éxito en cambios de estilo de vida.' },
  { cat: 'motivation', icon: 'motivation', condition: (p, tdee, bmi, entries) => entries.length >= 4, text: () => 'Llevas al menos un mes reportándote — ¡eso es compromiso! Las personas que registran su peso semanalmente tienen significativamente más éxito en mantener la pérdida de peso a largo plazo.' },
];

function getApplicableTips() {
  if (!state.user || state.userType !== 'participant') return [];
  const p = state.user;
  const entries = state.weightHistory || [];
  const currentLbs = entries.length > 0 ? entries[0].weight_lbs : p.starting_weight_lbs;
  const bmi = CALC.bmi(currentLbs, p.height_cm);
  const tdee = CALC.tdee(p.sex, currentLbs, p.height_cm, p.age, p.activity_level);
  const idealLbs = CALC.idealWeight(p.sex, p.height_cm);
  const progress = CALC.progressToIdeal(p.starting_weight_lbs, currentLbs, idealLbs);

  return TIPS.filter(tip => !tip.condition || tip.condition(p, tdee, bmi, entries, progress));
}

function renderTips(entries) {
  const card = $('#home-tip-card');
  const icon = $('#home-tip-icon');
  const cat = $('#home-tip-cat');
  const text = $('#home-tip-text');
  if (!card || !icon || !cat || !text) return;
  const tips = getApplicableTips();
  if (!tips.length) { card.style.display = 'none'; return; }

  // Deterministic pick: same tip all day, changes daily
  const dateStr = getLocalDate();
  const seed = dateStr + '-' + (state.user?.id || '0');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const tip = tips[Math.abs(hash) % tips.length];
  if (!tip) { card.style.display = 'none'; return; }

  const p = state.user;
  const wEntries = state.weightHistory || [];
  const currentLbs = wEntries.length > 0 ? wEntries[0].weight_lbs : p.starting_weight_lbs;
  const bmi = CALC.bmi(currentLbs, p.height_cm);
  const tdee = CALC.tdee(p.sex, currentLbs, p.height_cm, p.age, p.activity_level);
  const idealLbs = CALC.idealWeight(p.sex, p.height_cm);
  const progress = CALC.progressToIdeal(p.starting_weight_lbs, currentLbs, idealLbs);
  const html = tip.text(p, tdee, bmi, wEntries, progress);

  const catColors = {
    tdee: { bg: 'rgba(8,145,178,0.12)', border: '#0891b2', label: 'Calorías y TDEE' },
    bmi: { bg: 'rgba(124,58,237,0.12)', border: '#7c3aed', label: 'BMI' },
    waist: { bg: 'rgba(225,29,72,0.12)', border: '#e11d48', label: 'Cintura' },
    progress: { bg: 'rgba(22,163,74,0.12)', border: '#16a34a', label: 'Progreso' },
    nutrition: { bg: 'rgba(202,138,4,0.12)', border: '#ca8a04', label: 'Nutrición' },
    activity: { bg: 'rgba(234,88,12,0.12)', border: '#ea580c', label: 'Actividad' },
    motivation: { bg: 'rgba(99,102,241,0.12)', border: '#6366f1', label: 'Motivación' }
  };
  const colors = catColors[tip.cat] || catColors.tdee;

  card.style.display = '';
  card.style.borderLeft = `4px solid ${colors.border}`;
  card.style.background = colors.bg;
  icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="${colors.border}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px;"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
  cat.textContent = colors.label;
  cat.style.color = colors.border;
  text.innerHTML = html;
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
    const wu = getWeightUnit();

    // Hero
    const hero = $('#ranking-hero');
    if (data.length > 0) {
      const top = data[0];
      hero.querySelector('.hero-rank').textContent = '1';
      hero.querySelector('.hero-name').textContent = top.nickname;
      hero.querySelector('.hero-pct').textContent = CALC.formatPercent(top.percentLost);
      hero.querySelector('.hero-detail').textContent =
        `${CALC.formatWeight(top.startingWeightLbs, wu)} → ${CALC.formatWeight(top.currentWeightLbs, wu)} · ${top.entriesCount} reportes`;
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
    const distinctPcts = [...new Set(data.map(e => e.percentLost))].length;

    function rankColor(r, total) {
      const t = total <= 1 ? 0 : (r - 1) / (total - 1);
      const R = Math.round(249 + (225 - 249) * t);
      const G = Math.round(115 + (29 - 115) * t);
      const B = Math.round(22 + (72 - 22) * t);
      return `rgb(${R},${G},${B})`;
    }

    data.forEach((entry) => {
      if (entry.percentLost < prevPct) rank++;
      prevPct = entry.percentLost;
      const isYou = entry.id === currentId;
      const lbsLost = entry.startingWeightLbs - entry.currentWeightLbs;
      const c = rankColor(rank, distinctPcts);
      const rankDisplay = `<span class="rank-badge" style="background:${c};color:#fff;">#${rank}</span>`;

      // Progress toward ideal weight
      const prog = entry.progressToIdeal;
      const progColor = prog >= 100 ? '#16a34a' : (prog >= 50 ? '#22c55e' : (prog > 0 ? '#f97316' : '#e11d48'));

      // Percent intensity
      const pct = entry.percentLost;
      const pctClass = pct > 0 ? (pct >= 10 ? 'great' : 'good') : 'bad';
      const alpha = isYou ? 0.12 : 0.06;
      const rowBg = c.replace('rgb', 'rgba').replace(')', `,${alpha})`);

      const div = document.createElement('div');
      div.className = `ranking-item${isYou ? ' is-you' : ''}`;
      div.style.background = rowBg;
      div.style.borderColor = c.replace('rgb', 'rgba').replace(')', ',0.15)');
      div.innerHTML = `
        <div class="r-rank">${rankDisplay}</div>
        <div class="r-avatar">${getAvatar(entry.nickname)}</div>
        <div class="r-info">
          <div class="r-name">
            <button class="r-name-btn" data-participant-id="${entry.id}">${entry.nickname}</button>
            ${isYou ? ' <span class="tag">TÚ</span>' : ''}
          </div>
          <div class="r-detail">
            ${CALC.formatWeight(entry.startingWeightLbs, wu)} → ${CALC.formatWeight(entry.currentWeightLbs, wu)}
            ${lbsLost > 0 ? ` <span class="r-lost">${CALC.formatWeightShort(lbsLost, wu)} perdidos</span>` : ''}
          </div>
        </div>
        <div class="r-ideal">
          <div class="r-ideal-val" style="color:${prog >= 100 ? '#16a34a' : 'var(--orange-500)'}">${CALC.formatWeight(entry.idealWeightLbs, wu)}</div>
          <div class="r-ideal-lbl">ideal</div>
        </div>
        <div class="r-side">
          <div class="r-pct ${pctClass}">${CALC.formatPercent(pct)}</div>
          <div class="r-sub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px;vertical-align:middle;margin-right:2px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${entry.entriesCount}
          </div>
        </div>
        <div class="r-bar-wrap">
          <div class="r-bar-label">${prog.toFixed(0)}% del ideal</div>
          <div class="r-bar-track">
            <div class="r-bar-fill" style="width:${prog}%;background:${progColor};"></div>
          </div>
        </div>
      `;
      list.appendChild(div);
    });

    // Click on participant name → open stats modal
    list.querySelectorAll('.r-name-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.participantId);
        const entry = data.find(d => d.id === id);
        if (entry) openParticipantStats(entry);
      });
    });
  } catch (e) {
    console.error('Ranking error:', e);
    $('#ranking-list').innerHTML = '<div class="empty-state"><p>Error al cargar</p></div>';
  }
}

async function openParticipantStats(entry) {
  const modal = $('#participant-modal');
  const body = $('#participant-modal-body');
  if (!modal || !body) return;
  const wu = getWeightUnit();
  const hu = getHeightUnit();

  // Fetch entries for this participant
  let entries = [];
  try { entries = await getWeightEntries(entry.id); } catch (_) {}

  const lbsLost = entry.startingWeightLbs - entry.currentWeightLbs;
  const bmiCat = CALC.bmiCategory(entry.bmi);
  const prog = entry.progressToIdeal;

  // Last 5 entries for mini history
  const recent = entries.slice(0, 5);

  const ACTIVITIES_MAP = {};
  (ACTIVITIES || []).forEach(a => { ACTIVITIES_MAP[a.id] = a; });

  body.innerHTML = `
    <div class="pstats-header">
      <span class="avatar-init avatar-init-lg" style="width:3rem;height:3rem;font-size:1.2rem;">${entry.nickname.charAt(0).toUpperCase()}</span>
      <div>
        <div class="pstats-name">${entry.nickname}</div>
        <div class="pstats-sub">${entry.age} años · ${CALC.formatHeight(entry.heightCm, hu)}</div>
      </div>
    </div>

    <div class="pstats-grid">
      <div class="pstats-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><circle cx="12" cy="12" r="3"/><path d="M12 1v8"/><path d="M12 15v8"/><path d="M4 12H1"/><path d="M23 12h-3"/></svg>
        <div class="pstats-card-val">${CALC.formatWeight(entry.startingWeightLbs, wu)}</div>
        <div class="pstats-card-lbl">Inicial</div>
      </div>
      <div class="pstats-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <div class="pstats-card-val">${CALC.formatWeight(entry.currentWeightLbs, wu)}</div>
        <div class="pstats-card-lbl">Actual</div>
      </div>
      <div class="pstats-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
        <div class="pstats-card-val" style="color:${prog >= 100 ? '#16a34a' : 'var(--orange-500)'}">${CALC.formatWeight(entry.idealWeightLbs, wu)}</div>
        <div class="pstats-card-lbl">Ideal</div>
      </div>
      <div class="pstats-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <div class="pstats-card-val ${lbsLost > 0 ? 'down' : ''}">${lbsLost > 0 ? '-' : ''}${CALC.formatWeightShort(Math.abs(lbsLost), wu)}</div>
        <div class="pstats-card-lbl">Perdido</div>
      </div>
    </div>

    <div class="pstats-progress">
      <div class="pstats-progress-label">
        <span>Progreso hacia tu peso ideal</span>
        <span class="pstats-progress-pct">${prog.toFixed(0)}%</span>
      </div>
      <div class="r-bar-track">
        <div class="r-bar-fill" style="width:${prog}%;background:${prog >= 100 ? '#16a34a' : (prog >= 50 ? '#22c55e' : '#f97316')};"></div>
      </div>
    </div>

    <div class="pstats-row">
      <div class="pstats-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        <span>BMI <strong>${entry.bmi.toFixed(1)}</strong> <span class="pstats-bmi-cat">${bmiCat}</span></span>
      </div>
      <div class="pstats-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span>${entry.entriesCount} reportes</span>
      </div>
    </div>

    ${recent.length > 0 ? `
    <div class="pstats-section-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Últimos reportes
    </div>
    <div class="pstats-history">
      ${recent.map(e => {
        const acts = e.activities
          ? e.activities.split(',').map(id => ACTIVITIES_MAP[id]).filter(Boolean)
          : [];
        const actIcons = acts.length > 0
          ? acts.slice(0, 4).map(a => a.svg + `<span style="font-size:0.6rem;vertical-align:middle;margin-left:1px;color:var(--stone-400);">${a.label}</span>`).join(' ')
          : '';
        return `
          <div class="pstats-entry">
            <span class="pstats-entry-date">${CALC.formatDate(e.date)} ${e.created_at ? `<span class="pstats-entry-time">${CALC.formatDateTime(e.created_at)}</span>` : ''}</span>
            <span class="pstats-entry-weight">${CALC.formatWeight(e.weight_lbs, wu)}</span>
            ${actIcons ? `<span class="pstats-entry-acts">${actIcons}</span>` : ''}
          </div>
        `;
      }).join('')}
    </div>` : ''}
  `;

  modal.classList.remove('hidden');
}

function closeParticipantStats() {
  const modal = $('#participant-modal');
  if (modal) modal.classList.add('hidden');
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
  const wu = getWeightUnit();
  const pd = state.participantData;
  const entries = state.weightHistory;

  // ─── Chart: Personal weight ───
  safeDestroy('chart-weight');
  const dates = entries.map(e => CALC.formatDate(e.date)).reverse();
  const weights = entries.map(e => wu === 'kg' ? CALC.lbsToKg(e.weight_lbs) : e.weight_lbs).reverse();
  const unitLbl = wu === 'kg' ? 'kg' : 'lbs';
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
                return `${CALC.formatWeight(entry.startingWeightLbs, wu)} → ${CALC.formatWeight(entry.currentWeightLbs, wu)}`;
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
      weeklyChanges.push(wu === 'kg' ? CALC.lbsToKg(diff) : diff);
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
// RULES
// ════════════════════════════════════════════

function renderRules() {
  // Static content — nothing to compute
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
    const hu = getHeightUnit();
    const isMetric = hu === 'metric';
    const threshold = p.sex === 'male' ? 102 : 88;
    const displayVal = isMetric ? latestWaist : CALC.cmToInches(latestWaist).toFixed(1);
    const displayThreshold = isMetric ? threshold : CALC.cmToInches(threshold).toFixed(1);
    const displayUnit = isMetric ? 'cm' : 'in';
    const atRisk = latestWaist >= threshold;
    waistEl.style.display = '';
    waistEl.style.background = atRisk ? 'rgba(244,63,94,0.08)' : 'rgba(34,197,94,0.08)';
    waistEl.style.borderLeft = `3px solid ${atRisk ? '#f43f5e' : '#22c55e'}`;
    waistEl.textContent = atRisk
      ? `Tu cintura (${displayVal} ${displayUnit}) está por encima del umbral de riesgo (${displayThreshold} ${displayUnit}).`
      : `Tu cintura (${displayVal} ${displayUnit}) está por debajo del umbral de riesgo (${displayThreshold} ${displayUnit}).`;
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
  const wu = getWeightUnit();
  const hu = getHeightUnit();
  const entries = state.weightHistory.length ? state.weightHistory : await getWeightEntries(p.id);
  state.weightHistory = entries;

  const currentLbs = entries.length > 0 ? entries[0].weight_lbs : p.starting_weight_lbs;
  const prevLbs = entries.length > 1 ? entries[1].weight_lbs : p.starting_weight_lbs;
  const change = CALC.weightChange(prevLbs, currentLbs);

  // Last weight display
  $('#checkin-last-weight').textContent = CALC.formatWeightShort(currentLbs, wu);
  $('#checkin-last-label').textContent = entries.length > 0
    ? `${CALC.formatDate(entries[0].date)} · ${CALC.formatWeight(currentLbs, wu)}`
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
      const details = [CALC.formatWeightShort(found.weight_lbs, wu)];
      if (found.waist_cm) {
        const wv = hu === 'imperial' ? CALC.cmToInches(found.waist_cm).toFixed(1) : found.waist_cm;
        const wl = hu === 'imperial' ? 'in' : 'cm';
        details.push(`cintura ${wv}${wl}`);
      }
      if (found.body_fat_pct) details.push(`grasa ${found.body_fat_pct}%`);
      if (found.activities) {
        const acts = found.activities.split(',').map(id => ACTIVITIES.find(a => a.id === id)).filter(Boolean);
        if (acts.length) details.push(acts.map(a => a.label).join(', '));
      }
      dot.title = `${dateStr}: ${details.join(' · ')}`;
    } else if (i === 0) {
      dot.classList.add('today');
      dot.textContent = '•';
    } else {
      dot.textContent = d.getDate();
    }
    grid.appendChild(dot);
  }

  // Units
  const isWaistMetric = hu === 'metric';
  $('#checkin-unit-label').textContent = wu;
  $('#checkin-waist-label').textContent = `Cintura (${isWaistMetric ? 'cm' : 'in'})`;
  $('#checkin-waist-unit-label').textContent = isWaistMetric ? 'cm' : 'in';

  // Activity picker
  renderActivityPicker();

  // Form
  $('#checkin-weight').value = '';
  $('#checkin-weight').placeholder = CALC.formatWeightShort(currentLbs, wu);
  $('#checkin-waist').value = '';
  $('#checkin-waist').placeholder = isWaistMetric ? 'Opcional' : 'Opcional (in)';
  $('#checkin-bf').value = '';
  $('#checkin-notes').value = '';
  clearActivitySelection();

  const todayEntry = entries.find(e => e.date === getLocalDate());
  if (todayEntry) {
    $('#checkin-weight').value = CALC.lbsToInput(todayEntry.weight_lbs, wu);
    $('#checkin-waist').value = isWaistMetric
      ? (todayEntry.waist_cm || '')
      : (todayEntry.waist_cm ? CALC.cmToInches(todayEntry.waist_cm).toFixed(1) : '');
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
      if (diff < 0) changeHtml = `<span class="we-change down">-${CALC.formatWeightShort(Math.abs(diff), wu)} ${wu}</span>`;
      else if (diff > 0) changeHtml = `<span class="we-change up">+${CALC.formatWeightShort(diff, wu)} ${wu}</span>`;
      else changeHtml = `<span class="we-change" style="color:#a8a29e">0</span>`;
    }
    let extra = '';
    if (entry.waist_cm) {
      const wv = hu === 'imperial' ? CALC.cmToInches(entry.waist_cm).toFixed(1) : entry.waist_cm;
      extra += ` · ${wv}${hu === 'imperial' ? 'in' : 'cm'}`;
    }
    if (entry.body_fat_pct) extra += ` · ${entry.body_fat_pct}%`;
    if (entry.activities) {
      const acts = entry.activities.split(',').map(id => ACTIVITIES.find(a => a.id === id)).filter(Boolean);
      if (acts.length) {
        extra += ` · ${acts.map(a => {
          const icon = a.svg.replace('viewBox="0 0 24 24"', 'viewBox="0 0 24 24" style="width:12px;height:12px;vertical-align:middle;"');
          return icon + `<span style="font-size:0.65rem;vertical-align:middle;margin-left:1px;">${a.label}</span>`;
        }).join(' ')}`;
      }
    }
    div.innerHTML = `
      <span class="we-date">${CALC.formatDate(entry.date)} <span class="we-time">${CALC.formatDateTime(entry.created_at)}</span></span>
      <span class="we-weight">${CALC.formatWeight(entry.weight_lbs, wu)}</span>
      <span>${changeHtml}</span>
      ${extra ? `<span class="we-extra">${extra}</span>` : ''}
      ${idx === 0 ? `
        <span class="we-actions">
          <button class="btn-icon btn-icon-edit" data-entry-id="${entry.id}" data-action="edit" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar
          </button>
          <button class="btn-icon btn-icon-delete" data-entry-id="${entry.id}" data-action="delete" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Eliminar
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
  const wu = getWeightUnit();
  const hu = getHeightUnit();

  $('#entry-edit-weight').value = wu === 'kg' ? CALC.lbsToKg(entry.weight_lbs) : entry.weight_lbs;
  const isWaistMetric = hu === 'metric';
  $('#entry-edit-waist').value = isWaistMetric
    ? (entry.waist_cm || '')
    : (entry.waist_cm ? CALC.cmToInches(entry.waist_cm).toFixed(1) : '');
  $('#entry-edit-waist-unit').textContent = isWaistMetric ? 'cm' : 'in';
  $('#entry-edit-bf').value = entry.body_fat_pct || '';
  $('#entry-edit-notes').value = entry.notes || '';
  $('#entry-edit-unit-label').textContent = wu;

  // Activity picker inside modal
  const container = $('#entry-edit-activity-picker');
  container.innerHTML = '';
  const selectedActs = entry.activities ? entry.activities.split(',') : [];
  let lastCat = '';
  ACTIVITIES.forEach(a => {
    if (a.cat !== lastCat) {
      if (lastCat !== '') {
        const divider = document.createElement('div');
        divider.className = 'activity-divider';
        container.appendChild(divider);
      }
      const sectionLabel = document.createElement('div');
      sectionLabel.className = 'activity-section-label';
      sectionLabel.textContent = a.cat === 'nutrition' ? 'Alimentación' : 'Ejercicio';
      container.appendChild(sectionLabel);
      lastCat = a.cat;
    }
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

    const wu = getWeightUnit();
    const hu = getHeightUnit();
    const raw = parseFloat($('#entry-edit-weight').value);
    if (!raw || raw <= 0) { showToast('Ingresa un peso válido', 'error'); btn.disabled = false; btn.textContent = 'Guardar cambios'; return; }
    if (wu === 'kg' && (raw < 10 || raw > 400)) { showToast(`¿${raw} kg? Ese peso no parece real`, 'error'); btn.disabled = false; btn.textContent = 'Guardar cambios'; return; }
    if (wu === 'lbs' && (raw < 22 || raw > 880)) { showToast(`¿${raw} lbs? Ese peso no parece real`, 'error'); btn.disabled = false; btn.textContent = 'Guardar cambios'; return; }
    const weightLbs = wu === 'kg' ? CALC.kgToLbs(raw) : raw;
    const waistRaw = parseFloat($('#entry-edit-waist').value);
    let waistCm = null;
    if (waistRaw > 0) {
      if (waistRaw < 10) { showToast('La cintura debe ser mayor a 10', 'error'); btn.disabled = false; btn.textContent = 'Guardar cambios'; return; }
      waistCm = hu === 'imperial' ? CALC.inchesToCm(waistRaw) : waistRaw;
    }
    const bodyFatPct = parseFloat($('#entry-edit-bf').value) || null;
    if (bodyFatPct !== null && (bodyFatPct < 1 || bodyFatPct > 80)) { showToast('% grasa corporal inválido (1-80)', 'error'); btn.disabled = false; btn.textContent = 'Guardar cambios'; return; }
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
  let lastCat = '';
  ACTIVITIES.forEach(a => {
    if (a.cat !== lastCat) {
      if (lastCat !== '') {
        const divider = document.createElement('div');
        divider.className = 'activity-divider';
        container.appendChild(divider);
      }
      const sectionLabel = document.createElement('div');
      sectionLabel.className = 'activity-section-label';
      sectionLabel.textContent = a.cat === 'nutrition' ? 'Alimentación' : 'Ejercicio';
      container.appendChild(sectionLabel);
      lastCat = a.cat;
    }
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
  const wu = getWeightUnit();
  const hu = getHeightUnit();
  if (!raw || raw <= 0) { showToast('Ingresa un peso válido', 'error'); return; }
  if (wu === 'kg' && (raw < 10 || raw > 400)) { showToast(`¿${raw} kg? Ese peso no parece real (10-400 kg)`, 'error'); return; }
  if (wu === 'lbs' && (raw < 22 || raw > 880)) { showToast(`¿${raw} lbs? Ese peso no parece real (22-880 lbs)`, 'error'); return; }
  const weightLbs = wu === 'kg' ? CALC.kgToLbs(raw) : raw;

  const waistRaw = parseFloat($('#checkin-waist').value);
  let waistCm = null;
  if (waistRaw > 0) {
    const wl = hu === 'imperial' ? 'in' : 'cm';
    if (waistRaw < 10) { showToast(`La cintura debe ser mayor a 10 ${wl}`, 'error'); return; }
    if (waistRaw > (hu === 'imperial' ? 100 : 250)) { showToast(`Cintura demasiado alta (>${hu === 'imperial' ? 100 : 250} ${wl})`, 'error'); return; }
    waistCm = hu === 'imperial' ? CALC.inchesToCm(waistRaw) : waistRaw;
  }
  const bfRaw = parseFloat($('#checkin-bf').value);
  const bodyFatPct = bfRaw > 0 ? bfRaw : null;
  if (bodyFatPct !== null && (bodyFatPct < 1 || bodyFatPct > 80)) { showToast('% grasa corporal inválido (1-80)', 'error'); return; }
  const notes = $('#checkin-notes').value.trim();
  const activities = Array.from($$('.activity-btn.active')).map(b => b.dataset.id).join(',') || null;

  const btn = $('#checkin-submit');
  btn.disabled = true;
  const orig = btn.textContent;
  btn.textContent = 'Guardando...';
  try {
    const result = await addWeightEntry(state.user.id, weightLbs, waistCm, bodyFatPct, activities, notes);
    showToast(result.updated
      ? `Actualizado a ${CALC.formatWeight(weightLbs, wu)}`
      : `${CALC.formatWeight(weightLbs, wu)} registrado. Semana #${state.weightHistory.length + 1}!`, 'success');
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
  const wu = getWeightUnit();
  const hu = getHeightUnit();

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
        <td style="padding:0.5rem 0;font-size:0.78rem;color:var(--stone-400)">${CALC.formatHeight(p.height_cm, hu)} · ${p.age}a</td>
        <td style="padding:0.5rem 0;font-size:0.8rem;">${CALC.formatWeight(p.starting_weight_lbs, wu)} → ${CALC.formatWeight(currentLbs, wu)}</td>
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
          const wu = p.weight_unit || 'kg';
          const hu = p.height_unit || 'metric';
          $('#edit-nickname').value = p.nickname;
          $('#edit-age').value = p.age;
          document.querySelector(`input[name="edit-sex"][value="${p.sex}"]`).checked = true;
          $('#edit-height').value = (p.height_cm / 100).toFixed(2);
          document.querySelector(`input[name="edit-weight-mode"][value="${wu}"]`).checked = true;
          $('#edit-weight').value = wu === 'kg' ? CALC.lbsToKg(p.starting_weight_lbs).toFixed(1) : p.starting_weight_lbs.toFixed(1);
          $('#edit-activity').value = p.activity_level;
          document.querySelector(`input[name="edit-wt-unit"][value="${wu}"]`).checked = true;
          document.querySelector(`input[name="edit-ht-unit"][value="${hu}"]`).checked = true;
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
  const wtUnit = document.querySelector('input[name="admin-wt-unit"]:checked').value;
  const htUnit = document.querySelector('input[name="admin-ht-unit"]:checked').value;

  if (!nickname || !password || !age || !sex || !heightCm || !weightVal || !activityLevel) {
    showToast('Completa todos', 'error'); return;
  }

  const btn = $('#admin-create-btn');
  btn.disabled = true; btn.textContent = 'Creando...';
  try {
    await createParticipant({ nickname, password, age, sex: sex.value, heightCm, activityLevel, startingWeightLbs, unitPreference: wtUnit === 'kg' && htUnit === 'metric' ? 'metric' : 'imperial', weightUnit: wtUnit, heightUnit: htUnit });
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

function updateToggles() {
  const wt = $('#wt-toggle');
  if (wt) {
    wt.textContent = state.weightUnit;
    const isKg = state.weightUnit === 'kg';
    wt.title = isKg ? 'Cambiar a libras' : 'Cambiar a kilogramos';
    wt.style.borderColor = isKg ? '#22c55e' : '#f97316';
    wt.style.color = isKg ? '#22c55e' : '#f97316';
  }
  const ht = $('#ht-toggle');
  if (ht) {
    ht.textContent = state.heightUnit === 'metric' ? 'cm' : 'in';
    const isCm = state.heightUnit === 'metric';
    ht.title = isCm ? 'Cambiar a inches' : 'Cambiar a centímetros';
    ht.style.borderColor = isCm ? '#22c55e' : '#f97316';
    ht.style.color = isCm ? '#22c55e' : '#f97316';
  }
}

async function handleWeightToggle() {
  state.weightUnit = state.weightUnit === 'kg' ? 'lbs' : 'kg';
  saveSession();
  updateToggles();

  if (state.userType === 'participant' && state.user) {
    try {
      await updateParticipant(state.user.id, { weight_unit: state.weightUnit });
      state.user.weight_unit = state.weightUnit;
    } catch (_) {}
  }

  Object.values(state.chartInstances).forEach(c => { try { c.destroy(); } catch(_) {} });
  state.chartInstances = {};

  const view = state.currentView;
  if (view === 'home') await renderHome();
  else if (view === 'leaderboard') await renderLeaderboard();
  else if (view === 'rules') renderRules();
  else if (view === 'stats') renderStats();
  else if (view === 'checkin') await renderCheckin();
  else if (view === 'info') await renderInfo();
  else if (view === 'admin') { switchAdminView('participants'); await renderAdminPanel(); }
  await updateReportBanner();

  showToast(`Peso en ${state.weightUnit}`, 'info');
}

async function handleHeightToggle() {
  state.heightUnit = state.heightUnit === 'metric' ? 'imperial' : 'metric';
  saveSession();
  updateToggles();

  if (state.userType === 'participant' && state.user) {
    try {
      await updateParticipant(state.user.id, { height_unit: state.heightUnit });
      state.user.height_unit = state.heightUnit;
    } catch (_) {}
  }

  Object.values(state.chartInstances).forEach(c => { try { c.destroy(); } catch(_) {} });
  state.chartInstances = {};

  const view = state.currentView;
  if (view === 'home') await renderHome();
  else if (view === 'leaderboard') await renderLeaderboard();
  else if (view === 'rules') renderRules();
  else if (view === 'stats') renderStats();
  else if (view === 'checkin') await renderCheckin();
  else if (view === 'info') await renderInfo();
  else if (view === 'admin') { switchAdminView('participants'); await renderAdminPanel(); }
  await updateReportBanner();

  const label = state.heightUnit === 'metric' ? 'cm' : 'ft/in';
  showToast(`Altura en ${label}`, 'info');
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
  $('#participant-modal-close')?.addEventListener('click', closeParticipantStats);
  $('#participant-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeParticipantStats(); });

  // Forms
  $('#setup-form')?.addEventListener('submit', handleAdminSetup);
  $('#login-form')?.addEventListener('submit', handleLogin);
  $('#checkin-form')?.addEventListener('submit', handleCheckIn);
  $('#admin-create-form')?.addEventListener('submit', handleAdminCreateParticipant);
  $('#btn-logout')?.addEventListener('click', handleLogout);
  $('#wt-toggle')?.addEventListener('click', handleWeightToggle);
  $('#ht-toggle')?.addEventListener('click', handleHeightToggle);
  $('#home-go-ranking')?.addEventListener('click', async () => { showView('leaderboard'); await renderLeaderboard(); await updateReportBanner(); });
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
    const editWu = document.querySelector('input[name="edit-wt-unit"]:checked').value;
    const editHu = document.querySelector('input[name="edit-ht-unit"]:checked').value;
    if (!nickname || !age || !sex || !heightCm || !weightVal || !activityLevel) {
      showToast('Completa todos', 'error'); return;
    }
    const btn = $('#admin-edit-save');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      await updateParticipant(pid, { nickname, age, sex, height_cm: heightCm, starting_weight_lbs: startingWeightLbs, activity_level: activityLevel, unit_preference: editWu === 'kg' && editHu === 'metric' ? 'metric' : 'imperial', weight_unit: editWu, height_unit: editHu });
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
      else if (view === 'rules') renderRules();
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
      updateToggles();
      showView('home');
      renderHome();
    }
  } else {
    checkInitialSetup();
  }
});

// ─── Console helpers (password reset) ───

async function resetPassword(nickname, newPassword) {
  try {
    const { data: parts } = await getSupabase()
      .from('participants')
      .select('id')
      .eq('nickname', nickname);
    if (parts && parts.length > 0) {
      await updateParticipantPassword(parts[0].id, newPassword);
      console.log(`✅ Contraseña de "${nickname}" cambiada a "${newPassword}"`);
    } else {
      const { data: admins } = await getSupabase()
        .from('admin')
        .select('id')
        .eq('username', nickname);
      if (admins && admins.length > 0) {
        const hash = await hashPassword(newPassword);
        await getSupabase().from('admin').update({ password_hash: hash }).eq('id', admins[0].id);
        console.log(`✅ Contraseña de admin "${nickname}" cambiada a "${newPassword}"`);
      } else {
        console.log(`❌ No se encontró "${nickname}"`);
      }
    }
  } catch (e) { console.log('❌ Error:', e.message || e); }
}
