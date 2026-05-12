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

export const loadTasks = (uid) => loadArray(storageKeys(uid).tasks);

export const saveTasks = (uid, tasks) => saveArray(storageKeys(uid).tasks, tasks);

export const addTask = (uid, title, meta = {}) => {
  const cleaned = title.trim();
  if (!cleaned) return loadTasks(uid);
  const tasks = loadTasks(uid);
  const next = [
    {
      id: Date.now(),
      title: cleaned,
      completed: false,
      priority: meta.priority || 'normal',
      source: meta.source || 'manual',
      dueText: meta.dueText || '',
      createdAt: new Date().toISOString(),
      completedAt: '',
    },
    ...tasks,
  ].slice(0, 80);
  saveTasks(uid, next);
  return next;
};

export const toggleTask = (uid, taskId) => {
  const tasks = loadTasks(uid);
  const next = tasks.map((task) => task.id === taskId
    ? { ...task, completed: !task.completed, completedAt: task.completed ? '' : new Date().toISOString() }
    : task);
  saveTasks(uid, next);
  return next;
};

export const deleteTask = (uid, taskId) => {
  const next = loadTasks(uid).filter((task) => task.id !== taskId);
  saveTasks(uid, next);
  return next;
};

export const updateTask = (uid, taskId, patch) => {
  const next = loadTasks(uid).map((task) => task.id === taskId ? { ...task, ...patch } : task);
  saveTasks(uid, next);
  return next;
};

export const extractSmartMemories = (message) => {
  const text = message.trim();
  const lower = text.toLowerCase();
  const memories = [];
  const tasks = [];

  const goalMatch = lower.match(/\b(?:i want to|i need to|my goal is|goal is|i have to)\s+(.+)/i);
  if (goalMatch?.[1]) {
    const value = goalMatch[1].replace(/[.!?]$/, '').trim();
    memories.push(`Goal noted: ${value}`);
    tasks.push({ title: value, priority: 'high', source: 'chat-goal' });
  }

  const eventMatch = lower.match(/\b(?:exam|test|interview|meeting|deadline|submission)\b.*?(?:on|by|this|next)?\s*([a-z]+day|tomorrow|today|tonight|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)/i);
  if (eventMatch) {
    memories.push(`Important date: ${text}`);
    tasks.push({ title: `Prepare for ${text}`, priority: 'high', source: 'chat-event', dueText: eventMatch[1] });
  }

  const reminderMatch = lower.match(/\b(?:remind me to|remember to|add task|todo|to-do)\s+(.+)/i);
  if (reminderMatch?.[1]) {
    const value = reminderMatch[1].replace(/[.!?]$/, '').trim();
    memories.push(`Reminder requested: ${value}`);
    tasks.push({ title: value, priority: 'normal', source: 'chat-reminder' });
  }

  const preferenceMatch = lower.match(/\b(?:i like|i prefer|i don't like|i hate|i love)\s+(.+)/i);
  if (preferenceMatch?.[1]) {
    memories.push(`Preference: ${text}`);
  }

  return { memories, tasks };
};

export const saveExtractedMemories = (uid, message) => {
  const extracted = extractSmartMemories(message);
  let memories = loadArray(storageKeys(uid).memories);
  let tasks = loadTasks(uid);

  if (extracted.memories.length) {
    const timestamp = new Date().toISOString();
    memories = [
      ...memories,
      ...extracted.memories.map((text, index) => ({ id: Date.now() + index, text, createdAt: timestamp })),
    ].slice(-80);
    saveArray(storageKeys(uid).memories, memories);
  }

  if (extracted.tasks.length) {
    const timestamp = new Date().toISOString();
    const newTasks = extracted.tasks.map((task, index) => ({
      id: Date.now() + 100 + index,
      title: task.title,
      completed: false,
      priority: task.priority,
      source: task.source,
      dueText: task.dueText || '',
      createdAt: timestamp,
      completedAt: '',
    }));
    tasks = [...newTasks, ...tasks].slice(0, 80);
    saveTasks(uid, tasks);
  }

  return { memories, tasks, extracted };
};

export const loadLifeMemory = (uid) => ({
  checkins: loadCheckins(uid),
  today: getTodayCheckin(uid),
  tasks: loadTasks(uid),
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
