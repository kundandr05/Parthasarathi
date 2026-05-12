import { generateDailyPlan } from './plannerEngine';

const includesAny = (text, words) => words.some((word) => text.includes(word));
const firstName = (profile) => profile?.fullName?.split(' ')[0] || profile?.displayName?.split(' ')[0] || 'there';

const recentCheckins = (memory) => memory?.checkins?.slice(-7) || [];
const latest = (memory) => memory?.today || recentCheckins(memory).at(-1) || {};

const average = (values) => {
  const valid = values.map(Number).filter(Number.isFinite);
  if (!valid.length) return 0;
  return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
};

const sleepInsight = (memory) => {
  const today = latest(memory);
  const avgSleep = average(recentCheckins(memory).map((item) => item.sleepHours));
  if (Number(today.sleepHours) && Number(today.sleepHours) < 6) {
    return `You logged only ${today.sleepHours} hours of sleep today, so keep your plan lighter and protect bedtime.`;
  }
  if (avgSleep && avgSleep < 6.5) {
    return `Your recent sleep average is ${avgSleep} hours, which may be pulling down your focus and mood.`;
  }
  return 'Your sleep target looks steady. Keep your wind-down simple and repeatable.';
};

const hydrationInsight = (memory) => {
  const today = latest(memory);
  const glasses = Number(today.waterGlasses || 0);
  if (today.waterCompleted || glasses >= 8) return 'Hydration is on track today.';
  if (glasses > 0) return `You have logged ${glasses} water glasses today. Aim for 8 by evening.`;
  return 'You have not logged water today yet. Start with one glass now.';
};

const openTasks = (memory) => (memory?.tasks || []).filter((task) => !task.completed);

const taskListText = (memory, limit = 5) => {
  const tasks = openTasks(memory).slice(0, limit);
  if (!tasks.length) return 'No active tasks are saved yet.';
  return tasks.map((task, index) => `${index + 1}. ${task.title}${task.dueText ? ` (${task.dueText})` : ''}`).join('\n');
};

const workoutPlan = (profile, memory) => {
  const level = profile?.workoutLevel || 'Beginner';
  const tired = Number(latest(memory).sleepHours) > 0 && Number(latest(memory).sleepHours) < 6;
  if (tired) {
    return `### Recovery Workout\nYou seem low on sleep, ${firstName(profile)}. Keep it gentle today:\n\n- 5 min mobility\n- 10 min walk or light cycling\n- 5 min stretching\n\nThis still supports **${profile?.fitnessGoal || 'your fitness goal'}** without draining you.`;
  }
  const sets = level === 'Advanced' ? '4 rounds' : level === 'Intermediate' ? '3 rounds' : '2 rounds';
  return `### Workout Plan\nFor your **${level}** level and goal of **${profile?.fitnessGoal || 'staying active'}**:\n\n- Warm-up: 5 minutes\n- Main set: ${sets} of squats, push-ups, lunges, and plank\n- Finish: 5 minutes stretching\n\nLog it after you finish so your weekly consistency improves.`;
};

const studyPlan = (profile, memory) => {
  const hours = Number(profile?.studyHours || 2);
  const block = hours >= 4 ? '50/10 deep work cycles' : '25/5 focus cycles';
  const goal = openTasks(memory)[0]?.title || latest(memory).mainGoal || profile?.studyGoal || 'your main study goal';
  return `### Study Plan\nToday's focus is **${goal}**.\n\n- Start with the hardest topic for one ${block}\n- Write a 3-item checklist before you begin\n- Review notes for 15 minutes at the end\n- Stop when the planned ${hours} hours are done so the habit stays sustainable\n\n**Active study/task queue:**\n${taskListText(memory, 4)}`;
};

const dailySummary = (profile, memory) => {
  const today = latest(memory);
  const mood = today.mood || 'not logged';
  const sleep = today.sleepHours ? `${today.sleepHours}h` : 'not logged';
  const water = today.waterCompleted ? 'complete' : `${today.waterGlasses || 0}/8 glasses`;
  const workout = today.workoutCompleted ? 'complete' : 'not complete';
  const completedTasks = (memory?.tasks || []).filter((task) => task.completed).length;
  return `### Daily Summary\n${firstName(profile)}, here is your local memory snapshot:\n\n- Mood: ${mood}\n- Sleep: ${sleep}\n- Water: ${water}\n- Workout: ${workout}\n- Main goal: ${today.mainGoal || profile?.productivityGoal || 'not set'}\n- Tasks completed: ${completedTasks}\n\n**Next tasks:**\n${taskListText(memory, 3)}\n\nBest next step: ${today.waterCompleted ? (openTasks(memory)[0]?.title || 'review your main task') : 'drink water and log it'}.`;
};

