import React from 'react';
import { Sparkles, Target, Activity } from 'lucide-react';

export default function Dashboard({ user, onNewChat }) {
  const time = new Date().getHours();
  const greeting = time < 12 ? 'Good Morning' : time < 18 ? 'Good Afternoon' : 'Good Evening';

  const quotes = [
    "The secret of getting ahead is getting started.",
    "Focus on being productive instead of busy.",
    "Small steps every day yield massive results.",
    "Your future is created by what you do today.",
    "Discipline equals freedom.",
    "Don't count the days, make the days count."
  ];
  const dailyQuote = quotes[new Date().getDay() % quotes.length];

  return (
    <div className="dashboard-container animate-fade-in-up" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>
          {greeting},<br/>{user?.displayName ? user.displayName.split(' ')[0] : 'there'}.
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '4rem', fontWeight: 400 }}>"{dailyQuote}"</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid var(--border-highlight)', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))' }}>
            <Target size={28} className="text-accent-primary" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Active Goals</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>4 goals tracked this week</p>
          </div>
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '1.5rem', border: '1px solid var(--border-highlight)', background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))' }}>
            <Activity size={28} className="text-accent-primary" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Productivity Score</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>85% - Great job staying consistent!</p>
          </div>
        </div>

        <button 
          className="btn-icon primary" 
          onClick={onNewChat}
          style={{ padding: '1rem 2rem', borderRadius: '2rem', fontSize: '1.1rem', fontWeight: 600, display: 'inline-flex', gap: '0.75rem', boxShadow: 'var(--shadow-glow)', transition: 'transform 0.2s, box-shadow 0.2s' }}
        >
          <Sparkles size={20} /> Start a New Conversation
        </button>
      </div>
    </div>
  );
}
