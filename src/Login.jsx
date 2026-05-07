import { useState } from 'react';
import { motion } from 'framer-motion';
import { PeacockFeatherIcon } from './PeacockFeatherIcon';
import { signInWithGoogle } from './firebase';

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoginClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      onLogin(user);
    } catch (err) {
      setError(err.message || "Failed to sign in. Please check your Firebase configuration.");
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
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
        
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome back
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Sign in to continue to Parthasarathi.
        </p>

        {error && (
          <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', width: '100%' }}>
            {error}
          </div>
        )}

        <button 
          className="btn-icon primary"
          onClick={handleLoginClick}
          disabled={loading}
          style={{
            width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            fontWeight: 600, fontSize: '1rem', height: 'auto', background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-color)', color: 'var(--text-primary)'
          }}
        >
          {loading ? (
             <div style={{ display: 'flex', gap: '4px' }}>
               <div className="typing-dot" style={{ background: 'var(--text-primary)' }}></div>
               <div className="typing-dot" style={{ background: 'var(--text-primary)' }}></div>
               <div className="typing-dot" style={{ background: 'var(--text-primary)' }}></div>
             </div>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
