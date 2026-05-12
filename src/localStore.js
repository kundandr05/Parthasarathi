const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const storageKeys = (uid) => ({
  profile: `user_full_profile_${uid}`,
  sessions: `chat_sessions_${uid}`,
  checkins: `daily_checkins_${uid}`,
  memories: `user_memories_${uid}`,
  tasks: `daily_tasks_${uid}`,
  reminders: `daily_reminders_${uid}`,
});

export const loadArray = (key) => safeParse(localStorage.getItem(key), []);
export const saveArray = (key, value) => localStorage.setItem(key, JSON.stringify(value || []));
export const loadObject = (key, fallback = {}) => safeParse(localStorage.getItem(key), fallback);
export const saveObject = (key, value) => localStorage.setItem(key, JSON.stringify(value || {}));

export const loadCheckins = (uid) => loadArray(storageKeys(uid).checkins);

export const getTodayCheckin = (uid) => {
  const today = todayKey();
  return loadCheckins(uid).find((item) => item.date === today) || null;
};

export const upsertTodayCheckin = (uid, data) => {
  const key = storageKeys(uid).checkins;
  const today = todayKey();
  const checkins = loadArray(key).filter((item) => item.date !== today);
  const next = {
    date: today,
    mood: data.mood || 'Okay',
    sleepHours: Number(data.sleepHours || 0),
    workoutCompleted: Boolean(data.workoutCompleted),
    waterCompleted: Boolean(data.waterCompleted),
    waterGlasses: Number(data.waterGlasses ?? (data.waterCompleted ? 8 : 0)),
    mainGoal: data.mainGoal || '',
    completedTasks: Number(data.completedTasks || 0),
    productivityScore: Number(data.productivityScore || 0),
    updatedAt: new Date().toISOString(),
  };
  const result = [...checkins, next].slice(-30);
  saveArray(key, result);
  return next;
};

export const updateTodayCheckin = (uid, patch) => {
  const current = getTodayCheckin(uid) || {};
  return upsertTodayCheckin(uid, { ...current, ...patch });
};

export const addMemory = (uid, memory) => {
  const key = storageKeys(uid).memories;
  const memories = loadArray(key);
  const next = [
    ...memories,
    { id: Date.now(), text: memory, createdAt: new Date().toISOString() },
  ].slice(-80);
  saveArray(key, next);
  return next;
};

export const loadLifeMemory = (uid) => ({
  checkins: loadCheckins(uid),
  today: getTodayCheckin(uid),
  tasks: loadArray(storageKeys(uid).tasks),
  reminders: loadArray(storageKeys(uid).reminders),
  memories: loadArray(storageKeys(uid).memories),
});

export const weeklySummary = (uid) => {
  const checkins = loadCheckins(uid).slice(-7);
  const avg = (values) => {
    const valid = values.filter((value) => Number.isFinite(value));
    if (!valid.length) return 0;
    return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
  };
  const completed = (key) => checkins.filter((item) => item[key]).length;
  const moodScore = { Sad: 1, Okay: 2, Good: 3, Great: 4 };

  return {
    days: checkins.length,
    avgSleep: avg(checkins.map((item) => Number(item.sleepHours))),
    avgWater: avg(checkins.map((item) => Number(item.waterGlasses || (item.waterCompleted ? 8 : 0)))),
    avgProductivity: avg(checkins.map((item) => Number(item.productivityScore))),
    workoutDays: completed('workoutCompleted'),
    hydrationDays: completed('waterCompleted'),
    avgMood: avg(checkins.map((item) => moodScore[item.mood] || 2)),
  };
};
