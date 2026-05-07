import { useState, useRef, useEffect } from 'react';
import { Send, Menu, Settings, User, Bot, Sparkles, Key, PlusCircle, Trash2, Mic, MicOff, Globe, Sun, Moon, MessageSquare, Clock, Edit2, LogOut, LifeBuoy, ChevronRight, Activity, BookOpen, Copy, Check, Share2, Volume2, Edit3, X as CloseIcon, Paperclip, Compass } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'markdown-to-jsx';
import Login from './Login';
import UpgradePlan from './UpgradePlan';
import UserProfile from './UserProfile';
import Dashboard from './Dashboard';
import { logoutUser } from './firebase';
import './App.css';

const BASE_PROMPT = `You are Parthasarathi, an intelligent and practical personal life management assistant.

Your goal is to help users improve their daily life through productivity, planning, and goal tracking.

Core Responsibilities:
1. Help users plan their day effectively
2. Suggest healthy and productive habits
3. Break large goals into smaller actionable steps
4. Track goals and remind users about consistency

Behavior Rules:
- Keep answers concise but valuable
- Use bullet points or numbered steps when helpful
- Ask follow-up questions when needed
- Avoid fake emotional responses
- Never provide harmful, illegal, dangerous, or unethical advice`;

function App() {
  // --- AUTH STATE ---
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  // --- APP STATE ---
  const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('chat_language') || 'English');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme_dark_mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [personaTone, setPersonaTone] = useState(localStorage.getItem('persona_tone') || 'Balanced');
  const [userMemories, setUserMemories] = useState(() => {
    const savedProfile = localStorage.getItem('user_profile');
    const uid = savedProfile ? JSON.parse(savedProfile).uid : null;
    if (!uid) return [];
    const saved = localStorage.getItem(`user_memories_${uid}`);
    return saved ? JSON.parse(saved) : [];
  });

  // History/Sessions
  const [sessions, setSessions] = useState(() => {
    const savedProfile = localStorage.getItem('user_profile');
    const uid = savedProfile ? JSON.parse(savedProfile).uid : null;
    if (!uid) return [];
    const saved = localStorage.getItem(`chat_sessions_${uid}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });
  
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const savedProfile = localStorage.getItem('user_profile');
    const uid = savedProfile ? JSON.parse(savedProfile).uid : null;
    if (!uid) return null;
    const saved = localStorage.getItem(`active_session_id_${uid}`);
    return saved && saved !== "null" ? parseInt(saved, 10) : null;
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('gemini_api_key') && !import.meta.env.VITE_GEMINI_API_KEY);
  
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '');
  
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Message Interaction States
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [editingMsgIdx, setEditingMsgIdx] = useState(null);
  const [editMsgText, setEditMsgText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Derived active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const messages = activeSession ? activeSession.messages : [];

  // --- EFFECTS ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (userProfile) localStorage.setItem(`chat_sessions_${userProfile.uid}`, JSON.stringify(sessions));
  }, [sessions, userProfile]);

  useEffect(() => {
    if (userProfile) localStorage.setItem(`active_session_id_${userProfile.uid}`, activeSessionId);
  }, [activeSessionId, userProfile]);
  
  useEffect(() => {
    if (userProfile) localStorage.setItem(`user_memories_${userProfile.uid}`, JSON.stringify(userMemories));
  }, [userMemories, userProfile]);

  useEffect(() => {
    localStorage.setItem('theme_dark_mode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('chat_language', selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem('persona_tone', personaTone);
  }, [personaTone]);

  // Speech Recognition Init
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
             finalTranscript += transcript + ' ';
          }
        }
        if (finalTranscript) {
          setInput((prev) => prev + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    
    // Cleanup TTS
    return () => {
      window.speechSynthesis.cancel();
    }
  }, []);

  // --- HANDLERS ---
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
      if (validFiles.length < files.length) {
        alert("Some files exceed the 5MB size limit requirement and were skipped.");
      }
      
      const newAttachments = validFiles.map(file => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        type: file.type
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => {
      const newAtt = [...prev];
      URL.revokeObjectURL(newAtt[idx].url);
      newAtt.splice(idx, 1);
      return newAtt;
    });
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };
  const handleLogin = (user) => {
    setUserProfile(user);
    localStorage.setItem('user_profile', JSON.stringify(user));
    
    const savedMemories = localStorage.getItem(`user_memories_${user.uid}`);
    setUserMemories(savedMemories ? JSON.parse(savedMemories) : []);
    
    const savedSessions = localStorage.getItem(`chat_sessions_${user.uid}`);
    if (savedSessions) {
      try { setSessions(JSON.parse(savedSessions)); } catch (e) { setSessions([]); }
    } else {
      setSessions([]);
    }
    
    const savedActive = localStorage.getItem(`active_session_id_${user.uid}`);
    setActiveSessionId(savedActive && savedActive !== "null" ? parseInt(savedActive, 10) : null);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUserProfile(null);
    localStorage.removeItem('user_profile');
    setShowUserMenu(false);
  };

  const startEditingTitle = (id, currentTitle, e) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitle(currentTitle);
  };

  const saveEditingTitle = (id, e) => {
    if (e) e.stopPropagation();
    if (editTitle.trim()) {
      setSessions(prev => prev.map(s => 
        s.id === id ? { ...s, title: editTitle.trim() } : s
      ));
    }
    setEditingSessionId(null);
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
      messages: [{ role: 'bot', content: "Hello! I am **Parthasarathi**. What would you like to focus on today?" }]
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
       setActiveSessionId(newSessions.length > 0 ? newSessions[0].id : null);
    }
  };

  const clearChat = () => {
    updateMessages([{ role: 'bot', content: "Chat cleared. I am ready to help you plan your next goal or tackle any task. What's next?" }]);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        if (selectedLanguage === 'Hindi') recognitionRef.current.lang = 'hi-IN';
        else if (selectedLanguage === 'Kannada') recognitionRef.current.lang = 'kn-IN';
        else recognitionRef.current.lang = 'en-US';
        
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
          setIsListening(false);
        }
      } else {
        alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      }
    }
  };

  // --- NEW MESSAGE ACTIONS ---
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleShare = () => {
    if (!activeSession) return;
    const chatText = activeSession.messages.map(m => `${m.role === 'user' ? 'User' : 'Parthasarathi'}:\n${m.content}\n`).join('\n');
    
    if (navigator.share) {
      navigator.share({
        title: activeSession.title,
        text: chatText
      }).catch(console.error);
    } else {
      // Fallback download
      const blob = new Blob([chatText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeSession.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const speakText = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    // Strip markdown for speaking
    const cleanText = text.replace(/[*_#`\[\]]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (selectedLanguage === 'Hindi') utterance.lang = 'hi-IN';
    else if (selectedLanguage === 'Kannada') utterance.lang = 'kn-IN';
    else utterance.lang = 'en-US';

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const submitEditMessage = (idx) => {
    if (!editMsgText.trim() || isTyping) return;
    
    const newHistory = messages.slice(0, idx);
    const updatedUserMsg = { role: 'user', content: editMsgText.trim() };
    newHistory.push(updatedUserMsg);
    
    updateMessages(newHistory);
    setEditingMsgIdx(null);
    setEditMsgText('');
    
    generateResponse(updatedUserMsg.content, newHistory);
  };


  const handleSaveKey = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', apiKey);
    setShowSettings(false);
  };

  const generateResponse = async (userText, currentHistory, attachmentsForTurn = []) => {
    if (!apiKey) {
      setTimeout(() => {
        updateMessages(prev => [...prev, { role: 'bot', content: "Please configure your Gemini API Key in the settings first." }]);
        setShowSettings(true);
      }, 1000);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const historyText = currentHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
      
      const memoryText = userMemories.length > 0 
        ? `\n\nUSER MEMORIES (Facts you must remember about the user):\n- ${userMemories.join('\n- ')}` 
        : '';
        
      let toneInstruction = '';
      if (personaTone === 'Strict Coach') {
         toneInstruction = 'You are a Strict Coach. Be highly disciplined, push the user hard, give no excuses, demand action, and use a firm but encouraging tone.';
      } else if (personaTone === 'Gentle Friend') {
         toneInstruction = 'You are a Gentle Friend. Be extremely empathetic, soft, understanding, and focus on mental well-being over raw productivity. Be deeply encouraging.';
      } else {
         toneInstruction = 'You are Balanced. Be supportive but honest and action-oriented.';
      }

      const languageInstruction = `CRITICAL INSTRUCTION: You MUST reply entirely in ${selectedLanguage}.`;
      const memoryInstruction = `\nIf the user tells you an important personal fact (e.g. "I am a student", "I want to lose 10kg"), output exactly: [MEMORY: The fact]. Put this tag at the very end of your response so it can be extracted.`;

      const prompt = `${BASE_PROMPT}\n\nTONE INSTRUCTION: ${toneInstruction}${memoryText}\n\n${languageInstruction}${memoryInstruction}\n\nChat History:\n${historyText}\n\nUser: ${userText}\nAssistant:`;

      let finalContents = prompt;
      if (attachmentsForTurn && attachmentsForTurn.length > 0) {
        try {
          const parts = await Promise.all(attachmentsForTurn.map(async (att) => {
            const base64 = await fileToBase64(att.file);
            return {
              inlineData: {
                data: base64,
                mimeType: att.type
              }
            };
          }));
          finalContents = [...parts, prompt];
        } catch (err) {
          console.error("File processing error", err);
        }
      }

      updateMessages(prev => [...prev, { role: 'bot', content: '' }]);
      setIsTyping(true);

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: finalContents,
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        setIsTyping(false);
        fullText += chunk.text;
        
        let displayContent = fullText;
        const memoryMatch = fullText.match(/\[MEMORY:\s*(.*?)\]/);
        if (memoryMatch) {
            displayContent = fullText.replace(memoryMatch[0], '').trim();
            if (!userMemories.includes(memoryMatch[1])) {
                const newMemories = [...userMemories, memoryMatch[1]];
                setUserMemories(newMemories);
                if (userProfile) localStorage.setItem(`user_memories_${userProfile.uid}`, JSON.stringify(newMemories));
            }
        }

        updateMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = displayContent;
          return newMessages;
        });
      }
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      updateMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].content === '') {
           newMessages[newMessages.length - 1].content = `**Error:** ${error.message}`;
        } else {
           newMessages.push({ role: 'bot', content: `**Error:** ${error.message}` });
        }
        return newMessages;
      });
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isTyping) return;

    if (isListening) toggleListening();

    const currentAttachments = [...attachments];
    setAttachments([]);

    const userMsg = { role: 'user', content: input.trim(), attachments: currentAttachments };
    const newHistory = [...messages, userMsg];
    updateMessages(newHistory);
    setInput('');
    
    const textarea = document.getElementById('chat-input');
    if (textarea) textarea.style.height = 'auto';

    generateResponse(userMsg.content, newHistory, currentAttachments);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- RENDER ---
  if (!userProfile) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Background Creative Elements */}
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header" onClick={() => setActiveSessionId(null)} style={{ cursor: 'pointer' }}>
          <Compass className="text-accent-primary" size={28} />
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
                className={`session-item ${activeSessionId === session.id ? 'active' : ''}`}
                onClick={() => { setActiveSessionId(session.id); if(window.innerWidth <= 768) setSidebarOpen(false); }}
              >
                <MessageSquare size={16} className="session-icon" />
                {editingSessionId === session.id ? (
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveEditingTitle(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditingTitle(session.id);
                      if (e.key === 'Escape') setEditingSessionId(null);
                    }}
                    autoFocus
                    style={{ flex: 1, background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', border: '1px solid var(--accent-primary)', borderRadius: '4px', padding: '2px 4px', fontSize: '0.9rem', outline: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="session-title">{session.title}</span>
                    <button className="session-edit" onClick={(e) => startEditingTitle(session.id, session.title, e)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="session-delete" onClick={(e) => deleteSession(session.id, e)}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
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
                <button className="dropdown-item" onClick={() => { setShowUpgradeModal(true); setShowUserMenu(false); }}><Sparkles size={16}/> Upgrade plan</button>
                <button className="dropdown-item" onClick={() => { setIsDarkMode(!isDarkMode); setShowUserMenu(false); }}><Moon size={16}/> Personalization</button>
                <button className="dropdown-item" onClick={() => { setShowProfileModal(true); setShowUserMenu(false); }}><User size={16}/> Profile</button>
                <button className="dropdown-item" onClick={() => { setShowSettings(true); setShowUserMenu(false); }}><Settings size={16}/> Settings</button>
                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }}></div>
                <button className="dropdown-item" style={{ justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}><LifeBuoy size={16}/> Help</span>
                  <ChevronRight size={16} className="text-text-secondary"/>
                </button>
                <button className="dropdown-item" onClick={handleLogout}><LogOut size={16}/> Log out</button>
              </div>
            )}
            
            <button className="sidebar-btn" onClick={() => setShowUserMenu(!showUserMenu)} style={{ justifyContent: 'flex-start', padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                {userProfile.photoURL ? (
                  <img src={userProfile.photoURL} alt="Profile" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-glass-heavy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} />
                  </div>
                )}
                <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userProfile.displayName || "User"}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="main-area">
        {!activeSessionId ? (
           <Dashboard user={userProfile} onNewChat={createNewChat} />
        ) : (
          <>
            {/* Header */}
            <header className="header glass-panel" style={{ borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0 }}>
              <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginRight: '1rem', display: window.innerWidth > 768 ? 'none' : 'flex' }}>
                <Menu size={24} />
              </button>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 500, display: window.innerWidth > 768 ? 'block' : 'none' }}>{activeSession.title}</h1>
              
              <div style={{ flex: 1 }}></div>
              
              <button className="btn-icon" onClick={handleShare} title="Share Chat" style={{ marginRight: '0.5rem' }}>
                <Share2 size={18} />
              </button>

              <button 
                className="btn-icon" 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                title="Toggle Theme"
                style={{ marginRight: '0.5rem', background: 'rgba(255,255,255,0.05)' }}
              >
                {isDarkMode ? <Sun size={18} className="text-text-secondary" /> : <Moon size={18} className="text-text-secondary" />}
              </button>

              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)' }}>
                <Globe size={16} className="text-accent-primary" />
                <select 
                  value={selectedLanguage} 
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
                >
                  <option value="English" style={{ color: 'black' }}>English</option>
                  <option value="Hindi" style={{ color: 'black' }}>हिंदी</option>
                  <option value="Kannada" style={{ color: 'black' }}>ಕನ್ನಡ</option>
                </select>
              </div>

              <button className="btn-icon" onClick={clearChat} title="Clear Current Chat" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <Trash2 size={18} />
              </button>
            </header>

            {/* Chat Area */}
            <div className="chat-container" ref={chatContainerRef} onClick={() => setSidebarOpen(false)}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-row ${msg.role} animate-fade-in-up`}>
                  {msg.role === 'bot' && (
                    <div className="message-avatar bot-avatar">
                      <Bot size={20} className="text-accent-primary" />
                    </div>
                  )}
                  
                  <div className="message-bubble-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'bot' ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                    <div className="message-bubble glass-panel-hover" style={{ position: 'relative' }}>
                      <div className="message-content">
                        {editingMsgIdx === idx ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '300px' }}>
                            <textarea 
                              value={editMsgText}
                              onChange={(e) => setEditMsgText(e.target.value)}
                              style={{ width: '100%', background: 'var(--code-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem', minHeight: '80px', outline: 'none', resize: 'vertical' }}
                              autoFocus
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                              <button onClick={() => setEditingMsgIdx(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>Cancel</button>
                              <button onClick={() => submitEditMessage(idx)} style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 500 }}>Save & Submit</button>
                            </div>
                          </div>
                        ) : msg.role === 'bot' ? (
                          <Markdown>{msg.content}</Markdown>
                        ) : (
                          <>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: msg.content ? '0.5rem' : '0' }}>
                                {msg.attachments.map((att, i) => (
                                  <div key={i} style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)', maxWidth: '150px' }}>
                                    {att.type?.startsWith('image/') ? (
                                      <img src={att.url} alt={att.name} style={{ width: '100%', height: 'auto', display: 'block' }} />
                                    ) : (
                                      <div style={{ padding: '0.5rem', background: 'var(--bg-glass-heavy)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Paperclip size={14} /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {msg.content}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Message Action Bar */}
                    {msg.role === 'bot' && !isTyping && (
                      <div className="message-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', opacity: 0.6, transition: 'opacity 0.2s' }}>
                        <button onClick={() => speakText(msg.content)} style={{ background: 'transparent', border: 'none', color: isSpeaking ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }} title="Read Aloud">
                          <Volume2 size={14} />
                        </button>
                        <button onClick={() => handleCopy(msg.content, idx)} style={{ background: 'transparent', border: 'none', color: copiedIdx === idx ? '#10b981' : 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }} title="Copy">
                          {copiedIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: 'Parthasarathi AI', text: msg.content }).catch(console.error);
                          } else {
                            handleCopy(msg.content, idx);
                          }
                        }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }} title="Share Message">
                          <Share2 size={14} />
                        </button>
                      </div>
                    )}
                    {msg.role === 'user' && !isTyping && editingMsgIdx !== idx && (
                      <div className="message-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', opacity: 0.6, transition: 'opacity 0.2s' }}>
                        <button onClick={() => { setEditingMsgIdx(idx); setEditMsgText(msg.content); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }} title="Edit">
                          <Edit3 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="message-avatar user-avatar" style={{ background: 'transparent', padding: 0 }}>
                      {userProfile.photoURL ? (
                        <img src={userProfile.photoURL} alt="User" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={20} color="white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="message-row bot animate-fade-in-up">
                  <div className="message-avatar bot-avatar">
                    <Bot size={20} className="text-accent-primary" />
                  </div>
                  <div className="message-bubble glass-panel-hover" style={{ padding: '1.25rem' }}>
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}

              {messages.length === 1 && !isTyping && (
                <div className="suggested-prompts animate-fade-in-up" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
                  {[
                    { title: "Plan my day", icon: <Clock size={18}/>, prompt: "Help me create a structured daily schedule for maximum productivity." },
                    { title: "Build a habit", icon: <Activity size={18}/>, prompt: "I want to start a new habit. What's the best way to stay consistent?" },
                    { title: "Study plan", icon: <BookOpen size={18}/>, prompt: "Create a 7-day study plan for my upcoming exams." }
                  ].map((p, i) => (
                    <button key={i} className="glass-panel-hover" style={{ padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border-color)', background: 'var(--bg-glass)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: '1 1 calc(33% - 1rem)', minWidth: '220px', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.2s, box-shadow 0.2s' }} onClick={() => {
                        setInput(p.prompt);
                        setTimeout(() => document.getElementById('chat-input').focus(), 100);
                    }}>
                      <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>{p.icon} {p.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.prompt}</div>
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="input-area-wrapper">
              {attachments.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', overflowX: 'auto', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0', border: '1px solid var(--border-color)', borderBottom: 'none' }}>
                  {attachments.map((att, idx) => (
                    <div key={idx} style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                      {att.type.startsWith('image/') ? (
                        <img src={att.url} alt={att.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                      ) : (
                        <div style={{ width: '60px', height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-glass-heavy)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', padding: '0.25rem' }}>
                          <Paperclip size={20} className="text-text-secondary" />
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{att.name}</span>
                        </div>
                      )}
                      <button 
                        type="button" 
                        onClick={() => removeAttachment(idx)} 
                        style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                      >
                        <CloseIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <form className="input-container glass-panel" onSubmit={handleSend} style={{ borderRadius: attachments.length > 0 ? '0 0 var(--radius-xl) var(--radius-xl)' : 'var(--radius-xl)' }}>
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.txt,.doc,.docx"
                />
                <button 
                  type="button" 
                  className="btn-icon"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach File (Max 5MB)"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Paperclip size={20} />
                </button>
                <textarea
                  id="chat-input"
                  className="chat-input"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "Listening..." : "Message Parthasarathi..."}
                  rows={1}
                />
                
                <button 
                  type="button" 
                  className={`btn-icon ${isListening ? 'listening-pulse' : ''}`}
                  onClick={toggleListening}
                  style={{ color: isListening ? '#ef4444' : 'var(--text-secondary)' }}
                  title="Voice Input"
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <button 
                  type="submit" 
                  className={`btn-icon ${input.trim() ? 'primary' : ''}`}
                  disabled={!input.trim() || isTyping}
                >
                  <Send size={20} />
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Parthasarathi can make mistakes. Focus on actionable insights.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)} style={{ zIndex: 100 }}>
          <div className="glass-panel settings-modal" onClick={e => e.stopPropagation()} style={{ 
            padding: '2rem', borderRadius: '1.5rem', width: '90%', maxWidth: '400px',
            animation: 'fadeInUp 0.3s ease-out'
          }}>
            <button className="modal-close" onClick={() => setShowSettings(false)} style={{ top: '1rem', right: '1rem', position: 'absolute' }}><CloseIcon size={20}/></button>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '1.25rem' }}>
              <Settings size={22} className="text-accent-primary" /> Settings
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Persona Tone</label>
              <select 
                value={personaTone}
                onChange={(e) => setPersonaTone(e.target.value)}
                style={{ width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="Balanced" style={{color: 'black'}}>Balanced (Default)</option>
                <option value="Strict Coach" style={{color: 'black'}}>Strict Coach</option>
                <option value="Gentle Friend" style={{color: 'black'}}>Gentle Friend</option>
              </select>
            </div>

            <form onSubmit={handleSaveKey}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Gemini API Key</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  style={{ 
                    width: '100%', padding: '0.85rem', borderRadius: 'var(--radius-md)', 
                    background: 'var(--bg-glass-heavy)', border: '1px solid var(--border-color)', 
                    color: 'var(--text-primary)', outline: 'none', transition: 'var(--transition)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
              <button type="submit" className="btn-icon primary" style={{ width: '100%', borderRadius: '0.75rem', padding: '0.85rem', height: 'auto', fontWeight: 600, fontSize: '1rem' }}>
                Save Settings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Render Modals over everything */}
      {showUpgradeModal && <UpgradePlan onClose={() => setShowUpgradeModal(false)} />}
      {showProfileModal && <UserProfile user={userProfile} onClose={() => setShowProfileModal(false)} onLogout={handleLogout} />}
    </div>
  );
}

export default App;
