// ════════════════════════════════════════════════════════════
// 📐 KILOS MORTALES — FÓRMULAS Y CÁLCULOS
// ════════════════════════════════════════════════════════════

const CALC = {

  // ─── Conversiones ───
  lbsToKg(lbs) {
    return lbs * 0.453592;
  },

  kgToLbs(kg) {
    return kg / 0.453592;
  },

  inchesToCm(inches) {
    return inches * 2.54;
  },

  cmToInches(cm) {
    return cm / 2.54;
  },

  ftInToInches(ft, _in) {
    return ft * 12 + _in;
  },

  // ─── BMI (universal) ───
  // Requiere peso en kg y altura en cm
  bmi(weightLbs, heightCm) {
    const weightKg = CALC.lbsToKg(weightLbs);
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  },

  bmiCategory(bmi) {
    if (bmi < 18.5) return { label: 'Bajo peso', color: '#fbbf24', emoji: '⚠️' };
    if (bmi < 25) return { label: 'Normal', color: '#22c55e', emoji: '✅' };
    if (bmi < 30) return { label: 'Sobrepeso', color: '#f97316', emoji: '⚡' };
    if (bmi < 35) return { label: 'Obesidad Grado I', color: '#ef4444', emoji: '🔴' };
    if (bmi < 40) return { label: 'Obesidad Grado II', color: '#dc2626', emoji: '⛔' };
    return { label: 'Obesidad Grado III', color: '#b91c1c', emoji: '🚨' };
  },

  // ─── Peso Ideal (Hamwi) ───
  // Requiere altura en cm, devuelve lbs
  idealWeight(sex, heightCm) {
    const heightIn = CALC.cmToInches(heightCm);
    const overFiveFt = Math.max(0, heightIn - 60);
    if (sex === 'male') {
      return 106 + 6 * overFiveFt;
    }
    return 100 + 5 * overFiveFt;
  },

  // ─── TDEE (Mifflin-St Jeor) ───
  tdee(sex, weightLbs, heightCm, age, activityLevel) {
    const weightKg = CALC.lbsToKg(weightLbs);
    let bmr;
    if (sex === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    const factors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      heavy: 1.725,
      very_heavy: 1.9
    };

    return Math.round(bmr * (factors[activityLevel] || 1.2));
  },

  activityLabels: {
    sedentary: 'Sedentario (poco o nada de ejercicio)',
    light: 'Ligero (1-3 días/semana)',
    moderate: 'Moderado (3-5 días/semana)',
    heavy: 'Intenso (6-7 días/semana)',
    very_heavy: 'Muy intenso (2x/día o trabajo físico)'
  },

  // ─── % Perdido ───
  percentLost(startWeightLbs, currentWeightLbs) {
    if (!startWeightLbs || !currentWeightLbs) return 0;
    return ((startWeightLbs - currentWeightLbs) / startWeightLbs) * 100;
  },

  // ─── % Progreso hacia peso ideal ───
  progressToIdeal(startWeightLbs, currentWeightLbs, idealWeightLbs) {
    const totalToLose = startWeightLbs - idealWeightLbs;
    if (totalToLose <= 0) return 100;
    const lostSoFar = startWeightLbs - currentWeightLbs;
    return Math.min(100, Math.max(0, (lostSoFar / totalToLose) * 100));
  },

  // ─── Cambio de peso ───
  weightChange(previousLbs, currentLbs) {
    if (!previousLbs || !currentLbs) return 0;
    return currentLbs - previousLbs;
  },

  // ─── Formateo según preferencia ───
  formatWeight(lbs, unitPref = 'imperial') {
    if (unitPref === 'metric') {
      return CALC.lbsToKg(lbs).toFixed(1) + ' kg';
    }
    return lbs.toFixed(1) + ' lbs';
  },

  formatHeight(cm, unitPref = 'imperial') {
    if (unitPref === 'imperial') {
      const totalIn = Math.round(CALC.cmToInches(cm));
      const ft = Math.floor(totalIn / 12);
      const inches = totalIn % 12;
      return `${ft}′${inches}″`;
    }
    return (cm / 100).toFixed(2) + ' m';
  },

  formatWeightInput(lbs, unitPref = 'imperial') {
    if (unitPref === 'metric') return CALC.lbsToKg(lbs);
    return lbs;
  },

  lbsToInput(lbs, unitPref) {
    return CALC.formatWeightInput(lbs, unitPref);
  },

  inputToLbs(value, unitPref) {
    if (unitPref === 'metric') return CALC.kgToLbs(value);
    return value;
  },

  formatPercent(value) {
    return (value >= 0 ? '-' : '+') + Math.abs(value).toFixed(1) + '%';
  },

  formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  },

  // ─── Peso en kg para inputs en metric ───
  formatWeightShort(lbs, unitPref) {
    if (unitPref === 'metric') return CALC.lbsToKg(lbs).toFixed(1);
    return lbs.toFixed(1);
  }

};
