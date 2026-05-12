import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Target, Activity, Droplets, Moon, Smile, Calendar, Plus, Check, BrainCircuit, Bell, Trash2 } from 'lucide-react';
import { buildPlanBlocks } from './plannerEngine';
import { addTask, deleteTask, getTodayCheckin, loadTasks, toggleTask, updateTodayCheckin, weeklySummary } from './localStore';

export default function Dashboard({ user, onNewChat, onOpenAnalytics, userProfile }) {
  const uid = user?.uid;
  const [today, setToday] = useState(() => (uid ? getTodayCheckin(uid) : null));
  const [summary, setSummary] = useState(() => (uid ? weeklySummary(uid) : {}));
  const [tasks, setTasks] = useState(() => (uid ? loadTasks(uid) : []));
  const [taskInput, setTaskInput] = useState('');

  useEffect(() => {
    if (!uid) return;
    setToday(getTodayCheckin(uid));
    setSummary(weeklySummary(uid));
    setTasks(loadTasks(uid));
  }, [uid]);

  const time = new Date().getHours();
  const greeting = time < 12 ? 'Good Morning' : time < 18 ? 'Good Afternoon' : 'Good Evening';
  const firstName = userProfile?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'there';
  const waterGlasses = Number(today?.waterGlasses || 0);
  const planBlocks = useMemo(() => buildPlanBlocks(userProfile, { today }), [userProfile, today]);

  const saveToday = (patch) => {
    if (!uid) return;
    const next = updateTodayCheckin(uid, { ...today, ...patch });
    setToday(next);
    setSummary(weeklySummary(uid));
  };

  const todayGoals = [
    today?.mainGoal || userProfile?.studyGoal || 'Complete one focused priority',
    `Study or deep work for ${userProfile?.studyHours || 2} hours`,
    userProfile?.fitnessGoal || 'Move your body for 20 minutes',
    'Drink 8 glasses of water',
  ];

  const openTasks = tasks.filter((task) => !task.completed).slice(0, 5);
  const completedTaskCount = tasks.filter((task) => task.completed).length;
  const productivity = today?.productivityScore || Math.min(95, Math.round(((waterGlasses / 8) * 25) + (today?.workoutCompleted ? 25 : 0) + (today?.mainGoal ? 20 : 10) + Math.min(30, completedTaskCount * 6)));

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!uid || !taskInput.trim()) return;
    setTasks(addTask(uid, taskInput));
    setTaskInput('');
  };

  const handleToggleTask = (taskId) => {
    if (!uid) return;
    const next = toggleTask(uid, taskId);
    setTasks(next);
    const done = next.filter((task) => task.completed).length;
    saveToday({ completedTasks: done, productivityScore: Math.min(100, productivity + 6) });
  };

  const handleDeleteTask = (taskId) => {
    if (!uid) return;
    setTasks(deleteTask(uid, taskId));
  };

  return (
    <div className="dashboard-container">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Local personal intelligence</p>
          <h1>{greeting}, {firstName}.</h1>
          <p className="muted">Your assistant is using your profile, check-ins, goals, and habit history locally on this device.</p>
        </div>
        <div className="hero-actions">
          <button onClick={onOpenAnalytics} className="action-button secondary"><Activity size={18} /> Analytics</button>
          <button onClick={onNewChat} className="action-button primary"><Sparkles size={18} /> Ask Assistant</button>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="glass-panel dashboard-card span-2">
          <div className="card-title"><Target size={22} /> Today's Goals</div>
          <div className="goal-list">
            {todayGoals.map((goal, idx) => (
              <button key={goal} className="goal-row" onClick={() => saveToday({ completedTasks: Math.max(Number(today?.completedTasks || 0), idx + 1), productivityScore: Math.min(100, productivity + 8) })}>
                <span className={Number(today?.completedTasks || 0) > idx ? 'goal-check done' : 'goal-check'}>
                  {Number(today?.completedTasks || 0) > idx && <Check size={13} />}
                </span>
                <span>{goal}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel dashboard-card tracker-card">
          <div className="card-title"><Droplets size={22} /> Water</div>
          <div className="metric">{waterGlasses}<span>/8 glasses</span></div>
          <div className="progress-track"><div style={{ width: `${Math.min(100, (waterGlasses / 8) * 100)}%` }} /></div>
          <button className="mini-action" onClick={() => saveToday({ waterGlasses: Math.min(8, waterGlasses + 1), waterCompleted: waterGlasses + 1 >= 8 })}><Plus size={16} /> Add glass</button>
        </div>

        <div className="glass-panel dashboard-card tracker-card">
          <div className="card-title"><Moon size={22} /> Sleep</div>
          <div className="metric">{today?.sleepHours || '--'}<span>hours</span></div>
          <input className="range-input" type="range" min="0" max="12" step="0.5" value={today?.sleepHours || 7} onChange={(e) => saveToday({ sleepHours: e.target.value })} />
          <p className="muted small">Target: {userProfile?.sleepTime || '23:00'} to {userProfile?.wakeUpTime || '07:00'}</p>
        </div>

        <div className="glass-panel dashboard-card">
          <div className="card-title"><Smile size={22} /> Mood</div>
          <div className="mood-row">
            {['Sad', 'Okay', 'Good', 'Great'].map((mood) => (
              <button key={mood} className={today?.mood === mood ? 'mood-chip active' : 'mood-chip'} onClick={() => saveToday({ mood })}>{mood}</button>
            ))}
          </div>
        </div>

        <div className="glass-panel dashboard-card">
          <div className="card-title"><BrainCircuit size={22} /> Productivity</div>
          <div className="metric">{productivity}<span>% score</span></div>
          <div className="progress-track"><div style={{ width: `${productivity}%` }} /></div>
          <p className="muted small">{completedTaskCount} completed task(s), {openTasks.length} active priority item(s).</p>
        </div>
      </section>

      <section className="glass-panel dashboard-card task-card">
        <div className="card-title"><Check size={22} /> Smart Task Manager</div>
        <form className="task-form" onSubmit={handleAddTask}>
          <input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} placeholder="Add a task, reminder, exam prep, or focus item" />
          <button className="action-button primary" type="submit"><Plus size={16} /> Add</button>
        </form>
        <div className="task-list">
          {tasks.length === 0 && <p className="muted small">No tasks yet. Add one here or tell the chatbot “remind me to...”</p>}
          {tasks.slice(0, 8).map((task) => (
            <div key={task.id} className={task.completed ? 'task-row completed' : 'task-row'}>
              <button className="goal-check task-check" onClick={() => handleToggleTask(task.id)} aria-label="Toggle task">
                {task.completed && <Check size={13} />}
              </button>
              <div>
                <strong>{task.title}</strong>
                <span>{task.source === 'manual' ? 'Manual task' : 'Captured from chat'}{task.dueText ? ` - ${task.dueText}` : ''}</span>
              </div>
              <button className="task-delete" onClick={() => handleDeleteTask(task.id)} aria-label="Delete task"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel dashboard-card schedule-card">
        <div className="card-title"><Calendar size={22} /> Smart Local Planner</div>
        <div className="schedule-grid">
          {planBlocks.map((block) => (
            <div key={`${block.time}-${block.title}`} className="schedule-item">
              <span>{block.time}</span>
              <strong>{block.title}</strong>
              <p>{block.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel dashboard-card reminders-card">
        <div className="card-title"><Bell size={22} /> Daily Reminders</div>
        <div className="reminder-list">
          <span>Hydrate every 2 hours</span>
          <span>Study goal: {userProfile?.studyGoal || 'Stay consistent'}</span>
          <span>Sleep wind-down starts 1 hour before {userProfile?.sleepTime || '23:00'}</span>
          <span>Weekly workout consistency: {summary.workoutDays || 0}/{summary.days || 7} days</span>
        </div>
      </section>
    </div>
  );
}
