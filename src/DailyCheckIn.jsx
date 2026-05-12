import { useState } from 'react';
import { Smile, Moon, Activity, Droplets, Target, Check, X } from 'lucide-react';

export default function DailyCheckIn({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    mood: 'Okay',
    sleepHours: '7',
    workoutCompleted: false,
    waterCompleted: false,
    waterGlasses: 0,
    mainGoal: '',
  });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      waterGlasses: formData.waterCompleted ? 8 : formData.waterGlasses,
      productivityScore: formData.workoutCompleted ? 65 : 45,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="glass-panel checkin-modal">
        <button onClick={onClose} className="modal-close" aria-label="Close check-in">
          <X size={22} />
        </button>

        <h2>Daily Check-In</h2>
        <p className="muted">A quick local memory update helps your assistant respond personally.</p>

        <form onSubmit={handleSubmit} className="checkin-form">
          <div className="checkin-group">
            <label><Smile size={16} /> How is your mood today?</label>
            <div className="mood-row">
              {['Sad', 'Okay', 'Good', 'Great'].map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood })}
                  className={formData.mood === mood ? 'mood-chip active' : 'mood-chip'}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <div className="checkin-group">
            <label><Moon size={16} /> How many hours did you sleep?</label>
            <input type="number" name="sleepHours" min="0" max="24" step="0.5" value={formData.sleepHours} onChange={handleChange} className="onboarding-input" />
          </div>

          <div className="checkin-two">
            <label className="toggle-card"><Activity size={16} /> Workout today?<input type="checkbox" name="workoutCompleted" checked={formData.workoutCompleted} onChange={handleChange} /></label>
            <label className="toggle-card"><Droplets size={16} /> Water complete?<input type="checkbox" name="waterCompleted" checked={formData.waterCompleted} onChange={handleChange} /></label>
          </div>

          {!formData.waterCompleted && (
            <div className="checkin-group">
              <label><Droplets size={16} /> Water glasses so far</label>
              <input type="number" name="waterGlasses" min="0" max="8" value={formData.waterGlasses} onChange={handleChange} className="onboarding-input" />
            </div>
          )}

          <div className="checkin-group">
            <label><Target size={16} /> Main goal for today?</label>
            <input type="text" name="mainGoal" placeholder="What's your top priority?" value={formData.mainGoal} onChange={handleChange} required className="onboarding-input" />
          </div>

          <button type="submit" className="action-button primary full-width">
            <Check size={20} /> Save Check-In
          </button>
        </form>
      </div>
    </div>
  );
}
