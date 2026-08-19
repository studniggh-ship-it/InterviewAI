import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Code2, 
  FolderPlus, 
  Lightbulb, 
  Loader2,
  Check,
  X,
  AlertTriangle,
  Layers,
  GraduationCap,
  Briefcase,
  Trophy,
  BarChart3,
  AlignLeft,
  Download
} from 'lucide-react';
import { apiClient } from '../api/client';
import { ResumeAnalysis } from '../types';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { exportResumeAnalysisPDF } from '../utils/pdfExport';

export const ResumeAnalyzerPage: React.FC = () => {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestAnalysis();
  }, []);

  const fetchLatestAnalysis = async () => {
    try {
      const res = await apiClient.get('/resume/latest');
      if (res.data.analysis) {
        setAnalysis(res.data.analysis);
      }
    } catch (err) {
      console.error('Failed to load initial resume analysis:', err);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf') {
        setErrorMessage('Please select a valid PDF file (.pdf).');
        return;
      }
      setFile(selected);
      setErrorMessage(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await apiClient.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysis(res.data);
      setFile(null);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to analyze resume PDF.');
    } finally {
      setIsUploading(false);
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
              <FileText className="w-6 h-6 text-purple-400" /> ATS Resume Scanner & Deep Auditor
            </h1>
            <p className="text-xs text-slate-400">
              Upload your PDF resume for instant ATS scoring, keyword density extraction, grammar/formatting checks, and section-by-section breakdown.
            </p>
          </div>

          {/* Upload Card */}
          <GlassCard className="p-8 border-dashed border-white/20 text-center space-y-4">
            <input
              type="file"
              accept=".pdf"
              id="resume-file-input"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="resume-file-input" className="cursor-pointer block space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <div className="text-base font-bold text-white">
                  {file ? file.name : 'Click to select or drag & drop PDF Resume'}
                </div>
                <div className="text-xs text-slate-400 mt-1">Maximum file size: 10MB (PDF format only)</div>
              </div>
            </label>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
                <AlertCircle className="w-4 h-4" /> <span>{errorMessage}</span>
              </div>
            )}

            {file && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleUploadAndAnalyze}
                  isLoading={isUploading}
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  Analyze Resume with AI ATS
                </Button>
              </div>
            )}
          </GlassCard>

          {/* Results Section */}
          {isLoadingInitial ? (
            <SkeletonLoader count={3} height="h-32" />
          ) : analysis ? (
            <div className="space-y-6">
              {/* Score & Summary Card */}
              <GlassCard className="p-8 bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900/90 border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="text-xs font-semibold text-purple-300">File: {analysis.originalFilename}</span>
                    <button
                      onClick={() => exportResumeAnalysisPDF(analysis)}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download ATS Report (PDF)
                    </button>
                  </div>
                  <h2 className="text-2xl font-bold text-white">ATS Optimization Score</h2>
                  <p className="text-xs text-slate-300 max-w-lg leading-relaxed">{analysis.summary}</p>
                </div>

                <div className="w-28 h-28 rounded-full border-4 border-purple-500/40 bg-slate-900/80 flex flex-col items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                  <div className="text-3xl font-black text-purple-400">{analysis.atsScore}%</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">ATS Score</div>
                </div>
              </GlassCard>

              {/* Matched vs Missing Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Matched Skills */}
                <GlassCard className="p-6 space-y-4 border-emerald-500/20">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Detected Industry Skills ({analysis.matchedSkills?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.matchedSkills && analysis.matchedSkills.length > 0 ? (
                      analysis.matchedSkills.map((sk, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">No primary technical skills extracted.</span>
                    )}
                  </div>
                </GlassCard>

                {/* Missing Skills */}
                <GlassCard className="p-6 space-y-4 border-rose-500/20">
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4" /> Missing Keywords to Target ({analysis.missingSkills?.length || 0})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingSkills && analysis.missingSkills.length > 0 ? (
                      analysis.missingSkills.map((sk, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1">
                          <X className="w-3 h-3" /> {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">All standard benchmark keywords covered!</span>
                    )}
                  </div>
                </GlassCard>
              </div>

              {/* Keyword Density Table / Grid */}
              {analysis.keywordDensity && analysis.keywordDensity.length > 0 && (
                <GlassCard className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                    <BarChart3 className="w-4 h-4 text-brand-400" /> Resume Keyword Frequency & Density
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {analysis.keywordDensity.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">{item.keyword}</div>
                          <div className="text-[10px] text-slate-400">{item.category}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-xs font-bold">
                          {item.count}x
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              {/* 4-Section Resume Audit (Experience, Education, Projects, Achievements) */}
              <GlassCard className="p-6 space-y-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-brand-400" /> Section-by-Section Structural Audit
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Experience */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                      <Briefcase className="w-4 h-4" /> Work Experience Section
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {analysis.experienceAnalysis && analysis.experienceAnalysis.length > 0 ? (
                        analysis.experienceAnalysis.map((exp, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>{exp}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500">No experience feedback generated.</li>
                      )}
                    </ul>
                  </div>

                  {/* Education */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                      <GraduationCap className="w-4 h-4" /> Education & Credentials
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {analysis.educationAnalysis && analysis.educationAnalysis.length > 0 ? (
                        analysis.educationAnalysis.map((edu, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-purple-400 font-bold">•</span>
                            <span>{edu}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500">No education feedback generated.</li>
                      )}
                    </ul>
                  </div>

                  {/* Projects */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                      <FolderPlus className="w-4 h-4" /> Project Architecture
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {analysis.projectsAnalysis && analysis.projectsAnalysis.length > 0 ? (
                        analysis.projectsAnalysis.map((prj, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{prj}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500">No project feedback generated.</li>
                      )}
                    </ul>
                  </div>

                  {/* Achievements */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <Trophy className="w-4 h-4" /> Measurable Impact & Metrics
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {analysis.achievementsAnalysis && analysis.achievementsAnalysis.length > 0 ? (
                        analysis.achievementsAnalysis.map((ach, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{ach}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-slate-500">No impact feedback generated.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </GlassCard>

              {/* Grammar & Formatting Issues */}
              {((analysis.grammarIssues && analysis.grammarIssues.length > 0) || (analysis.formattingIssues && analysis.formattingIssues.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Grammar Issues */}
                  <GlassCard className="p-6 space-y-4 border-amber-500/20">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Grammar & Phrasing Refinements
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {analysis.grammarIssues?.map((g, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>

                  {/* Formatting Issues */}
                  <GlassCard className="p-6 space-y-4 border-sky-500/20">
                    <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                      <AlignLeft className="w-4 h-4" /> ATS Formatting Checks
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {analysis.formattingIssues?.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                </div>
              )}

              {/* Recommended Projects */}
              <GlassCard className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-brand-400 uppercase tracking-wider flex items-center gap-2">
                  <FolderPlus className="w-4 h-4" /> Tailored Portfolio Project Suggestions
                </h3>
                <div className="space-y-3">
                  {analysis.projectSuggestions && analysis.projectSuggestions.length > 0 ? (
                    analysis.projectSuggestions.map((proj, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-200 flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 font-bold flex items-center justify-center shrink-0 text-xs">
                          {idx + 1}
                        </span>
                        <span className="mt-0.5 leading-relaxed">{proj}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400">No project suggestions.</div>
                  )}
                </div>
              </GlassCard>

              {/* Actionable Formatting & Content Tips */}
              <GlassCard className="p-6 space-y-4 border-amber-500/20">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Expert Resume Recommendations
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {analysis.tips && analysis.tips.map((tp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{tp}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </div>
          ) : (
            <GlassCard className="p-8 text-center text-slate-400 border border-dashed border-white/10 rounded-2xl">
              <p className="text-xs">No resume uploaded yet. Select a PDF file above to get your first comprehensive ATS score report.</p>
            </GlassCard>
          )}
        </main>
      </div>
    </div>
  );
};

