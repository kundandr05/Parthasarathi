import React from 'react';
import { X, User, Activity, CheckCircle, Shield } from 'lucide-react';

export default function UserProfile({ user, onClose, onLogout }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div className="glass-panel" onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: '400px', padding: '2.5rem', borderRadius: '1.5rem', position: 'relative', animation: 'fadeInUp 0.3s ease-out', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <button className="modal-close" onClick={onClose} style={{ top: '1rem', right: '1rem', position: 'absolute' }}><X size={20}/></button>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '88px', height: '88px', margin: '0 auto 1.25rem auto', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'var(--shadow-glow)' }}>
            {user.photoURL ? <img src={user.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={44} color="white" />}
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{user.displayName || 'KUNDAN DR'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{user.email}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="glass-panel-hover" style={{ padding: '1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Activity size={24} className="text-accent-primary" />
            <div>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>Active Goals</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>4 goals in progress</div>
            </div>
          </div>
          <div className="glass-panel-hover" style={{ padding: '1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <CheckCircle size={24} className="text-accent-primary" />
            <div>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>Tasks Completed</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>128 tasks this month</div>
            </div>
          </div>
          <div className="glass-panel-hover" style={{ padding: '1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Shield size={24} className="text-accent-primary" />
            <div>
              <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>Data Security</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your data is private & encrypted</div>
            </div>
          </div>
        </div>

        <button className="btn-icon primary" onClick={onLogout} style={{ width: '100%', padding: '0.85rem', borderRadius: '0.75rem', marginTop: '2rem', height: 'auto', fontWeight: 600, fontSize: '1rem' }}>
          Log Out
        </button>
      </div>
    </div>
  );
}
