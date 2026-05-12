const toMinutes = (time = '07:00') => {
  const [hours, minutes] = time.split(':').map(Number);
  return (Number.isFinite(hours) ? hours : 7) * 60 + (Number.isFinite(minutes) ? minutes : 0);
};

const fromMinutes = (minutes) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = String(Math.floor(normalized / 60)).padStart(2, '0');
  const m = String(normalized % 60).padStart(2, '0');
  return `${h}:${m}`;
};

const workoutDuration = (level = 'Beginner') => {
  if (level === 'Advanced') return 55;
  if (level === 'Intermediate') return 40;
  return 25;
};

export const buildPlanBlocks = (userProfile, memory = {}) => {
  const wake = toMinutes(userProfile?.wakeUpTime || '07:00');
  const sleep = toMinutes(userProfile?.sleepTime || '23:00');
  const studyHours = Math.max(1, Number(userProfile?.studyHours || 2));
  const today = memory.today || {};
  const lowEnergy = Number(today.sleepHours) > 0 && Number(today.sleepHours) < 6;
  const studyBlock = Math.min(studyHours * 60, lowEnergy ? 120 : 240);
  const workout = lowEnergy ? 15 : workoutDuration(userProfile?.workoutLevel);
  const windDownStart = sleep - 60;

  return [
    {
      time: `${fromMinutes(wake)} - ${fromMinutes(wake + 45)}`,
      title: 'Morning reset',
      detail: 'Hydrate, light movement, and choose one priority for the day.',
    },
    {
      time: `${fromMinutes(wake + 75)} - ${fromMinutes(wake + 75 + studyBlock)}`,
      title: userProfile?.occupation?.toLowerCase().includes('student') ? 'Study block' : 'Deep work block',
      detail: `Focus on ${today.mainGoal || userProfile?.studyGoal || userProfile?.productivityGoal || 'your main goal'} with short breaks.`,
    },
    {
      time: `${fromMinutes(wake + 75 + studyBlock + 60)} - ${fromMinutes(wake + 75 + studyBlock + 80)}`,
      title: 'Hydration and review',
      detail: today.waterCompleted ? 'Keep water steady and review progress.' : 'Drink water and log your next glass.',
    },
    {
      time: `${fromMinutes(Math.max(wake + 600, windDownStart - workout - 90))} - ${fromMinutes(Math.max(wake + 600, windDownStart - 90))}`,
      title: 'Workout',
      detail: `${workout} minutes at ${userProfile?.workoutLevel || 'Beginner'} level for ${userProfile?.fitnessGoal || 'general fitness'}.`,
    },
    {
      time: `${fromMinutes(windDownStart)} - ${fromMinutes(sleep)}`,
      title: 'Sleep wind-down',
      detail: 'Dim screens, prepare tomorrow, and protect your sleep target.',
    },
  ];
};

export const generateDailyPlan = (userProfile, memory = {}) => {
  if (!userProfile) return 'I need your onboarding profile before I can build a personalized plan.';

  const blocks = buildPlanBlocks(userProfile, memory);
  const today = memory.today || {};
  const energyNote = Number(today.sleepHours) && Number(today.sleepHours) < 6
    ? 'You logged low sleep, so I kept the plan lighter and recovery-friendly.'
    : 'The plan balances focus, movement, hydration, and rest.';

  return [
    '### Your Personalized Daily Plan',
    energyNote,
    '',
    ...blocks.map((block) => `**${block.time} - ${block.title}**\n- ${block.detail}`),
    '',
    `**Today priority:** ${today.mainGoal || userProfile.studyGoal || userProfile.productivityGoal || 'Make one meaningful step forward.'}`,
  ].join('\n\n');
};
