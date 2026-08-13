import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Flame, 
  Target, 
  Play, 
  FileText, 
  Award, 
  BarChart3, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Briefcase,
  TrendingUp,
  TrendingDown,
  Percent,
  MessageSquare,
  CheckCheck,
  Timer,
  Calendar,
  CalendarDays,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { apiClient } from '../api/client';
import { DashboardStats } from '../types';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { SkeletonLoader } from '../components/SkeletonLoader';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await apiClient.get('/dashboard/stats');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatHoursMins = (totalMinutes: number) => {
    if (!totalMinutes || totalMinutes <= 0) return '0 Mins';
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs === 0) return `${mins} Mins`;
    return `${hrs}h ${mins}m`;
  };

  const hasCompletedSessions = (data?.stats.totalCompleted || 0) > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 w-full flex-1">
        <Sidebar />

        <main className="flex-1 space-y-8 overflow-hidden">
          {isLoading ? (
            <div className="space-y-6">
              <SkeletonLoader count={1} height="h-36" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SkeletonLoader count={4} height="h-28" />
              </div>
              <SkeletonLoader count={2} height="h-48" />
            </div>
          ) : (
            <>
              {/* Greeting & Banner */}
              <GlassCard className="relative overflow-hidden bg-gradient-to-r from-brand-950/80 via-indigo-950/70 to-slate-900/90 border-brand-500/30 p-8">
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" /> Ready for your next mock interview?
                  </div>
                  <h1 className="text-3xl font-extrabold text-white">{data?.greeting}</h1>
                  <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                    AI-powered mock interviews tailored to your target job role. Practice live, receive instant multi-metric feedback, and track your interview readiness.
                  </p>
                </div>
              </GlassCard>

              {/* Core Real-Data Metric Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-400" /> Real-Time Performance Dashboard
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Total Interviews */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-brand-400">
                      <span className="text-[11px] font-semibold">Total Interviews</span>
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">{data?.stats.totalInterviews || 0}</div>
                    <div className="text-[10px] text-slate-400">All sessions initiated</div>
                  </GlassCard>

                  {/* Completed Interviews */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-emerald-400">
                      <span className="text-[11px] font-semibold">Completed</span>
                      <CheckCheck className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">{data?.stats.totalCompleted || 0}</div>
                    <div className="text-[10px] text-slate-400">Evaluated sessions</div>
                  </GlassCard>

                  {/* Pending Interviews */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-amber-400">
                      <span className="text-[11px] font-semibold">Pending</span>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">{data?.stats.pendingInterviews || 0}</div>
                    <div className="text-[10px] text-slate-400">In-progress sessions</div>
                  </GlassCard>

                  {/* Average Score */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-cyan-400">
                      <span className="text-[11px] font-semibold">Average Score</span>
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {data?.stats.averageScore ? `${data.stats.averageScore}%` : '0%'}
                    </div>
                    <div className="text-[10px] text-slate-400">Across completed</div>
                  </GlassCard>

                  {/* Highest Score */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-indigo-400">
                      <span className="text-[11px] font-semibold">Highest Score</span>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {data?.stats.highestScore ? `${data.stats.highestScore}%` : '0%'}
                    </div>
                    <div className="text-[10px] text-slate-400">Top performance rating</div>
                  </GlassCard>

                  {/* Lowest Score */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-rose-400">
                      <span className="text-[11px] font-semibold">Lowest Score</span>
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {data?.stats.lowestScore ? `${data.stats.lowestScore}%` : '0%'}
                    </div>
                    <div className="text-[10px] text-slate-400">Baseline performance</div>
                  </GlassCard>

                  {/* Total Practice Time */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-fuchsia-400">
                      <span className="text-[11px] font-semibold">Total Practice Time</span>
                      <Timer className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {formatHoursMins(data?.stats.totalPracticeTimeMinutes || 0)}
                    </div>
                    <div className="text-[10px] text-slate-400">Time spent answering</div>
                  </GlassCard>

                  {/* Current Streak */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-amber-500">
                      <span className="text-[11px] font-semibold">Current Streak</span>
                      <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {data?.stats.currentStreak || 0} <span className="text-xs text-slate-400 font-normal">Days</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Consecutive days active</div>
                  </GlassCard>

                  {/* Longest Streak */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-orange-400">
                      <span className="text-[11px] font-semibold">Longest Streak</span>
                      <Flame className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {data?.stats.longestStreak || 0} <span className="text-xs text-slate-400 font-normal">Days</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Personal record</div>
                  </GlassCard>

                  {/* ATS Resume Score */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-purple-400">
                      <span className="text-[11px] font-semibold">Resume ATS Score</span>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {data?.resumeScore !== null && data?.resumeScore !== undefined ? `${data.resumeScore}%` : 'N/A'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {data?.resumeScore !== null && data?.resumeScore !== undefined ? 'Latest PDF analysis' : 'No resume uploaded'}
                    </div>
                  </GlassCard>

                  {/* Interview Accuracy */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-emerald-400">
                      <span className="text-[11px] font-semibold">Interview Accuracy</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {data?.stats.interviewAccuracy ? `${data.stats.interviewAccuracy}%` : '0%'}
                    </div>
                    <div className="text-[10px] text-slate-400">Technical precision score</div>
                  </GlassCard>

                  {/* Questions Answered */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-sky-400">
                      <span className="text-[11px] font-semibold">Questions Answered</span>
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {data?.stats.questionsAnswered || 0}
                    </div>
                    <div className="text-[10px] text-slate-400">Responses recorded</div>
                  </GlassCard>

                  {/* Communication Improvement */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-indigo-400">
                      <span className="text-[11px] font-semibold">Comm. Improvement</span>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {data?.stats.communicationImprovement !== undefined && data.stats.communicationImprovement !== null
                        ? `${data.stats.communicationImprovement >= 0 ? '+' : ''}${data.stats.communicationImprovement}%`
                        : '+0%'}
                    </div>
                    <div className="text-[10px] text-slate-400">Vs previous session</div>
                  </GlassCard>

                  {/* Technical Improvement */}
                  <GlassCard className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-teal-400">
                      <span className="text-[11px] font-semibold">Tech Improvement</span>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="text-2xl font-black text-white">
                      {data?.stats.technicalImprovement !== undefined && data.stats.technicalImprovement !== null
                        ? `${data.stats.technicalImprovement >= 0 ? '+' : ''}${data.stats.technicalImprovement}%`
                        : '+0%'}
                    </div>
                    <div className="text-[10px] text-slate-400">Vs previous session</div>
                  </GlassCard>
                </div>
              </div>

              {/* Continue Active Interview Banner (if any) */}
              {data?.continueInterview && (
                <GlassCard className="border-amber-500/40 bg-amber-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Interview In Progress</div>
                      <h3 className="text-base font-bold text-white">{data.continueInterview.role} ({data.continueInterview.difficulty})</h3>
                      <p className="text-xs text-slate-400">{data.continueInterview.duration_minutes} Minutes Duration • Auto-saved draft ready</p>
                    </div>
                  </div>
                  <Link to={`/interview/session/${data.continueInterview.id}`}>
                    <Button variant="primary" icon={<Play className="w-4 h-4 fill-white" />}>
                      Resume Interview
                    </Button>
                  </Link>
                </GlassCard>
              )}

              {/* Weekly & Monthly Progress Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 7-Day Weekly Progress Area Chart */}
                <GlassCard className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                      <Calendar className="w-4 h-4 text-brand-400" /> 7-Day Weekly Progress
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">Daily Avg Score</span>
                  </div>

                  <div className="h-56 w-full pt-2">
                    {hasCompletedSessions && data?.weeklyProgress && data.weeklyProgress.some(d => d.score > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.weeklyProgress}>
                          <defs>
                            <linearGradient id="weekScoreGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#536df8" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#536df8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                          <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                          />
                          <Area type="monotone" dataKey="score" stroke="#536df8" strokeWidth={2.5} fillOpacity={1} fill="url(#weekScoreGrad)" name="Avg Score %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs p-4">
                        <Calendar className="w-8 h-8 text-slate-600 mb-2" />
                        <p>No interview activity in the past 7 days.</p>
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* 6-Month Monthly Progress Bar Chart */}
                <GlassCard className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                      <CalendarDays className="w-4 h-4 text-cyan-400" /> Monthly Performance Trend
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">Monthly Avg</span>
                  </div>

                  <div className="h-56 w-full pt-2">
                    {hasCompletedSessions && data?.monthlyProgress && data.monthlyProgress.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.monthlyProgress}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                          <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                          />
                          <Bar dataKey="avgScore" fill="#38bdf8" radius={[6, 6, 0, 0]} name="Avg Score %" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs p-4">
                        <CalendarDays className="w-8 h-8 text-slate-600 mb-2" />
                        <p>No monthly completed interviews recorded yet.</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Quick Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard hoverEffect className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Start New Mock Interview</h3>
                    <p className="text-xs text-slate-400 mt-1">Select from 12+ tech roles, set difficulty level, and get single-question AI evaluation.</p>
                  </div>
                  <Link to="/interview/setup" className="inline-block">
                    <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                      Configure & Begin
                    </Button>
                  </Link>
                </GlassCard>

                <GlassCard hoverEffect className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Analyze Resume with ATS AI</h3>
                    <p className="text-xs text-slate-400 mt-1">Upload your PDF resume to extract key skills, calculate real ATS match score, and view project ideas.</p>
                  </div>
                  <Link to="/resume" className="inline-block">
                    <Button variant="secondary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                      Upload PDF Resume
                    </Button>
                  </Link>
                </GlassCard>
              </div>

              {/* Recent Interviews */}
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-400" /> Recent Mock Interviews
                  </h3>
                  <Link to="/history" className="text-xs text-brand-400 hover:underline">
                    View All History →
                  </Link>
                </div>

                {data?.recentInterviews && data.recentInterviews.length > 0 ? (
                  <div className="space-y-3">
                    {data.recentInterviews.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 rounded-xl bg-slate-900/50 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-500/30 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm text-white">{session.role}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {session.difficulty}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              session.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {session.status === 'completed' ? 'Completed' : 'In Progress'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-3">
                            <span>{new Date(session.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                            <span>•</span>
                            <span>{session.duration_minutes} Mins</span>
                            {session.answered_questions !== undefined && (
                              <>
                                <span>•</span>
                                <span>{session.answered_questions} Questions Answered</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                          {session.status === 'completed' && session.overall_score !== undefined ? (
                            <div className="text-right">
                              <div className="text-lg font-black text-emerald-400">{session.overall_score}%</div>
                              <Link to={`/interview/feedback/${session.id}`} className="text-[11px] text-brand-400 hover:underline block">
                                View Report →
                              </Link>
                            </div>
                          ) : (
                            <Link to={`/interview/session/${session.id}`}>
                              <Button size="sm" variant="primary" icon={<Play className="w-3.5 h-3.5 fill-white" />}>
                                Resume
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs space-y-3 border border-dashed border-white/10 rounded-2xl p-6">
                    <p className="text-sm text-slate-300 font-medium">No interviews completed yet.</p>
                    <p className="text-xs text-slate-500">Take your first AI mock interview to generate real performance scores and feedback reports.</p>
                    <Link to="/interview/setup" className="inline-block pt-2">
                      <Button size="sm" variant="primary">Start Your First Interview</Button>
                    </Link>
                  </div>
                )}
              </GlassCard>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
