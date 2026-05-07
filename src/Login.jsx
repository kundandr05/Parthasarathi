import { useState } from 'react';
import { Compass } from 'lucide-react';
import { PeacockFeatherIcon } from './PeacockFeatherIcon';

export default function Login({ onLogin }) {
  const [loadingId, setLoadingId] = useState(null);

  const handleAccountSelect = (account) => {
    setLoadingId(account.id);
    // Simulate network delay
    setTimeout(() => {
      onLogin({
        uid: account.id,
        displayName: account.name,
        email: account.email,
        photoURL: account.photoURL
      });
    }, 800);
  };

  const accounts = [
    {
      id: 'mock-kundan',
      name: 'KUNDAN DR',
      email: 'kundan@example.com',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kundan'
    },
    {
      id: 'mock-kishan',
      name: 'KISHAN KUMAR KR',
      email: 'kishan@example.com',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kishan'
    }
  ];

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="glass-panel" style={{ 
        width: '100%', maxWidth: '400px', padding: '2.5rem', 
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', zIndex: 10, animation: 'fadeInUp 0.6s ease-out',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', 
          background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-highlight)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          marginBottom: '1.5rem', boxShadow: 'var(--shadow-glow)'
        }}>
          <PeacockFeatherIcon size={32} className="text-accent-primary" />
        </div>
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Choose an Account</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>Select your profile to continue to Parthasarathi.</p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {accounts.map(acc => (
            <button 
              key={acc.id}
              className="glass-panel-hover"
              onClick={() => handleAccountSelect(acc)}
              disabled={loadingId !== null}
              style={{
                width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'var(--bg-glass-heavy)', border: '1px solid rgba(255,255,255,0.1)',
                cursor: loadingId !== null ? 'not-allowed' : 'pointer',
                textAlign: 'left', transition: 'var(--transition)'
              }}
            >
              <img src={acc.photoURL} alt={acc.name} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-glass)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{acc.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{acc.email}</div>
              </div>
              {loadingId === acc.id && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div className="typing-dot" style={{ background: 'var(--accent-primary)' }}></div>
                  <div className="typing-dot" style={{ background: 'var(--accent-primary)' }}></div>
                  <div className="typing-dot" style={{ background: 'var(--accent-primary)' }}></div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
