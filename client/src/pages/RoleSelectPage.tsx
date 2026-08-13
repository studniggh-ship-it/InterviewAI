import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Sparkles, 
  Clock, 
  BarChart, 
  ArrowRight, 
  CheckCircle2, 
  Code, 
  Cpu, 
  LineChart, 
  Layers, 
  Terminal, 
  Users,
  FileText
} from 'lucide-react';
import { apiClient } from '../api/client';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';

const PREDEFINED_ROLES = [
  { name: 'Software Engineer', icon: Code, category: 'Engineering' },
  { name: 'Frontend Developer', icon: Layers, category: 'Engineering' },
  { name: 'Backend Developer', icon: Terminal, category: 'Engineering' },
  { name: 'Full Stack Developer', icon: Cpu, category: 'Engineering' },
  { name: 'Flutter Developer', icon: Code, category: 'Mobile' },
  { name: 'Python Developer', icon: Terminal, category: 'Engineering' },
  { name: 'Java Developer', icon: Code, category: 'Engineering' },
  { name: 'AI Engineer', icon: Sparkles, category: 'AI & Data' },
  { name: 'Machine Learning Engineer', icon: Cpu, category: 'AI & Data' },
  { name: 'Data Analyst', icon: LineChart, category: 'AI & Data' },
  { name: 'Business Analyst', icon: LineChart, category: 'Business' },
  { name: 'HR Manager', icon: Users, category: 'Operations' },
  { name: 'Marketing Manager', icon: Briefcase, category: 'Marketing' },
];

export const RoleSelectPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string>('Software Engineer');
  const [customRole, setCustomRole] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [duration, setDuration] = useState<number>(20);
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchLatestResume();
  }, []);

  const fetchLatestResume = async () => {
    try {
      const res = await apiClient.get('/resume/latest');
      if (res.data.analysis) {
        setResumeId(res.data.analysis.id);
        setResumeFilename(res.data.analysis.originalFilename);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleStart = async () => {
    const finalRole = isCustom ? customRole.trim() : selectedRole;
    if (!finalRole) return;

    setIsLoading(true);
    try {
      const res = await apiClient.post('/interviews/start', {
        role: finalRole,
        difficulty,
        duration_minutes: duration,
        resume_id: resumeId || null,
      });

      const interviewId = res.data.interview.id;
      navigate(`/interview/session/${interviewId}`, { state: { initialQuestion: res.data.currentQuestion } });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to initialize interview session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 w-full flex-1">
        <Sidebar />

        <main className="flex-1 space-y-8 max-w-4xl">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Briefcase className="w-6 h-6 text-brand-400" /> Configure Your AI Mock Interview
            </h1>
            <p className="text-xs text-slate-400">
              Customize your target job position, difficulty level, and session duration. Gemini AI will synthesize adaptive questions in real-time.
            </p>
          </div>

          {/* Role Selection */}
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">1. Select Target Job Role</h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {PREDEFINED_ROLES.map((roleObj) => {
                const Icon = roleObj.icon;
                const isSelected = !isCustom && selectedRole === roleObj.name;
                return (
                  <button
                    key={roleObj.name}
                    onClick={() => {
                      setSelectedRole(roleObj.name);
                      setIsCustom(false);
                    }}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                        : 'bg-slate-900/40 border-white/5 text-slate-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-semibold">{roleObj.name}</div>
                      <div className="text-[10px] text-slate-400">{roleObj.category}</div>
                    </div>
                  </button>
                );
              })}

              {/* Custom Role Button */}
              <button
                onClick={() => setIsCustom(true)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all ${
                  isCustom
                    ? 'bg-brand-600/20 border-brand-500 text-white'
                    : 'bg-slate-900/40 border-white/5 text-slate-300 hover:border-white/20'
                }`}
              >
                <Sparkles className={`w-5 h-5 ${isCustom ? 'text-brand-400' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-semibold">Custom Role</div>
                  <div className="text-[10px] text-slate-400">Specify any role</div>
                </div>
              </button>
            </div>

            {/* Custom role input */}
            {isCustom && (
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="e.g. Cloud Infrastructure Architect, DevOps Specialist..."
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
            )}
          </GlassCard>

          {/* Difficulty Level */}
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">2. Select Difficulty Level</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { level: 'Easy', desc: 'Core fundamentals & straightforward behavioral questions' },
                { level: 'Medium', desc: 'Standard industry scenarios, system concepts & code logic' },
                { level: 'Hard', desc: 'Complex architecture trade-offs, edge cases & deep technical rigor' },
              ].map((diff) => {
                const isSelected = difficulty === diff.level;
                return (
                  <button
                    key={diff.level}
                    onClick={() => setDifficulty(diff.level as any)}
                    className={`p-4 rounded-xl border text-left space-y-1.5 transition-all ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                        : 'bg-slate-900/40 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-sm">
                      <span>{diff.level}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">{diff.desc}</p>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Duration Selection */}
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">3. Select Interview Duration</h3>

            <div className="grid grid-cols-3 gap-4">
              {[
                { mins: 10, label: '10 Minutes', qns: '4 Questions' },
                { mins: 20, label: '20 Minutes', qns: '7 Questions' },
                { mins: 30, label: '30 Minutes', qns: '10 Questions' },
              ].map((dur) => {
                const isSelected = duration === dur.mins;
                return (
                  <button
                    key={dur.mins}
                    onClick={() => setDuration(dur.mins)}
                    className={`p-4 rounded-xl border text-center space-y-1 transition-all ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                        : 'bg-slate-900/40 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <Clock className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-brand-400' : 'text-slate-400'}`} />
                    <div className="font-bold text-sm">{dur.label}</div>
                    <div className="text-[11px] text-slate-400">{dur.qns}</div>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Optional Resume Attachment */}
          {resumeFilename && (
            <GlassCard className="p-4 flex items-center justify-between gap-4 border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-white">Linked Resume:</span>{' '}
                  <span className="text-purple-300">{resumeFilename}</span>
                  <p className="text-[11px] text-slate-400">AI will align questions with your resume projects and skills</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex justify-end">
            <Button
              size="lg"
              onClick={handleStart}
              isLoading={isLoading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              Start AI Interview Room
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

