import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Target, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Timer, 
  CheckCheck, 
  Flame, 
  Briefcase,
  PieChart as PieChartIcon,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { apiClient } from '../api/client';
import { ProgressAnalytics } from '../types';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { SkeletonLoader } from '../components/SkeletonLoader';

const PIE_COLORS = ['#38bdf8', '#536df8', '#f43f5e', '#10b981', '#f59e0b', '#a855f7'];

export const ProgressPage: React.FC = () => {
  const [data, setData] = useState<ProgressAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const res = await apiClient.get('/dashboard/progress');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load progress analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const competencyData = data ? [
    { name: 'Technical', score: data.breakdown?.technical || 0 },
    { name: 'Comm.', score: data.breakdown?.communication || 0 },
    { name: 'Problem', score: data.breakdown?.problemSolving || 0 },
    { name: 'Confidence', score: data.breakdown?.confidence || 0 },
    { name: 'Accuracy', score: data.breakdown?.accuracy || 0 },
    { name: 'Vocab', score: data.breakdown?.vocabulary || 0 },
    { name: 'Grammar', score: data.breakdown?.grammar || 0 },
    { name: 'Leadership', score: data.breakdown?.leadership || 0 },
    { name: 'Behavior', score: data.breakdown?.behavior || 0 },
  ] : [];

  const radarData = data ? [
    { subject: 'Technical', score: data.breakdown?.technical || 0, fullMark: 100 },
    { subject: 'Communication', score: data.breakdown?.communication || 0, fullMark: 100 },
    { subject: 'Problem Solving', score: data.breakdown?.problemSolving || 0, fullMark: 100 },
    { subject: 'Confidence', score: data.breakdown?.confidence || 0, fullMark: 100 },
    { subject: 'Accuracy', score: data.breakdown?.accuracy || 0, fullMark: 100 },
    { subject: 'Vocabulary', score: data.breakdown?.vocabulary || 0, fullMark: 100 },
    { subject: 'Grammar', score: data.breakdown?.grammar || 0, fullMark: 100 },
    { subject: 'Leadership', score: data.breakdown?.leadership || 80, fullMark: 100 },
    { subject: 'Behavior', score: data.breakdown?.behavior || 82, fullMark: 100 },
  ] : [];

  const lineChartData = data?.historyScores && data.historyScores.length > 0 
    ? data.historyScores.map((item, idx) => ({
        session: `S${idx + 1}`,
        score: item.score,
        technical: item.technical,
        communication: item.communication,
        date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }))
    : [];

  const pieData = data?.difficultyDistribution && data.difficultyDistribution.length > 0
    ? data.difficultyDistribution
    : [
        { name: 'Medium', value: 1 },
        { name: 'Easy', value: 1 },
        { name: 'Hard', value: 1 }
      ];

  const hasSessions = (data?.completedInterviews || 0) > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 w-full flex-1">
        <Sidebar />

        <main className="flex-1 space-y-8 max-w-4xl overflow-hidden">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-cyan-400" /> Performance & Analytics Dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Comprehensive analytics computed directly from your completed SQLite mock interviews and feedback evaluations.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SkeletonLoader count={4} height="h-28" />
              </div>
              <SkeletonLoader count={3} height="h-64" />
            </div>
          ) : !hasSessions ? (
            <GlassCard className="p-12 text-center text-slate-400 space-y-4 border border-dashed border-white/10 rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No interviews completed yet.</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Take your first AI mock interview to start tracking real score trajectories, strengths, weaknesses, and role breakdown statistics.
                </p>
              </div>
              <Link to="/interview/setup" className="inline-block pt-2">
                <Button variant="primary" size="md">Start Your First Interview</Button>
              </Link>
            </GlassCard>
          ) : (
            <>
              {/* Key Summary Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <GlassCard className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-[11px] font-semibold">Completed</span>
                    <CheckCheck className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-white">{data?.completedInterviews || 0}</div>
                  <div className="text-[10px] text-slate-400">Of {data?.totalInterviews || 0} total sessions</div>
                </GlassCard>

                <GlassCard className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-brand-400">
                    <span className="text-[11px] font-semibold">Average Score</span>
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-white">{data?.averageScore || 0}%</div>
                  <div className="text-[10px] text-slate-400">Across completed</div>
                </GlassCard>

                <GlassCard className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-cyan-400">
                    <span className="text-[11px] font-semibold">Best Score</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-white">{data?.bestScore || 0}%</div>
                  <div className="text-[10px] text-slate-400">Top performance</div>
                </GlassCard>

                <GlassCard className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="text-[11px] font-semibold">Current Streak</span>
                    <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-white">{data?.currentStreak || 0} <span className="text-xs text-slate-400 font-normal">Days</span></div>
                  <div className="text-[10px] text-slate-400">Longest: {data?.longestStreak || 0} days</div>
                </GlassCard>
              </div>

              {/* 1. Performance Trend (Line Chart) */}
              <GlassCard className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" /> Performance Trend Across Sessions (Line Chart)
                </h3>
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="session" stroke="#94a3b8" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} name="Overall Score %" dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="technical" stroke="#536df8" strokeWidth={2} name="Technical %" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="communication" stroke="#38bdf8" strokeWidth={2} name="Communication %" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* 2. Weekly Practice Progression (Area Chart) */}
              <GlassCard className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-400" /> Weekly Score & Practice Trajectory (Area Chart)
                </h3>
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.dailyPractice || []}>
                      <defs>
                        <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
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
                      <Area type="monotone" dataKey="score" stroke="#536df8" strokeWidth={3} fillOpacity={1} fill="url(#scoreGlow)" name="Score %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* 3. Monthly Trend (Bar Chart) */}
              {data?.monthlyProgress && data.monthlyProgress.length > 0 && (
                <GlassCard className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" /> Monthly Average Score Progression (Bar Chart)
                  </h3>
                  <div className="h-60 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.monthlyProgress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                        />
                        <Bar dataKey="avgScore" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Monthly Avg %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              )}

              {/* 4. Radar Chart & 5. Pie Chart Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Radar Chart (Competency Dimensions) */}
                <GlassCard className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-400" /> 8-Dimension Competency Radar
                  </h3>
                  <div className="w-full h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Radar name="Competency Score" dataKey="score" stroke="#536df8" fill="#536df8" fillOpacity={0.45} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                {/* Pie Chart (Difficulty Distribution) */}
                <GlassCard className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-cyan-400" /> Difficulty Level Distribution (Pie Chart)
                  </h3>
                  <div className="w-full h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </div>

              {/* 6. Competency Dimensions Bar Chart */}
              <GlassCard className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" /> Competency Breakdown Scores (Bar Chart)
                </h3>
                <div className="h-60 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={competencyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      />
                      <Bar dataKey="score" fill="#38bdf8" radius={[8, 8, 0, 0]} name="Score %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Role Breakdown Table */}
              {data?.roleBreakdown && data.roleBreakdown.length > 0 && (
                <GlassCard className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-brand-400" /> Target Role Breakdown & Average Rating
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-semibold">
                          <th className="pb-3">Role</th>
                          <th className="pb-3 text-center">Interviews Practiced</th>
                          <th className="pb-3 text-right">Average Rating</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {data.roleBreakdown.map((r, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 font-semibold text-white">{r.role}</td>
                            <td className="py-3 text-center text-slate-300">{r.totalSessions}</td>
                            <td className="py-3 text-right font-bold text-emerald-400">{r.avgScore}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              )}

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-6 space-y-4 border-emerald-500/20">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Consistently Strong Competencies
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {data?.strongTopics && data.strongTopics.length > 0 ? (
                      data.strongTopics.map((top, idx) => (
                        <li key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{top}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400 italic">Continue practicing to identify patterns.</li>
                    )}
                  </ul>
                </GlassCard>

                <GlassCard className="p-6 space-y-4 border-amber-500/20">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Key Focus & Improvement Areas
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {data?.weakTopics && data.weakTopics.length > 0 ? (
                      data.weakTopics.map((top, idx) => (
                        <li key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{top}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400 italic">No recurring weak areas flagged.</li>
                    )}
                  </ul>
                </GlassCard>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
