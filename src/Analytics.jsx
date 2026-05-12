import { ArrowLeft, Activity, Droplets, Moon, BrainCircuit, Dumbbell, Smile } from 'lucide-react';
import { loadCheckins, weeklySummary } from './localStore';

const moodScore = { Sad: 25, Okay: 50, Good: 75, Great: 100 };

export default function Analytics({ onBack, user }) {
  const uid = user?.uid;
  const checkins = uid ? loadCheckins(uid).slice(-7) : [];
  const summary = uid ? weeklySummary(uid) : {};
  const days = checkins.length ? checkins : [
    { date: 'No data', sleepHours: 0, waterGlasses: 0, productivityScore: 0, mood: 'Okay', workoutCompleted: false },
  ];

  const statCards = [
    { icon: <BrainCircuit size={16} />, label: 'Avg Productivity', value: `${summary.avgProductivity || 0}%`, note: 'From check-ins and tasks' },
    { icon: <Moon size={16} />, label: 'Avg Sleep', value: `${summary.avgSleep || 0}h`, note: 'Last 7 logged days' },
    { icon: <Droplets size={16} />, label: 'Hydration Days', value: `${summary.hydrationDays || 0}/${summary.days || 7}`, note: 'Completed water goal' },
    { icon: <Dumbbell size={16} />, label: 'Workout Days', value: `${summary.workoutDays || 0}/${summary.days || 7}`, note: 'Consistency tracker' },
  ];

  return (
    <div className="dashboard-container">
      <section className="analytics-header">
        <button onClick={onBack} className="btn-icon analytics-back"><ArrowLeft size={20} /></button>
        <div>
          <h1>Weekly Analytics</h1>
          <p className="muted">Visual statistics generated from local daily check-ins.</p>
        </div>
      </section>

      <section className="analytics-stats">
        {statCards.map((card) => (
          <div key={card.label} className="glass-panel analytics-card">
            <div className="stat-label">{card.icon}{card.label}</div>
            <strong>{card.value}</strong>
            <span>{card.note}</span>
          </div>
        ))}
      </section>

      <section className="analytics-grid">
        <ChartCard title="Study/Productivity Consistency" icon={<BrainCircuit size={18} />} data={days} valueKey="productivityScore" max={100} suffix="%" />
        <ChartCard title="Sleep Tracking" icon={<Moon size={18} />} data={days} valueKey="sleepHours" max={10} suffix="h" />
        <ChartCard title="Water Intake" icon={<Droplets size={18} />} data={days} valueKey="waterGlasses" max={8} suffix="/8" />
        <MoodCard data={days} />
      </section>

      <section className="glass-panel dashboard-card">
        <div className="card-title"><Activity size={22} /> Progress Report</div>
        <p className="muted">
          You logged {summary.days || 0} day(s). Your strongest area is {summary.hydrationDays >= summary.workoutDays ? 'hydration' : 'workout consistency'}.
          Keep daily check-ins active so the assistant can make sharper recommendations.
        </p>
      </section>
    </div>
  );
}

function ChartCard({ title, icon, data, valueKey, max, suffix }) {
  return (
    <div className="glass-panel dashboard-card chart-card">
      <div className="card-title">{icon} {title}</div>
      <div className="bar-chart">
        {data.map((item) => {
          const value = Number(item[valueKey] || 0);
          const height = Math.min(100, (value / max) * 100);
          return (
            <div key={`${item.date}-${valueKey}`} className="bar-column">
              <div className="bar-shell"><div className="bar-fill" style={{ height: `${height}%` }} /></div>
              <span>{value}{suffix}</span>
              <small>{item.date === 'No data' ? 'Now' : new Date(item.date).toLocaleDateString([], { weekday: 'short' })}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MoodCard({ data }) {
  return (
    <div className="glass-panel dashboard-card chart-card">
      <div className="card-title"><Smile size={18} /> Mood Trends</div>
      <div className="trend-list">
        {data.map((item) => (
          <div key={`${item.date}-mood`} className="trend-row">
            <span>{item.date === 'No data' ? 'Today' : new Date(item.date).toLocaleDateString([], { weekday: 'short' })}</span>
            <div className="progress-track"><div style={{ width: `${moodScore[item.mood] || 50}%` }} /></div>
            <strong>{item.mood || 'Okay'}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