export const processChatMessage = (input, userProfile, memory = {}) => {
  const text = input.toLowerCase().trim();
  const name = firstName(userProfile);
  const today = latest(memory);

  if (includesAny(text, ['hello', 'hi', 'hey', 'good morning', 'good evening'])) {
    return `Hello ${name}. I remember your current goal is **${today.mainGoal || userProfile?.productivityGoal || userProfile?.studyGoal || 'building a better routine'}**. What do you want to improve right now?`;
  }

  if (includesAny(text, ['create my schedule', 'schedule', 'daily plan', 'routine', 'planner'])) {
    return generateDailyPlan(userProfile, memory);
  }

  if (includesAny(text, ['today goals', 'goals for today', 'my goals'])) {
    return `### Today's Goals\n- ${today.mainGoal || userProfile?.studyGoal || 'Complete your main focus task'}\n- Drink 8 glasses of water\n- ${userProfile?.fitnessGoal || 'Move your body for 20 minutes'}\n- Sleep near ${userProfile?.sleepTime || 'your target bedtime'}\n\n**Saved tasks:**\n${taskListText(memory, 5)}`;
  }

  if (includesAny(text, ['my tasks', 'task list', 'to do', 'todo', 'pending tasks'])) {
    return `### Active Tasks\n${taskListText(memory, 8)}\n\nTell me “remind me to ...” or add tasks from the dashboard, and I will keep using them in plans and summaries.`;
  }

  if (includesAny(text, ['workout', 'fitness', 'exercise', 'gym'])) {
    return workoutPlan(userProfile, memory);
  }

  if (includesAny(text, ['study plan', 'study', 'exam', 'learn', 'assignment'])) {
    return studyPlan(userProfile, memory);
  }

  if (includesAny(text, ['motivation', 'motivate', 'give up', 'lazy'])) {
    return `${name}, do the next small action, not the whole mountain. Your bigger target is **${userProfile?.studyGoal || userProfile?.productivityGoal || 'personal progress'}**. Set a 10-minute timer, start messy, and let momentum arrive after action.`;
  }

  if (includesAny(text, ['tired', 'exhausted', 'drained', 'low energy'])) {
    return `${name}, ${sleepInsight(memory)} ${hydrationInsight(memory)} Keep the next hour simple: water, a 10-minute reset, then one tiny task.`;
  }

  if (includesAny(text, ['sad', 'stress', 'stressed', 'anxious', 'overwhelmed', 'mood'])) {
    return `I am with you, ${name}. Your last mood entry is **${today.mood || 'not logged'}**. Try this: breathe slowly for one minute, write the one thing bothering you, then choose one controllable action. Want a lighter plan for today?`;
  }

  if (includesAny(text, ['sleep advice', 'sleep', 'insomnia', 'wake up'])) {
    return `### Sleep Advice\n${sleepInsight(memory)}\n\n- Target bedtime: ${userProfile?.sleepTime || '23:00'}\n- Target wake-up: ${userProfile?.wakeUpTime || '07:00'}\n- Stop heavy work 60 minutes before bed\n- Keep tomorrow's first task written down before you sleep`;
  }

  if (includesAny(text, ['hydration', 'water', 'thirsty'])) {
    return `### Hydration Tracking\n${hydrationInsight(memory)}\n\nUse the dashboard + button each time you drink. Your goal is 8 glasses, with 4 done by mid-day.`;
  }

  if (includesAny(text, ['productivity', 'focus', 'distract', 'procrastinate', 'tips'])) {
    return `### Productivity Tips\nFor your goal **${userProfile?.productivityGoal || 'better focus'}**:\n\n- Pick one outcome for the next 45 minutes\n- Remove one distraction physically\n- Work in a timed block\n- Log completion so your analytics reflect the win`;
  }

  if (includesAny(text, ['daily summary', 'summary', 'progress report', 'analytics'])) {
    return dailySummary(userProfile, memory);
  }

  if (includesAny(text, ['mood check', 'check in', 'daily check'])) {
    return `You can use the daily check-in popup from the dashboard, or tell me directly: mood, sleep hours, workout status, water status, and today's main goal. I will use it in future replies.`;
  }

  return `I am your local offline Life Assistant. I can help with **fitness, productivity, sleep tracking, study planning, hydration, motivation, mood check-ins, daily summaries, and routine building**.\n\nTry: "create my schedule", "today goals", "workout plan", "study plan", "sleep advice", "hydration tracking", or "daily summary".`;
};
