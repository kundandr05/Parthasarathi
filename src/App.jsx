import { useState, useRef, useEffect } from 'react';
import { Send, Menu, User, Bot, PlusCircle, Trash2, Sun, Moon, MessageSquare, Clock, LogOut, Copy, Check } from 'lucide-react';
import { PeacockFeatherIcon } from './PeacockFeatherIcon';
import Markdown from 'markdown-to-jsx';
import Login from './Login';
import Onboarding from './Onboarding';
import Dashboard from './Dashboard';
import DailyCheckIn from './DailyCheckIn';
import Analytics from './Analytics';
import { logoutUser, saveChatSessions, loadChatSessions, loadUserMemories, loadUserProfile, saveUserProfile } from './firebase';
import { processChatMessage } from './chatbotEngine';
import { addMemory, loadLifeMemory, upsertTodayCheckin } from './localStore';
import './App.css';

const CodeBlock = ({ className, children }) => {
  const match = /language-(\w+)/.exec(className || '');
  return match ? (
    <pre><code className={`language-${match[1]}`}>{String(children).replace(/\n$/, '')}</code></pre>
  ) : (
    <code className={className} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', fontFamily: 'monospace' }}>
      {children}
    </code>
  );
};

export default function App() {
  const [userAuth, setUserAuth] = useState(() => {
    const saved = localStorage.getItem('user_auth');
    return saved ? JSON.parse(saved) : null;
  });

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('user_full_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentView, setCurrentView] = useState('dashboard'); // 'onboarding', 'dashboard', 'analytics', 'chat'
  const [showCheckIn, setShowCheckIn] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme_dark_mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [userMemories, setUserMemories] = useState(() => {
    const uid = userAuth?.uid;
    if (!uid) return [];
      const saved = localStorage.getItem(`user_memories_${uid}`);
      return saved ? JSON.parse(saved) : [];
  });

  const [sessions, setSessions] = useState(() => {
    const uid = userAuth?.uid;
    if (!uid) return [];
    const saved = localStorage.getItem(`chat_sessions_${uid}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });
  
  const [activeSessionId, setActiveSessionId] = useState(null);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const messagesEndRef = useRef(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const messages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, currentView]);

  useEffect(() => {
    if (userAuth) {
      localStorage.setItem(`chat_sessions_${userAuth.uid}`, JSON.stringify(sessions));
      saveChatSessions(userAuth.uid, sessions);
    }
  }, [sessions, userAuth]);

  useEffect(() => {
    localStorage.setItem('theme_dark_mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (userAuth && userProfile) {
      const today = new Date().toDateString();
      const lastCheckIn = localStorage.getItem(`last_checkin_${userAuth.uid}`);
      if (lastCheckIn !== today && currentView === 'dashboard') {
        setShowCheckIn(true);
      }
    }
  }, [userAuth, userProfile, currentView]);

  const handleLogin = async (user) => {
    setUserAuth(user);
    localStorage.setItem('user_auth', JSON.stringify(user));
    
    // Load profile
    let profile = await loadUserProfile(user.uid);
    if (!profile) {
      const savedProfile = localStorage.getItem(`user_full_profile_${user.uid}`);
      if (savedProfile) profile = JSON.parse(savedProfile);
    }

    if (profile) {
      setUserProfile(profile);
      localStorage.setItem('user_full_profile', JSON.stringify(profile));
      setCurrentView('dashboard');
    } else {
      setCurrentView('onboarding');
    }
    
    const fsSessions = await loadChatSessions(user.uid);
    if (fsSessions?.length) {
      setSessions(fsSessions);
    } else {
      const savedSessions = localStorage.getItem(`chat_sessions_${user.uid}`);
      if (savedSessions) {
        try { setSessions(JSON.parse(savedSessions)); } catch (e) { setSessions([]); }
      }
    }

    const memories = await loadUserMemories(user.uid);
    setUserMemories(memories || []);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUserAuth(null);
    setUserProfile(null);
    setSessions([]);
    setActiveSessionId(null);
    localStorage.removeItem('user_auth');
    localStorage.removeItem('user_full_profile');
    setShowUserMenu(false);
  };

  const handleOnboardingComplete = async (data) => {
    const fullProfile = { ...data, uid: userAuth.uid, email: userAuth.email };
    setUserProfile(fullProfile);
    localStorage.setItem('user_full_profile', JSON.stringify(fullProfile));
    localStorage.setItem(`user_full_profile_${userAuth.uid}`, JSON.stringify(fullProfile));
    await saveUserProfile(userAuth.uid, fullProfile);
    setCurrentView('dashboard');
  };

  const handleCheckInSubmit = (data) => {
    upsertTodayCheckin(userAuth.uid, data);
    localStorage.setItem(`last_checkin_${userAuth.uid}`, new Date().toDateString());
    setShowCheckIn(false);
  };

  const updateMessages = (newMessagesOrUpdater) => {
    setSessions(prevSessions => prevSessions.map(session => {
      if (session.id === activeSessionId) {
        const updatedMessages = typeof newMessagesOrUpdater === 'function' 
          ? newMessagesOrUpdater(session.messages) 
          : newMessagesOrUpdater;
          
        let newTitle = session.title;
        if (session.title === 'New Chat' && updatedMessages.length > 1) {
          const firstUserMsg = updatedMessages.find(m => m.role === 'user');
          if (firstUserMsg) {
             newTitle = firstUserMsg.content.slice(0, 25) + (firstUserMsg.content.length > 25 ? '...' : '');
          }
        }
        return { ...session, title: newTitle, messages: updatedMessages };
      }
      return session;
    }));
  };

  const createNewChat = () => {
    const newSession = {
      id: Date.now(),
      title: 'New Chat',
      messages: [{ role: 'bot', content: `Hello ${userProfile?.fullName?.split(' ')[0] || ''}! I am your local personal life assistant. Ask for a schedule, study plan, workout, mood support, sleep advice, hydration tracking, or daily summary.`, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setCurrentView('chat');
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
       setActiveSessionId(null);
       setCurrentView('dashboard');
    }
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    const newHistory = [...messages, userMsg];
    updateMessages(newHistory);
    setInput('');
    setIsTyping(true);

    // Simulate thinking delay for local engine
    setTimeout(() => {
      const lifeMemory = loadLifeMemory(userAuth.uid);
      const responseContent = processChatMessage(userMsg.content, userProfile, { ...lifeMemory, memories: userMemories });
      const updatedMemories = addMemory(userAuth.uid, `User asked: ${userMsg.content}`);
      setUserMemories(updatedMemories);
      const botMsg = { role: 'bot', content: responseContent, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
      updateMessages([...newHistory, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!userAuth) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentView === 'onboarding') {
    return <Onboarding user={userAuth} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="app-container">
      {showCheckIn && <DailyCheckIn onClose={() => setShowCheckIn(false)} onSubmit={handleCheckInSubmit} />}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" onClick={() => { setCurrentView('dashboard'); setActiveSessionId(null); if(window.innerWidth <= 768) setSidebarOpen(false); }} style={{ cursor: 'pointer' }}>
          <PeacockFeatherIcon className="text-accent-primary" size={28} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Parthasarathi</h2>
        </div>
        
        <div className="sidebar-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="sidebar-btn new-chat-btn" onClick={createNewChat}>
            <PlusCircle size={20} className="text-accent-primary" /> New Chat
          </button>
          
          <div className="history-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            <Clock size={14} /> History
          </div>
          
          <div className="sessions-list" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {sessions.map(session => (
              <div 
                key={session.id} 
                className={`session-item ${activeSessionId === session.id && currentView === 'chat' ? 'active' : ''}`}
                onClick={() => { setActiveSessionId(session.id); setCurrentView('chat'); if(window.innerWidth <= 768) setSidebarOpen(false); }}
              >
                <MessageSquare size={16} className="session-icon" />
                <span className="session-title">{session.title}</span>
                <button className="session-delete" onClick={(e) => deleteSession(session.id, e)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="user-menu-container" style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', position: 'relative' }}>
            {showUserMenu && (
              <div className="glass-panel" style={{ 
                position: 'absolute', bottom: 'calc(100% + 0.5rem)', left: '0', right: '0', 
                borderRadius: 'var(--radius-md)', padding: '0.5rem', display: 'flex', 
                flexDirection: 'column', gap: '0.25rem', animation: 'fadeInUp 0.2s ease-out'
              }}>
                <button className="dropdown-item" onClick={() => { setIsDarkMode(!isDarkMode); setShowUserMenu(false); }}>
                  {isDarkMode ? <Sun size={16}/> : <Moon size={16}/>} Toggle Theme
                </button>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }}></div>
                <button className="dropdown-item" onClick={handleLogout}><LogOut size={16}/> Log out</button>
              </div>
            )}
            
            <button className="sidebar-btn" onClick={() => setShowUserMenu(!showUserMenu)} style={{ justifyContent: 'flex-start', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                {userAuth.photoURL ? (
                  <img src={userAuth.photoURL} alt="Profile" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-glass-heavy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} />
                  </div>
                )}
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userProfile?.fullName || userAuth.displayName || "User"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="main-area">
        {currentView === 'dashboard' && (
          <Dashboard user={userAuth} userProfile={userProfile} onNewChat={createNewChat} onOpenAnalytics={() => setCurrentView('analytics')} />
        )}
        
        {currentView === 'analytics' && (
          <Analytics onBack={() => setCurrentView('dashboard')} user={userAuth} />
        )}

        {currentView === 'chat' && activeSession && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <header className="header glass-panel" style={{ borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0 }}>
              <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginRight: '1rem', display: window.innerWidth > 768 ? 'none' : 'flex' }}>
                <Menu size={24} />
              </button>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 500 }}>{activeSession.title}</h1>
            </header>

            {/* Chat Area */}
            <div className="chat-container" onClick={() => setSidebarOpen(false)}>
              {messages.map((msg, idx) => (
                <div
                  key={idx} 
                  className={`message-row ${msg.role}`}
                >
                  {msg.role === 'bot' && (
                    <div className="message-avatar bot-avatar">
                      <Bot size={20} className="text-accent-primary" />
                    </div>
                  )}
                  
                  <div className="message-bubble-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'bot' ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                    <div className="message-bubble glass-panel-hover" style={{ position: 'relative' }}>
                      <div className="message-content">
                        {msg.role === 'bot' ? (
                          <Markdown options={{ overrides: { code: { component: CodeBlock } } }}>{msg.content}</Markdown>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', padding: '0 0.5rem', display: 'flex', gap: '0.5rem' }}>
                      {msg.timestamp}
                      {msg.role === 'bot' && (
                        <button onClick={() => handleCopy(msg.content, idx)} style={{ background: 'none', border: 'none', color: copiedIdx === idx ? '#10b981' : 'var(--text-secondary)', cursor: 'pointer', padding: 0 }}>
                          {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="message-avatar user-avatar">
                      {userAuth.photoURL ? (
                        <img src={userAuth.photoURL} alt="You" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="message-row bot">
                  <div className="message-avatar bot-avatar">
                    <Bot size={20} className="text-accent-primary" />
                  </div>
                  <div className="message-bubble glass-panel-hover" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="input-area glass-panel" style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none', borderRadius: 0, padding: '1rem' }}>
              <div className="input-wrapper" style={{ background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
                <textarea
                  id="chat-input"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = (e.target.scrollHeight) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask for a plan, motivation, or tips..."
                  rows={1}
                  style={{ maxHeight: '150px' }}
                />
                
                <div className="input-actions">
                  <button 
                    className="btn-icon primary" 
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    style={{ background: (!input.trim() || isTyping) ? 'var(--bg-glass-heavy)' : 'var(--accent-primary)', color: (!input.trim() || isTyping) ? 'var(--text-secondary)' : 'white' }}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
