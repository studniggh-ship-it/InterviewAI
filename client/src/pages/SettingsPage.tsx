import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Monitor,
  Bell, 
  Globe, 
  ShieldCheck, 
  FileText, 
  Info, 
  LogOut, 
  CheckCircle2, 
  X,
  Sparkles,
  Volume2
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useVoiceSpeech, VoiceGender } from '../hooks/useVoiceSpeech';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { ThemeMode } from '../types';

export const SettingsPage: React.FC = () => {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const { availableVoices, voiceSettings, updateVoiceSettings, testVoice } = useVoiceSpeech();

  const [notifications, setNotifications] = useState<boolean>(true);
  const [language, setLanguage] = useState<string>('en');
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'about' | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/settings');
      if (res.data) {
        if (res.data.theme) setTheme(res.data.theme as ThemeMode);
        setNotifications(Boolean(res.data.notifications_enabled));
        setLanguage(res.data.language || 'en');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSaveSettings = async (overrideTheme?: ThemeMode) => {
    setIsSaving(true);
    const activeTheme = overrideTheme || theme;
    try {
      await apiClient.put('/settings', {
        theme: activeTheme,
        notifications_enabled: notifications,
        language,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    handleSaveSettings(newTheme);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 w-full flex-1">
        <Sidebar />

        <main className="flex-1 space-y-6 max-w-3xl">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <SettingsIcon className="w-6 h-6 text-slate-400" /> Settings & Preferences
            </h1>
            <p className="text-xs text-slate-400">Configure theme modes, notification alerts, language, and legal information.</p>
          </div>

          {savedSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> <span>Settings saved and synced to database successfully.</span>
            </div>
          )}

          <GlassCard className="p-6 space-y-6">
            {/* 3-Way Theme Switcher */}
            <div className="space-y-3 py-2 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Appearance Theme</div>
                  <div className="text-xs text-slate-400">Select your preferred user interface color scheme</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { mode: 'dark' as ThemeMode, label: 'Dark Mode', icon: Moon, desc: 'High contrast sleek dark' },
                  { mode: 'light' as ThemeMode, label: 'Light Mode', icon: Sun, desc: 'Crisp & clear bright mode' },
                  { mode: 'system' as ThemeMode, label: 'System Default', icon: Monitor, desc: 'Sync with OS setting' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = theme === item.mode;
                  return (
                    <button
                      key={item.mode}
                      onClick={() => handleThemeChange(item.mode)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-brand-600/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                          : 'bg-slate-900/40 border-white/5 text-slate-300 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-400' : 'text-slate-400'}`} />
                        {isSelected && <div className="w-2 h-2 rounded-full bg-brand-400" />}
                      </div>
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Daily Streak & Evaluation Alerts</div>
                  <div className="text-xs text-slate-400">Receive notifications for interview streaks and feedback evaluations</div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => {
                    setNotifications(e.target.checked);
                    handleSaveSettings();
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            {/* AI Voice & Speech Synthesis Preferences */}
            <div className="space-y-4 py-2 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">AI Voice & Speech Synthesis</div>
                  <div className="text-xs text-slate-400">Configure voice gender, speaking speed, pitch, and volume</div>
                </div>
              </div>

              {/* Voice Gender Switcher */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">Voice Gender Preference</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['auto', 'male', 'female'] as VoiceGender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => updateVoiceSettings({ gender: g, voiceURI: '' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                        voiceSettings.gender === g
                          ? 'bg-brand-600 text-white border-brand-400 shadow-md shadow-brand-500/20'
                          : 'bg-slate-900/40 text-slate-300 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {g} Voice
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Voice Engine */}
              {availableVoices.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300">Voice Engine</div>
                  <select
                    value={voiceSettings.voiceURI}
                    onChange={(e) => updateVoiceSettings({ voiceURI: e.target.value })}
                    className="w-full p-2.5 rounded-xl glass-input text-xs text-white"
                  >
                    <option value="">Default ({voiceSettings.gender.toUpperCase()})</option>
                    {availableVoices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Speed & Pitch Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">Speech Rate</span>
                    <span className="font-bold text-brand-400">{voiceSettings.speed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.75"
                    step="0.05"
                    value={voiceSettings.speed}
                    onChange={(e) => updateVoiceSettings({ speed: parseFloat(e.target.value) })}
                    className="w-full accent-brand-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">Speech Pitch</span>
                    <span className="font-bold text-cyan-400">{voiceSettings.pitch.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.05"
                    value={voiceSettings.pitch}
                    onChange={(e) => updateVoiceSettings({ pitch: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Test Voice Audition */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => testVoice()}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5 text-brand-400" />
                  <span>Audition AI Voice</span>
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Application Language</div>
                  <div className="text-xs text-slate-400">Interface and AI interview prompts response language</div>
                </div>
              </div>

              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  handleSaveSettings();
                }}
                className="px-3 py-1.5 rounded-xl glass-input text-xs font-medium cursor-pointer"
              >
                <option value="en">English (US)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
                <option value="hi">Hindi (हिंदी)</option>
              </select>
            </div>

            {/* Legal & App Information Links */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">About & Compliance</div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveModal('privacy')}
                  className="p-3 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 text-left flex items-center gap-2.5 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Privacy Policy</span>
                </button>

                <button
                  onClick={() => setActiveModal('terms')}
                  className="p-3 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 text-left flex items-center gap-2.5 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>Terms of Service</span>
                </button>

                <button
                  onClick={() => setActiveModal('about')}
                  className="p-3 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 text-left flex items-center gap-2.5 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>About InterviewAI</span>
                </button>
              </div>
            </div>

            {/* Logout Action */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Logged in securely. Ready to sign out?
              </div>

              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                icon={<LogOut className="w-4 h-4" />}
              >
                Log Out
              </Button>
            </div>
          </GlassCard>
        </main>
      </div>

      {/* Interactive Information Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/60 flex items-center justify-center p-4">
          <GlassCard className="max-w-2xl w-full p-6 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {activeModal === 'privacy' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                {activeModal === 'terms' && <FileText className="w-5 h-5 text-brand-400" />}
                {activeModal === 'about' && <Info className="w-5 h-5 text-cyan-400" />}
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'terms' && 'Terms of Service'}
                {activeModal === 'about' && 'About InterviewAI'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-4 leading-relaxed">
              {activeModal === 'privacy' && (
                <>
                  <p>
                    <strong>Data Protection & Privacy:</strong> InterviewAI processes candidate mock interview recordings, text responses, and uploaded resume PDFs strictly for AI evaluation, scoring rubrics, and feedback report generation.
                  </p>
                  <p>
                    Your authentication credentials are encrypted using industry-standard bcrypt hashing. SQLite database stores all session history and metrics locally in your dedicated user profile.
                  </p>
                  <p>
                    We do not sell candidate data or resume contents to third parties. All text transmissions use authenticated HTTPS transport.
                  </p>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p>
                    <strong>Terms of Use:</strong> By using InterviewAI, you agree to utilize the AI mock interview practice room for personal interview preparation and skill enhancement.
                  </p>
                  <p>
                    The AI feedback reports and ATS resume scores provided are analytical estimations to assist preparation and do not constitute hiring guarantees from prospective employers.
                  </p>
                  <p>
                    Users must maintain their account credentials securely and agree not to reverse engineer or overload API rate limits.
                  </p>
                </>
              )}

              {activeModal === 'about' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-brand-950/40 border border-brand-500/20 text-slate-200">
                    <p className="text-xs leading-relaxed">
                      <strong>InterviewAI</strong> is an AI-powered technical interview practice platform developed by <strong className="text-white">Gesha Morphic</strong>.
                    </p>
                  </div>

                  {/* Architecture & Tech Stack Specs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Engine</div>
                      <div className="text-xs font-semibold text-brand-300">AI-powered interview intelligence</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database</div>
                      <div className="text-xs font-semibold text-emerald-300">SQLite (High Concurrency, WAL Mode)</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technology Stack</div>
                      <div className="text-xs font-semibold text-cyan-300">React, TypeScript, Express and TailwindCSS</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Voice & Speech</div>
                      <div className="text-xs font-semibold text-purple-300">Web Speech Synthesis & Recognition API</div>
                    </div>
                  </div>

                  {/* Interview Details Section */}
                  <div className="space-y-2.5 pt-1">
                    <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                      <span>Interview Details</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
                        <div className="text-xs font-bold text-slate-200">• AI-Powered Mock Interviews</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Practice realistic technical interviews with dynamically generated questions tailored to industry standards.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
                        <div className="text-xs font-bold text-slate-200">• Role-Based Questions</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Questions tailored to the selected role, including Software Engineer, Frontend Developer, Backend Developer, AI / Machine Learning Engineer, Data Analyst, Business Analyst, and Custom Tech Roles.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
                        <div className="text-xs font-bold text-slate-200">• Adaptive Interview Flow</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Questions progress based on the interview session and candidate's previous responses to provide authentic depth.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
                        <div className="text-xs font-bold text-slate-200">• Multiple Question Types</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Structured coverage across technical, conceptual, problem-solving, architectural, behavioral, and role-specific domains.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
                        <div className="text-xs font-bold text-slate-200">• Real-Time Response Evaluation</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Candidate responses are evaluated across individual scoring rubrics to produce meaningful, objective feedback.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
                        <div className="text-xs font-bold text-slate-200">• Multi-Dimensional Performance Feedback</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Comprehensive evaluation covering Technical Accuracy, Relevance, Clarity, Communication, Technical Depth, Key Strengths, Areas for Improvement, and Suggested Improved Answers.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
                        <div className="text-xs font-bold text-slate-200">• Interview History & Progress Tracking</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Completed interviews, transcripts, and score analytics are recorded locally for review and continuous performance tracking.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
                        <div className="text-xs font-bold text-slate-200">• Resume-Assisted Practice</div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          ATS resume analysis extracts candidate skills and domain background to create highly relevant, resume-assisted interview sessions.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Closing Statement */}
                  <div className="pt-2 border-t border-white/10 text-[11px] text-slate-300 italic">
                    "InterviewAI is designed to help candidates practice consistently, identify their weaknesses, and approach technical interviews with greater confidence."
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setActiveModal(null)}>
                Close
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
