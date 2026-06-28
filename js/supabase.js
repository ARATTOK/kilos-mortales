// ════════════════════════════════════════════════════════════
// 🔌 KILOS MORTALES — SUPABASE CLIENT
// ════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://hwrklhfrnxdrjofqtsgl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3cmtsaGZybnhkcmpvZnF0c2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTU3NzYsImV4cCI6MjA5ODE3MTc3Nn0.A7aBAcCIxj7zw1DnUZeqGGQ4XEvSoAXL_k08Cb_Sq8Y';

let sb = null;

function getSupabase() {
  if (sb) return sb;
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });
  return sb;
}

// ─── Password hashing (SHA-256) ───
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

// ════════════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════════════

async function checkAdminExists() {
  const { data, error } = await getSupabase()
    .from('admin')
    .select('id')
    .limit(1);
  if (error) throw error;
  return data && data.length > 0;
}

async function createAdmin(username, password) {
  const passwordHash = await hashPassword(password);
  const { data, error } = await getSupabase()
    .from('admin')
    .insert({ username, password_hash: passwordHash })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function adminLogin(username, password) {
  const { data, error } = await getSupabase()
    .from('admin')
    .select('*')
    .eq('username', username)
    .single();
  if (error || !data) throw new Error('Admin no encontrado');
  const valid = await verifyPassword(password, data.password_hash);
  if (!valid) throw new Error('Contraseña incorrecta');
  return data;
}

// ════════════════════════════════════════════════════════════
// PARTICIPANTS
// ════════════════════════════════════════════════════════════

async function createParticipant(data) {
  const passwordHash = await hashPassword(data.password);
  const payload = {
    nickname: data.nickname,
    password_hash: passwordHash,
    sex: data.sex,
    height_cm: data.heightCm,
    age: data.age,
    activity_level: data.activityLevel,
    starting_weight_lbs: data.startingWeightLbs,
    unit_preference: data.unitPreference || 'metric'
  };
  const { data: result, error } = await getSupabase()
    .from('participants')
    .insert(payload)
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new Error('Ese nickname ya existe');
    throw error;
  }
  return result;
}

async function participantLogin(nickname, password) {
  const { data, error } = await getSupabase()
    .from('participants')
    .select('*')
    .eq('nickname', nickname)
    .single();
  if (error || !data) throw new Error('Participante no encontrado');
  const valid = await verifyPassword(password, data.password_hash);
  if (!valid) throw new Error('Contraseña incorrecta');
  return data;
}

async function getAllParticipants() {
  const { data, error } = await getSupabase()
    .from('participants')
    .select('*')
    .order('nickname');
  if (error) throw error;
  return data || [];
}

async function getParticipant(id) {
  const { data, error } = await getSupabase()
    .from('participants')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function deleteParticipant(id) {
  const { error } = await getSupabase()
    .from('participants')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ════════════════════════════════════════════════════════════
// WEIGHT ENTRIES
// ════════════════════════════════════════════════════════════

async function addWeightEntry(participantId, weightLbs, notes) {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await getSupabase()
    .from('weight_entries')
    .select('id')
    .eq('participant_id', participantId)
    .eq('date', today);

  if (existing && existing.length > 0) {
    const { data, error } = await getSupabase()
      .from('weight_entries')
      .update({ weight_lbs: weightLbs, notes: notes || null, created_at: new Date().toISOString() })
      .eq('id', existing[0].id)
      .select()
      .single();
    if (error) throw error;
    return { ...data, updated: true };
  }

  const { data, error } = await getSupabase()
    .from('weight_entries')
    .insert({
      participant_id: participantId,
      weight_lbs: weightLbs,
      date: today,
      notes: notes || null
    })
    .select()
    .single();
  if (error) throw error;
  return { ...data, updated: false };
}

async function getWeightEntries(participantId) {
  const { data, error } = await getSupabase()
    .from('weight_entries')
    .select('*')
    .eq('participant_id', participantId)
    .order('date', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

async function getLatestWeight(participantId) {
  const { data, error } = await getSupabase()
    .from('weight_entries')
    .select('*')
    .eq('participant_id', participantId)
    .order('date', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
}

// ════════════════════════════════════════════════════════════
// LEADERBOARD
// ════════════════════════════════════════════════════════════

async function getLeaderboardData() {
  const participants = await getAllParticipants();
  if (participants.length === 0) return [];

  const result = [];

  for (const p of participants) {
    const entries = await getWeightEntries(p.id);
    let currentWeightLbs;

    if (entries.length > 0) {
      currentWeightLbs = entries[0].weight_lbs;
    } else {
      currentWeightLbs = p.starting_weight_lbs;
    }

    const pct = CALC.percentLost(p.starting_weight_lbs, currentWeightLbs);
    const bmi = CALC.bmi(currentWeightLbs, p.height_cm);
    const idealLbs = CALC.idealWeight(p.sex, p.height_cm);
    const progress = CALC.progressToIdeal(p.starting_weight_lbs, currentWeightLbs, idealLbs);
    const bmiCat = CALC.bmiCategory(bmi);

    result.push({
      id: p.id,
      nickname: p.nickname,
      startingWeightLbs: p.starting_weight_lbs,
      currentWeightLbs,
      percentLost: pct,
      bmi,
      bmiCategory: bmiCat,
      idealWeightLbs: idealLbs,
      progressToIdeal: progress,
      entriesCount: entries.length,
      sex: p.sex,
      heightCm: p.height_cm,
      age: p.age,
      unitPreference: p.unit_preference
    });
  }

  result.sort((a, b) => b.percentLost - a.percentLost);
  return result;
}
