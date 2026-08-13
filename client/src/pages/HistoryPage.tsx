import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Search, 
  Trash2, 
  Eye, 
  Calendar, 
  Clock, 
  Award, 
  AlertTriangle,
  Play,
  Filter,
  ArrowUpDown,
  FileText,
  UserCheck,
  CheckCircle2,
  Download,
  MessageSquare,
  Sparkles,
  X,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiClient } from '../api/client';
import { InterviewSession } from '../types';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { exportInterviewPDF } from '../utils/pdfExport';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<InterviewSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'score_desc' | 'score_asc' | 'duration_desc'>('date_desc');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [selectedTranscriptSession, setSelectedTranscriptSession] = useState<InterviewSession | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get('/history');
      setHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/history/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      setDeleteTargetId(null);
    } catch (err) {
      alert('Failed to delete interview record.');
    }
  };

  const filteredHistory = history
    .filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesRole = item.role.toLowerCase().includes(query);
      const matchesDiff = item.difficulty.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
      const matchesTranscript = item.transcript?.some(
        (t) => t.question_text.toLowerCase().includes(query) || t.answer_text.toLowerCase().includes(query)
      );

      return (matchesRole || matchesDiff || matchesTranscript) && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'score_desc') return (b.overall_score || 0) - (a.overall_score || 0);
      if (sortBy === 'score_asc') return (a.overall_score || 0) - (b.overall_score || 0);
      if (sortBy === 'duration_desc') return (b.duration_minutes || 0) - (a.duration_minutes || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8 w-full flex-1">
        <Sidebar />

        <main className="flex-1 space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                <HistoryIcon className="w-6 h-6 text-amber-400" /> Interview History & Transcripts
              </h1>
              <p className="text-xs text-slate-400">
                Search, sort, view full QA transcripts, feedback reports, and export PDF documents.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search role, level, or answer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl glass-input text-xs font-medium cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed Only</option>
                <option value="in_progress">In Progress Only</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl glass-input text-xs font-medium cursor-pointer"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="score_desc">Highest Score</option>
                <option value="score_asc">Lowest Score</option>
                <option value="duration_desc">Longest Duration</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <SkeletonLoader count={4} height="h-28" />
          ) : filteredHistory.length > 0 ? (
            <div className="space-y-3">
              {filteredHistory.map((session) => (
                <GlassCard 
                  key={session.id} 
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-500/30 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-base text-white">{session.role}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-brand-300 border border-brand-500/20">
                        {session.difficulty}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        session.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {session.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                      {session.estimated_performance && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {session.estimated_performance}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(session.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {session.duration_minutes} Mins
                      </span>
                      {session.answered_questions !== undefined && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                          {session.answered_questions} / {session.total_questions || 0} Questions
                        </span>
                      )}
                      {session.resume_filename && (
                        <span className="flex items-center gap-1 text-purple-300">
                          <FileText className="w-3.5 h-3.5 text-purple-400" />
                          {session.resume_filename}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5 justify-between sm:justify-end shrink-0">
                    {session.overall_score !== undefined && session.status === 'completed' ? (
                      <div className="text-right mr-2">
                        <div className="text-xl font-black text-emerald-400">{session.overall_score}%</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Overall Score</div>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2">
                      {/* Transcript button */}
                      {session.transcript && session.transcript.length > 0 && (
                        <button
                          onClick={() => setSelectedTranscriptSession(session)}
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                          title="View QA Transcript"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="hidden md:inline">Transcript</span>
                        </button>
                      )}

                      {/* Download PDF button */}
                      {session.status === 'completed' && (
                        <button
                          onClick={() => exportInterviewPDF(session)}
                          className="p-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                          title="Download PDF Report"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="hidden md:inline">PDF</span>
                        </button>
                      )}

                      {session.status === 'completed' ? (
                        <Link to={`/interview/feedback/${session.id}`}>
                          <Button size="sm" variant="outline" icon={<Eye className="w-3.5 h-3.5" />}>
                            Report
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/interview/session/${session.id}`}>
                          <Button size="sm" variant="primary" icon={<Play className="w-3.5 h-3.5 fill-white" />}>
                            Resume
                          </Button>
                        </Link>
                      )}

                      <button
                        onClick={() => setDeleteTargetId(session.id)}
                        className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-500/10 hover:text-red-400 border border-slate-700 text-slate-400 transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="p-10 text-center text-slate-400 space-y-4 border border-dashed border-white/10 rounded-2xl">
              <p className="text-sm text-slate-300 font-medium">No interview sessions found matching your filters.</p>
              <p className="text-xs text-slate-500">Practice your first mock interview to build your performance history.</p>
              <Link to="/interview/setup" className="inline-block pt-2">
                <Button size="sm" variant="primary">Start New Interview</Button>
              </Link>
            </GlassCard>
          )}
        </main>
      </div>

      {/* Transcript Modal */}
      {selectedTranscriptSession && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/70 flex items-center justify-center p-4">
          <GlassCard className="max-w-2xl w-full max-h-[85vh] flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Interview Transcript</h3>
                  <div className="text-xs text-slate-400">
                    {selectedTranscriptSession.role} • {selectedTranscriptSession.difficulty} • {new Date(selectedTranscriptSession.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportInterviewPDF(selectedTranscriptSession)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  onClick={() => setSelectedTranscriptSession(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {selectedTranscriptSession.transcript && selectedTranscriptSession.transcript.length > 0 ? (
                selectedTranscriptSession.transcript.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[11px] font-bold shrink-0">
                        Q{idx + 1}
                      </span>
                      <div className="text-xs font-bold text-white leading-relaxed">
                        {item.question_text}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-800/70 border border-white/5 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Candidate Answer:
                      </div>
                      <p className="text-xs text-slate-200 italic leading-relaxed">
                        {item.answer_text}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No transcripts recorded for this session.
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <Button size="sm" variant="secondary" onClick={() => setSelectedTranscriptSession(null)}>
                Close Transcript
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/60 flex items-center justify-center p-4">
          <GlassCard className="max-w-sm w-full p-6 space-y-4 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Delete Interview Record?</h3>
            <p className="text-xs text-slate-300">
              This action will permanently erase the session, questions, answers, and feedback report from your database.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => setDeleteTargetId(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(deleteTargetId)}>
                Yes, Delete
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};
