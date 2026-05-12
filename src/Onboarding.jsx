import React, { useState } from 'react';
import { User, Calendar, Briefcase, Clock, Activity, Book, Target, Coffee, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const steps = [
  { id: 'personal', title: 'Personal Info' },
  { id: 'schedule', title: 'Daily Schedule' },
  { id: 'goals', title: 'Your Goals' }
];

export default function Onboarding({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    dob: '',
    gender: '',
    occupation: '',
    wakeUpTime: '07:00',
    sleepTime: '23:00',
    fitnessGoal: '',
    studyGoal: '',
    productivityGoal: '',
    foodPreference: '',
    studyHours: '4',
    workoutLevel: 'Beginner'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        className="glass-panel"
        style={{
          width: '100%', maxWidth: '600px', padding: '3rem',
          borderRadius: 'var(--radius-xl)',
          display: 'flex', flexDirection: 'column', animation: 'fadeInUp 0.3s ease-out'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome to Parthasarathi
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Let's personalize your assistant.</p>
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>
          <div style={{ position: 'absolute', top: '50%', left: 0, width: `${(currentStep / (steps.length - 1)) * 100}%`, height: '2px', background: 'var(--accent-primary)', zIndex: 1, transition: 'width 0.3s ease' }}></div>
          
          {steps.map((step, idx) => (
            <div key={idx} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                background: currentStep >= idx ? 'var(--accent-primary)' : 'var(--bg-glass-heavy)',
                border: `2px solid ${currentStep >= idx ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: currentStep >= idx ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.3s ease'
              }}>
                {currentStep > idx ? <Check size={16} /> : idx + 1}
              </div>
              <span style={{ position: 'absolute', top: '100%', marginTop: '0.5rem', fontSize: '0.75rem', color: currentStep >= idx ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div>
            {currentStep === 0 && (
              <div key="step1" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp 0.2s ease-out' }}>
                <div className="input-group">
                  <label><User size={16} /> Full Name</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="onboarding-input" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label><Calendar size={16} /> Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="onboarding-input" />
                  </div>
                  <div className="input-group">
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} required className="onboarding-input">
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label><Briefcase size={16} /> Occupation / Status</label>
                  <input type="text" name="occupation" placeholder="e.g. Student, Software Engineer" value={formData.occupation} onChange={handleChange} required className="onboarding-input" />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div key="step2" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp 0.2s ease-out' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label><Clock size={16} /> Wake-up Time</label>
                    <input type="time" name="wakeUpTime" value={formData.wakeUpTime} onChange={handleChange} required className="onboarding-input" />
                  </div>
                  <div className="input-group">
                    <label><Clock size={16} /> Sleep Time</label>
                    <input type="time" name="sleepTime" value={formData.sleepTime} onChange={handleChange} required className="onboarding-input" />
                  </div>
                </div>
                <div className="input-group">
                  <label><Book size={16} /> Daily Study/Deep Work Hours</label>
                  <input type="number" min="0" max="24" name="studyHours" value={formData.studyHours} onChange={handleChange} required className="onboarding-input" />
                </div>
                <div className="input-group">
                  <label><Coffee size={16} /> Food Preference</label>
                  <select name="foodPreference" value={formData.foodPreference} onChange={handleChange} required className="onboarding-input">
                    <option value="">Select...</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Pescatarian">Pescatarian</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div key="step3" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeInUp 0.2s ease-out' }}>
                <div className="input-group">
                  <label><Activity size={16} /> Fitness Goal</label>
                  <input type="text" name="fitnessGoal" placeholder="e.g. Lose 5kg, Build Muscle, Stay active" value={formData.fitnessGoal} onChange={handleChange} required className="onboarding-input" />
                </div>
                <div className="input-group">
                  <label>Workout Level</label>
                  <select name="workoutLevel" value={formData.workoutLevel} onChange={handleChange} required className="onboarding-input">
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="input-group">
                  <label><Target size={16} /> Main Study/Career Goal</label>
                  <input type="text" name="studyGoal" placeholder="e.g. Pass final exams, Get promoted" value={formData.studyGoal} onChange={handleChange} required className="onboarding-input" />
                </div>
                <div className="input-group">
                  <label><Target size={16} /> Productivity Goal</label>
                  <input type="text" name="productivityGoal" placeholder="e.g. Reduce screen time, Focus better" value={formData.productivityGoal} onChange={handleChange} required className="onboarding-input" />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
            {currentStep > 0 ? (
              <button type="button" onClick={handleBack} className="btn-icon" style={{ background: 'var(--bg-glass-heavy)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)' }}>
                <ChevronLeft size={18} /> Back
              </button>
            ) : <div></div>}
            
            {currentStep < steps.length - 1 ? (
              <button type="button" onClick={handleNext} className="btn-icon primary" style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', border: 'none' }}>
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button type="submit" className="btn-icon primary" style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-glow)' }}>
                Complete <Check size={18} style={{ marginLeft: '0.5rem' }}/>
              </button>
            )}
          </div>
        </form>
      </div>
      <style>{`
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .input-group label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
        }
        .onboarding-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-md);
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          outline: none;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        .onboarding-input:focus {
          border-color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
}
