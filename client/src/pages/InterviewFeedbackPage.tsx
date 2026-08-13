import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  BookOpen, 
  ArrowLeft, 
  RotateCcw, 
  BarChart2, 
  UserCheck,
  Sparkles,
  ShieldAlert,
  Flame,
  Brain,
  MessageSquare,
  Compass,
  Smile,
  Download
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { apiClient } from '../api/client';
import { EvaluationReport } from '../types';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { exportInterviewPDF } from '../utils/pdfExport';

export const InterviewFeedbackPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [feedback, setFeedback] = useState<EvaluationReport | null>(
    location.state?.feedback || null
  );
  const [interviewMeta, setInterviewMeta] = useState<any>(null);
  const [qaPairs, setQaPairs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!feedback);

  useEffect(() => {
    fetchFeedbackReport();
  }, [id]);

  const fetchFeedbackReport = async () => {
    try {
      const res = await apiClient.get(`/interviews/${id}/feedback`);
      setFeedback(res.data.feedback);
      setInterviewMeta(res.data.interview);
      setQaPairs(res.data.questionsAnswers || []);
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!feedback) return;
    const sessionObj: any = {
      id: Number(id),
      role: interviewMeta?.role || 'Software Engineer',
      difficulty: feedback.difficultyLevel || interviewMeta?.difficulty || 'Medium',
      duration_minutes: interviewMeta?.duration_minutes || 20,
      created_at: interviewMeta?.created_at || new Date().toISOString(),
      overall_score: feedback.overallScore,
      technical_score: feedback.technicalScore,
      communication_score: feedback.communicationScore,
      problem_solving_score: feedback.problemSolvingScore,
      confidence_score: feedback.confidenceScore,
      grammar_score: feedback.grammarScore,
      vocabulary_score: feedback.vocabularyScore,
      leadership_score: feedback.leadershipScore || 80,
      behavior_score: feedback.behaviorScore || 82,
      estimated_performance: feedback.estimatedPerformance,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      suggestedAnswers: feedback.suggestedAnswers,
      tips: feedback.tips,
      transcript: qaPairs.map((q: any) => ({
        question_id: q.question_index,
        question_index: q.question_index,
        question_text: q.question_text,
        category: q.category || 'Technical',
        answer_text: q.answer_text,
        time_spent_seconds: q.time_spent_seconds || 0
      }))
    };
    exportInterviewPDF(sessionObj);
  };

  const getTierColor = (tier: string) => {
    if (tier === 'Strong Hire') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (tier === 'Hire') return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  };

  const radarData = feedback ? [
    { subject: 'Technical', score: feedback.technicalScore || 0, fullMark: 100 },
    { subject: 'Communication', score: feedback.communicationScore || 0, fullMark: 100 },
    { subject: 'Problem Solving', score: feedback.problemSolvingScore || 0, fullMark: 100 },
    { subject: 'Confidence', score: feedback.confidenceScore || 0, fullMark: 100 },
    { subject: 'Grammar', score: feedback.grammarScore || 0, fullMark: 100 },
    { subject: 'Vocabulary', score: feedback.vocabularyScore || 0, fullMark: 100 },
    { subject: 'Leadership', score: feedback.leadershipScore || 80, fullMark: 100 },
    { subject: 'Behavior', score: feedback.behaviorScore || 82, fullMark: 100 },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 w-full flex-1">
        <Sidebar />

        <main className="flex-1 space-y-8 max-w-4xl">
          {isLoading ? (
            <div className="space-y-6">
              <SkeletonLoader count={1} height="h-44" />
              <SkeletonLoader count={4} height="h-28" />
            </div>
          ) : feedback ? (
            <>
              {/* Header Hero Score Card */}
              <GlassCard className="p-8 bg-gradient-to-r from-brand-950/90 via-indigo-950/80 to-slate-900/90 border-brand-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> EVALUATION COMPLETED
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getTierColor(feedback.estimatedPerformance)}`}>
                      <UserCheck className="w-3.5 h-3.5" /> {feedback.estimatedPerformance || 'Hire'}
                    </span>
                    <button
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PDF Report
                    </button>
                  </div>

                  <h1 className="text-3xl font-extrabold text-white">AI Interview Feedback Report</h1>
                  <p className="text-xs text-slate-300">
                    Role: <span className="text-brand-400 font-semibold">{interviewMeta?.role || 'Developer'}</span> • Level: <span className="text-slate-200">{feedback.difficultyLevel || interviewMeta?.difficulty || 'Medium'}</span> • Evaluated via Gemini AI
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-900/80 p-5 rounded-2xl border border-white/10 shrink-0 shadow-xl">
                  <div className="text-center">
                    <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                      {feedback.overallScore}%
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Overall Score</div>
                  </div>
                </div>
              </GlassCard>

              {/* 8-Dimension Competency Score Grid */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  8-Dimension Competency Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Technical Depth', score: feedback.technicalScore, color: 'text-brand-400', desc: 'Core engineering logic' },
                    { label: 'Communication', score: feedback.communicationScore, color: 'text-cyan-400', desc: 'Clarity & articulation' },
                    { label: 'Problem Solving', score: feedback.problemSolvingScore, color: 'text-rose-400', desc: 'Analytical reasoning' },
                    { label: 'Confidence', score: feedback.confidenceScore, color: 'text-amber-400', desc: 'Poise & conviction' },
                    { label: 'Grammar', score: feedback.grammarScore, color: 'text-purple-400', desc: 'Sentence structure' },
                    { label: 'Vocabulary', score: feedback.vocabularyScore, color: 'text-sky-400', desc: 'Domain terminology' },
                    { label: 'Leadership', score: feedback.leadershipScore || 80, color: 'text-emerald-400', desc: 'Ownership & initiative' },
                    { label: 'Behavior & Fit', score: feedback.behaviorScore || 82, color: 'text-teal-400', desc: 'Culture & emotional IQ' },
                  ].map((item, idx) => (
                    <GlassCard key={idx} className="p-4 text-center space-y-1">
                      <div className={`text-2xl font-black ${item.color}`}>{item.score}%</div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </GlassCard>
                  ))}
                </div>
              </div>

              {/* 8-Point Radar Chart Visual */}
              <GlassCard className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-brand-400" /> 8-Dimension Competency Radar
                </h3>
                <div className="w-full h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Radar name="Candidate Score" dataKey="score" stroke="#536df8" fill="#536df8" fillOpacity={0.45} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Strengths & Weaknesses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <GlassCard className="p-6 space-y-4 border-emerald-500/20">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Key Candidate Strengths
                  </h3>
                  <ul className="space-y-2.5">
                    {feedback.strengths.map((str, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{str}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>

                {/* Weaknesses / Improvement Areas */}
                <GlassCard className="p-6 space-y-4 border-amber-500/20">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Areas for Improvement
                  </h3>
                  <ul className="space-y-2.5">
                    {feedback.weaknesses.map((weak, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{weak}</span>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              </div>

              {/* Actionable Tips */}
              {feedback.tips && feedback.tips.length > 0 && (
                <GlassCard className="p-6 space-y-4 border-indigo-500/20">
                  <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" /> Actionable Preparation Tips
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {feedback.tips.map((tip, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                        <span className="text-indigo-400 font-bold">{idx + 1}.</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* Question By Question Review with Detailed AI Analysis & Model Answers */}
              <GlassCard className="p-6 space-y-6">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-400" /> Question-by-Question Deep AI Evaluation & Model Answers
                </h3>

                <div className="space-y-6">
                  {feedback.suggestedAnswers && feedback.suggestedAnswers.length > 0 ? (
                    feedback.suggestedAnswers.map((item, idx) => {
                      const matchedQA = qaPairs.find(
                        (q) => q.question_index === item.questionIndex || q.question_text === item.question
                      );
                      const qScore = matchedQA?.correctness_score ? matchedQA.correctness_score : Math.round(feedback.overallScore);
                      return (
                        <div key={idx} className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-xs font-bold shrink-0">
                                Q{idx + 1}
                              </span>
                              <h4 className="text-sm font-bold text-white leading-snug">
                                {item.question}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              {matchedQA?.category && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-slate-300 text-[10px] font-semibold">
                                  {matchedQA.category}
                                </span>
                              )}
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                qScore >= 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                qScore >= 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}>
                                Score: {qScore}%
                              </span>
                            </div>
                          </div>

                          {/* Candidate Answer */}
                          {matchedQA && (
                            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-white/5 space-y-1.5">
                              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                                <span>Your Actual Answer:</span>
                                {matchedQA.time_spent_seconds > 0 && <span>{matchedQA.time_spent_seconds}s response time</span>}
                              </div>
                              <p className="text-xs text-slate-300 italic leading-relaxed">
                                "{matchedQA.answer_text || '(No answer provided)'}"
                              </p>
                            </div>
                          )}

                          {/* AI Understanding & Feedback */}
                          {matchedQA?.ai_understanding && (
                            <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-1 text-xs text-indigo-200">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">AI Understanding:</div>
                              <p>{matchedQA.ai_understanding}</p>
                            </div>
                          )}

                          {/* Strengths & Weaknesses if recorded */}
                          {(matchedQA?.strengths_text || matchedQA?.weaknesses_text) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              {matchedQA?.strengths_text && (
                                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 space-y-1">
                                  <div className="text-[10px] font-bold uppercase text-emerald-400">Strengths in Answer:</div>
                                  <p>{matchedQA.strengths_text}</p>
                                </div>
                              )}
                              {matchedQA?.weaknesses_text && (
                                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-300 space-y-1">
                                  <div className="text-[10px] font-bold uppercase text-amber-400">Areas to Improve:</div>
                                  <p>{matchedQA.weaknesses_text}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Suggested Model Answer */}
                          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> Suggested Ideal Answer:
                            </div>
                            <p className="text-xs text-emerald-200 leading-relaxed">
                              {item.suggestedAnswer}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No question reviews recorded for this session.
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Navigation Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                <Link to="/dashboard">
                  <Button variant="secondary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
                    Back to Dashboard
                  </Button>
                </Link>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleDownloadPDF}
                    icon={<Download className="w-4 h-4 text-indigo-400" />}
                  >
                    Download PDF Report
                  </Button>
                  <Link to="/interview/setup">
                    <Button variant="primary" size="md" icon={<RotateCcw className="w-4 h-4" />}>
                      Start New Interview
                    </Button>
                  </Link>
                </div>
              </div>

            </>
          ) : (
            <GlassCard className="p-8 text-center text-slate-400 space-y-4">
              <p>Feedback report not available for this session.</p>
              <Link to="/dashboard">
                <Button size="sm">Return to Dashboard</Button>
              </Link>
            </GlassCard>
          )}
        </main>
      </div>
    </div>
  );
};
