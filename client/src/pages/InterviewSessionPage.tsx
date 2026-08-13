import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Mic, 
  MicOff, 
  SkipForward, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Home,
  Check,
  Radio,
  Edit3,
  Sliders,
  X,
  Play,
  Volume1,
  User,
  Zap,
  Activity,
  Send,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Question } from '../types';
import { useVoiceSpeech, MicState, VoiceGender } from '../hooks/useVoiceSpeech';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';

export const InterviewSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(
    location.state?.initialQuestion || null
  );
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [answerText, setAnswerText] = useState<string>('');
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(20 * 60);
  const [totalQuestions, setTotalQuestions] = useState<number>(7);
  const [role, setRole] = useState<string>('Software Engineer');
  const [difficulty, setDifficulty] = useState<string>('Medium');
  const [isLoadingNext, setIsLoadingNext] = useState<boolean>(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState<boolean>(false);
  const [showVoiceSettingsModal, setShowVoiceSettingsModal] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isHandsFreeMode, setIsHandsFreeMode] = useState<boolean>(true);
  const [showTranscriptEditor, setShowTranscriptEditor] = useState<boolean>(false);

  // Conversational Welcome Stage (Stage 0: Welcome greeting & readiness check)
  const [isWelcomeStage, setIsWelcomeStage] = useState<boolean>(true);
  const hasGreetedRef = useRef<boolean>(false);
  const isWelcomeStageRef = useRef<boolean>(true);

  // Synchronize ref
  useEffect(() => {
    isWelcomeStageRef.current = isWelcomeStage;
  }, [isWelcomeStage]);

  // Forward declaration of auto-submit handler
  const handleAutoSubmitRef = useRef<(text: string) => void>(() => {});
  const handleReadinessConfirmedRef = useRef<() => void>(() => {});

  // Callback to append finalized voice transcript
  const handleFinalVoiceChunk = useCallback((finalChunk: string, fullTranscript: string) => {
    if (!fullTranscript || !fullTranscript.trim()) return;

    // Check if in welcome stage and user speaks readiness confirmation
    if (isWelcomeStageRef.current) {
      const lower = fullTranscript.toLowerCase();
      const readyKeywords = ['yes', 'ready', "i'm ready", 'im ready', "let's begin", 'lets begin', 'sure', 'start', 'yup', 'ok', 'okay', 'begin', 'fine', 'yeah'];
      if (readyKeywords.some(kw => lower.includes(kw))) {
        handleReadinessConfirmedRef.current();
        return;
      }
    }

    setAnswerText(fullTranscript.trim());
  }, []);

  const { 
    isSupported, 
    micState, 
    setMicState,
    isListening, 
    isUserSpeaking,
    isProcessing, 
    isThinking,
    isSpeaking, 
    interimTranscript, 
    finalTranscript,
    setFinalTranscript,
    availableVoices,
    maleVoices,
    femaleVoices,
    voiceSettings,
    updateVoiceSettings,
    startListening, 
    stopListening, 
    speakText, 
    stopSpeaking,
    testVoice,
    resetTranscript
  } = useVoiceSpeech({
    silenceTimeoutMs: 2500,
    onFinalResult: handleFinalVoiceChunk,
    onSilenceAutoSubmit: (transcript) => {
      if (isWelcomeStageRef.current) {
        const lower = transcript.toLowerCase();
        const readyKeywords = ['yes', 'ready', "i'm ready", 'im ready', "let's begin", 'lets begin', 'sure', 'start', 'yup', 'ok', 'okay', 'begin', 'fine', 'yeah'];
        if (readyKeywords.some(kw => lower.includes(kw))) {
          handleReadinessConfirmedRef.current();
          return;
        }
      } else if (isHandsFreeMode && transcript.trim().length > 5) {
        handleAutoSubmitRef.current(transcript.trim());
      }
    }
  });

  // Load session metadata on mount
  useEffect(() => {
    fetchSessionDetails();
  }, [id]);

  const fetchSessionDetails = async () => {
    try {
      const res = await apiClient.get(`/interviews/${id}`);
      if (res.data.isCompleted) {
        navigate(`/interview/feedback/${id}`);
        return;
      }
      setRole(res.data.interview.role);
      setDifficulty(res.data.interview.difficulty);
      setTotalQuestions(res.data.totalQuestions || 7);
      
      const durationMins = res.data.interview.duration_minutes || 20;
      setSecondsRemaining(durationMins * 60);

      // If user has already answered questions, skip welcome stage
      if (res.data.currentIndex && res.data.currentIndex > 0) {
        setIsWelcomeStage(false);
        fetchQuestionAtIndex(res.data.currentIndex);
      } else if (!currentQuestion) {
        fetchQuestionAtIndex(0);
      }
    } catch (err) {
      console.error('Failed to load session details:', err);
      if (!currentQuestion) {
        fetchQuestionAtIndex(0);
      }
    }
  };

  // Candidate real profile name (or graceful fallback, never 'User')
  const candidateName = user?.name && user.name.trim() && user.name.toLowerCase() !== 'user'
    ? user.name.trim()
    : '';

  // Conversational Welcome Greeting spoken aloud on entrance
  useEffect(() => {
    if (isWelcomeStage && !hasGreetedRef.current && voiceSettings.autoPlay) {
      hasGreetedRef.current = true;
      const greetingHeader = candidateName ? `Hello ${candidateName}!` : 'Hello!';
      const spokenGreeting = `${greetingHeader} Welcome to InterviewAI. I'm your AI interviewer today. I'll be conducting your interview for the ${role} position and evaluating your communication skills, technical knowledge, confidence, and problem-solving abilities. This interview contains ${totalQuestions} questions. Please answer naturally. Take your time. Are you ready to begin?`;

      speakText(spokenGreeting, () => {
        if (isHandsFreeMode) {
          startListening();
        }
      });
    }
  }, [isWelcomeStage, candidateName, role, totalQuestions, speakText, voiceSettings.autoPlay, isHandsFreeMode, startListening]);

  // Transition from Welcome stage to Question 1
  const handleConfirmReadiness = useCallback(() => {
    setIsWelcomeStage(false);
    stopSpeaking();
    resetTranscript();
    setAnswerText('');

    const introText = `Excellent! Let's begin with your first question: ${currentQuestion?.question_text || ''}`;
    speakText(introText, () => {
      if (isHandsFreeMode) {
        startListening();
      }
    });
  }, [currentQuestion, speakText, isHandsFreeMode, startListening, stopSpeaking, resetTranscript]);

  handleReadinessConfirmedRef.current = handleConfirmReadiness;

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishInterview();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Debounced auto-save answer to SQLite
  useEffect(() => {
    if (isWelcomeStage || !currentQuestion || !answerText.trim()) return;

    setSaveStatus('saving');
    const handler = setTimeout(async () => {
      try {
        await apiClient.post(`/interviews/${id}/next`, {
          question_id: currentQuestion.id,
          question_index: questionIndex,
          answer_text: answerText,
          time_spent_seconds: timeSpent,
        });
        setSaveStatus('saved');
      } catch (err) {
        setSaveStatus('idle');
      }
    }, 1500);

    return () => clearTimeout(handler);
  }, [answerText, currentQuestion, questionIndex, id, timeSpent, isWelcomeStage]);

  const fetchQuestionAtIndex = async (idx: number) => {
    setIsLoadingNext(true);
    resetTranscript();
    try {
      const res = await apiClient.get(`/interviews/${id}/question/${idx}`);
      setCurrentQuestion(res.data.question);
      setAnswerText(res.data.answer || '');
      setFinalTranscript(res.data.answer || '');
      setQuestionIndex(idx);
      setTimeSpent(0);

      // Auto-read question aloud if not in welcome stage
      if (!isWelcomeStage && voiceSettings.autoPlay && res.data.question?.question_text) {
        speakText(res.data.question.question_text, () => {
          if (isHandsFreeMode) {
            startListening();
          }
        });
      }
    } catch (err: any) {
      console.error('Fetch question error:', err);
    } finally {
      setIsLoadingNext(false);
    }
  };

  const handleNextOrSubmit = async (isSkip = false, explicitAnswer?: string) => {
    if (!currentQuestion) return;
    setIsLoadingNext(true);
    setMicState('AI Thinking');
    stopSpeaking();
    if (isListening) stopListening();

    const textToSubmit = explicitAnswer !== undefined ? explicitAnswer : answerText;

    try {
      const res = await apiClient.post(`/interviews/${id}/next`, {
        question_id: currentQuestion.id,
        question_index: questionIndex,
        answer_text: isSkip ? '(Skipped)' : (textToSubmit || '(No answer provided)'),
        time_spent_seconds: timeSpent,
        is_skip: isSkip,
      });

      if (res.data.isFinished) {
        // Spoken concluding debrief
        const namePart = candidateName ? `, ${candidateName}` : '';
        const closingSpeech = `Congratulations${namePart}! You have successfully completed today's interview. I'm now preparing your detailed evaluation report. Thank you for your time, and I wish you the very best in your future interviews.`;

        speakText(closingSpeech, () => {
          handleFinishInterview();
        });
      } else {
        const nextQ = res.data.nextQuestion;
        setCurrentQuestion(nextQ);
        const prevAns = res.data.previousAnswer || '';
        setAnswerText(prevAns);
        setFinalTranscript(prevAns);
        resetTranscript();
        setQuestionIndex(questionIndex + 1);
        setTimeSpent(0);
        setSaveStatus('idle');

        // Continuous conversational flow: AI speaks next follow-up aloud, then activates microphone automatically
        if (voiceSettings.autoPlay && nextQ?.question_text) {
          speakText(nextQ.question_text, () => {
            if (isHandsFreeMode) {
              startListening();
            }
          });
        }
      }
    } catch (err: any) {
      console.error('Next question error:', err);
      setMicState('Ready');
    } finally {
      setIsLoadingNext(false);
    }
  };

  // Assign auto-submit ref to current implementation
  handleAutoSubmitRef.current = (transcript: string) => {
    handleNextOrSubmit(false, transcript);
  };

  const handlePrevious = () => {
    if (questionIndex > 0) {
      stopSpeaking();
      if (isListening) stopListening();
      fetchQuestionAtIndex(questionIndex - 1);
    }
  };

  const handleFinishInterview = async () => {
    setIsEvaluating(true);
    stopSpeaking();
    if (isListening) stopListening();

    try {
      if (currentQuestion && answerText && !isWelcomeStage) {
        await apiClient.post(`/interviews/${id}/next`, {
          question_id: currentQuestion.id,
          question_index: questionIndex,
          answer_text: answerText,
          time_spent_seconds: timeSpent,
        });
      }

      const res = await apiClient.post(`/interviews/${id}/finish`);
      navigate(`/interview/feedback/${id}`, { state: { feedback: res.data.feedback } });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to evaluate interview.');
      setIsEvaluating(false);
    }
  };

  const handleSaveAndExit = async () => {
    stopSpeaking();
    if (isListening) stopListening();
    if (currentQuestion && answerText && !isWelcomeStage) {
      try {
        await apiClient.post(`/interviews/${id}/next`, {
          question_id: currentQuestion.id,
          question_index: questionIndex,
          answer_text: answerText,
          time_spent_seconds: timeSpent,
        });
      } catch (e) {}
    }
    navigate('/dashboard');
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = isWelcomeStage 
    ? 0 
    : Math.min(100, Math.round(((questionIndex + 1) / totalQuestions) * 100));

  // Render microphone and conversation status badge
  const renderMicStatusBadge = () => {
    switch (micState) {
      case 'AI Speaking':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold animate-pulse">
            <div className="flex gap-0.5 items-center">
              <span className="wave-bar bg-purple-400" />
              <span className="wave-bar bg-purple-400" />
              <span className="wave-bar bg-purple-400" />
            </div>
            <span>AI Speaking (Speak anytime to interrupt)</span>
          </div>
        );
      case 'AI Thinking':
      case 'Processing':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-semibold">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>AI Thinking & Evaluating...</span>
          </div>
        );
      case 'User Speaking':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-pulse">
            <div className="flex gap-0.5 items-center">
              <span className="wave-bar bg-emerald-400" />
              <span className="wave-bar bg-emerald-400" />
              <span className="wave-bar bg-emerald-400" />
            </div>
            <span>{isWelcomeStage ? 'Say "I am ready" / "Yes"' : 'User Speaking (Auto-submits on silence)'}</span>
          </div>
        );
      case 'Listening':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <span>{isWelcomeStage ? 'Listening... Say "Yes" or "I am ready"' : 'Listening... Speak your answer'}</span>
          </div>
        );
      case 'Ready':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5" />
            <span>Microphone Ready</span>
          </div>
        );
      case 'Permission Denied':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Microphone Permission Denied</span>
          </div>
        );
      case 'No Speech Detected':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
            <MicOff className="w-3.5 h-3.5" />
            <span>No Speech Detected</span>
          </div>
        );
      case 'Network Error':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Speech Recognition Network Error</span>
          </div>
        );
      case 'Finished':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Interview Finished</span>
          </div>
        );
      case 'Stopped':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
            <MicOff className="w-3.5 h-3.5" />
            <span>Microphone Paused</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" onClick={handleSaveAndExit} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <Home className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">Exit & Save</span>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <span className="text-sm font-bold text-white">{role}</span>
              <span className="text-xs text-slate-400 ml-2 hidden sm:inline">({difficulty})</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/5 text-slate-300 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            {/* Voice Settings Trigger */}
            <button
              onClick={() => setShowVoiceSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 text-xs font-medium transition-all"
              title="Configure AI Voice"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline capitalize">{voiceSettings.gender} Voice</span>
            </button>

            {/* Hands-Free Voice Mode Toggle */}
            <button
              onClick={() => {
                const nextMode = !isHandsFreeMode;
                setIsHandsFreeMode(nextMode);
                if (!nextMode) {
                  stopListening();
                } else if (!isSpeaking) {
                  startListening();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isHandsFreeMode
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Continuous conversational hands-free mode"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Voice Mode: {isHandsFreeMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-800 h-1">
          <div 
            className="bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-400 h-1 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      {/* Main Conversation Arena */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col justify-center space-y-6">
        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isWelcomeStage ? (
              <span className="text-xs font-bold text-brand-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Welcome & Readiness Check
              </span>
            ) : (
              <>
                <span className="text-xs font-bold text-slate-300">
                  Question {questionIndex + 1} of {totalQuestions}
                </span>
                {currentQuestion?.category && (
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[11px] font-semibold">
                    {currentQuestion.category}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {renderMicStatusBadge()}
            {saveStatus === 'saving' && <span className="text-[10px] text-slate-400 animate-pulse">Auto-saving...</span>}
            {saveStatus === 'saved' && <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
          </div>
        </div>

        {/* STAGE 0: Welcome Greeting Card */}
        {isWelcomeStage ? (
          <GlassCard className="p-8 space-y-6 relative overflow-hidden border border-brand-500/30 shadow-2xl bg-gradient-to-b from-brand-950/20 to-slate-900/60">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-600/30 border border-brand-400/40 text-brand-400 flex items-center justify-center font-bold text-base shrink-0">
                  AI
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {candidateName ? `Hello ${candidateName}! 👋` : 'Hello! 👋'}
                  </h3>
                  <p className="text-xs text-brand-300">
                    AI Lead Interviewer &bull; {role} ({difficulty})
                  </p>
                </div>
              </div>

              {/* Repeat Welcome Audio */}
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    const greetingHeader = candidateName ? `Hello ${candidateName}!` : 'Hello!';
                    const spokenGreeting = `${greetingHeader} Welcome to InterviewAI. I'm your AI interviewer today. I'll be conducting your interview for the ${role} position and evaluating your communication skills, technical knowledge, confidence, and problem-solving abilities. This interview contains ${totalQuestions} questions. Please answer naturally. Take your time. Are you ready to begin?`;
                    speakText(spokenGreeting, () => {
                      if (isHandsFreeMode) startListening();
                    });
                  }
                }}
                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isSpeaking
                    ? 'bg-purple-500/30 border-purple-500 text-purple-300 animate-pulse'
                    : 'bg-slate-800/80 border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 text-purple-300" /> : <Volume2 className="w-4 h-4 text-brand-400" />}
                <span className="hidden sm:inline">{isSpeaking ? 'Stop Voice' : 'Repeat Greeting'}</span>
              </button>
            </div>

            {/* Formatted Welcome Greeting */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 text-sm sm:text-base text-slate-200 leading-relaxed space-y-3 font-normal">
              <p className="font-semibold text-white">
                Welcome to <span className="text-brand-400 font-bold">InterviewAI</span>.
              </p>
              <p>
                I'm your AI interviewer today. I'll be conducting your interview and evaluating your <span className="text-cyan-300 font-semibold">communication skills</span>, <span className="text-indigo-300 font-semibold">technical knowledge</span>, <span className="text-amber-300 font-semibold">confidence</span>, and <span className="text-emerald-300 font-semibold">problem-solving abilities</span>.
              </p>
              <p>
                This interview contains <span className="text-white font-bold">{totalQuestions} questions</span>. Please answer naturally. Take your time.
              </p>
              <p className="text-brand-300 font-bold pt-1">
                Are you ready to begin?
              </p>
            </div>

            {/* Action Bar for Readiness Confirmation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Speak <span className="text-white font-bold">"Yes"</span> or <span className="text-white font-bold">"I'm ready"</span> aloud, or click begin:</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmReadiness}
                  icon={<Sparkles className="w-4 h-4" />}
                  className="w-full sm:w-auto shadow-lg shadow-brand-500/20"
                >
                  I'm Ready — Start Interview
                </Button>
              </div>
            </div>
          </GlassCard>
        ) : (
          <>
            {/* AI Question Display Card */}
            <GlassCard className="p-8 space-y-6 relative overflow-hidden border border-white/10 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-600/30 border border-brand-400/40 text-brand-400 flex items-center justify-center font-bold text-sm shrink-0">
                    AI
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Interviewer Question
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {role} &bull; {difficulty} Level
                    </p>
                  </div>
                </div>

                {/* Read Aloud Button / Stop Audio */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                      } else if (currentQuestion?.question_text) {
                        speakText(currentQuestion.question_text, () => {
                          if (isHandsFreeMode) startListening();
                        });
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                      isSpeaking
                        ? 'bg-purple-500/30 border-purple-500 text-purple-300 animate-pulse'
                        : 'bg-slate-800/80 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                    title={isSpeaking ? 'Interrupt AI speech' : 'Replay question audio'}
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4 text-purple-300" /> : <Volume2 className="w-4 h-4 text-brand-400" />}
                    <span className="hidden sm:inline">{isSpeaking ? 'Stop AI Voice' : 'Repeat Question'}</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-lg sm:text-xl font-medium text-white leading-relaxed pt-2">
                {isLoadingNext ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-5 bg-white/10 rounded w-3/4" />
                    <div className="h-5 bg-white/10 rounded w-1/2" />
                  </div>
                ) : (
                  currentQuestion?.question_text || 'Loading next question...'
                )}
              </div>
            </GlassCard>

            {/* Live Conversational Voice & Transcript Arena */}
            <GlassCard className="p-8 space-y-6 relative overflow-hidden border border-white/10 shadow-2xl">
              {/* Top Info Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Your Spoken Answer
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Speak naturally into your microphone. Automatically submits on silence.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowTranscriptEditor(!showTranscriptEditor)}
                  className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 underline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{showTranscriptEditor ? 'Hide Manual Editor' : 'Edit Transcript Manually'}</span>
                </button>
              </div>

              {/* Spoken Text Display or Manual Editor */}
              {showTranscriptEditor ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={answerText}
                    onChange={(e) => {
                      setAnswerText(e.target.value);
                      setFinalTranscript(e.target.value);
                    }}
                    placeholder="Edit or type your answer here..."
                    className="w-full p-4 rounded-xl glass-input text-sm resize-none text-white focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Manual changes sync with voice submissions.
                  </p>
                </div>
              ) : (
                <div className="min-h-[100px] p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col justify-between">
                  <div className="text-sm text-slate-200 leading-relaxed">
                    {answerText ? (
                      <span>{answerText}</span>
                    ) : (
                      <span className="text-slate-500 italic">
                        {isListening 
                          ? 'Listening... Start speaking your answer aloud.' 
                          : 'Press the microphone or start speaking to respond.'}
                      </span>
                    )}
                    {interimTranscript && (
                      <span className="text-brand-400 font-medium ml-1.5 opacity-90 animate-pulse">
                        {interimTranscript}
                      </span>
                    )}
                  </div>

                  {answerText && (
                    <div className="text-[11px] text-slate-400 pt-3 border-t border-white/5 flex justify-between">
                      <span>{answerText.split(/\s+/).filter(Boolean).length} words spoken</span>
                      <span>{timeSpent}s spent on this question</span>
                    </div>
                  )}
                </div>
              )}

              {/* Central Voice Interaction Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5">
                {/* Primary Microphone Action */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      if (isListening) {
                        stopListening();
                      } else {
                        startListening();
                      }
                    }}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                      isListening
                        ? 'bg-red-500 text-white shadow-red-500/30 animate-pulse ring-4 ring-red-500/20'
                        : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/30 hover:scale-[1.02]'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <Mic className="w-5 h-5" />
                        <span>Stop Recording</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        <span>Tap to Speak</span>
                      </>
                    )}
                  </button>

                  {/* Instant "Done Speaking" Action */}
                  {answerText.trim().length > 0 && (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => handleNextOrSubmit(false)}
                      isLoading={isLoadingNext}
                      icon={<Send className="w-4 h-4 text-emerald-400" />}
                    >
                      Done Speaking (Submit Answer)
                    </Button>
                  )}
                </div>

                {/* Skip Option */}
                <button
                  onClick={() => handleNextOrSubmit(true)}
                  disabled={isLoadingNext}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Skip Question</span>
                </button>
              </div>
            </GlassCard>

            {/* Bottom Navigation & Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrevious}
                disabled={questionIndex === 0 || isLoadingNext}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Previous
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFinishConfirm(true)}
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  End Interview Early
                </Button>

                {questionIndex + 1 >= totalQuestions ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleFinishInterview}
                    isLoading={isEvaluating}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Complete & View Scorecard
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleNextOrSubmit(false)}
                    isLoading={isLoadingNext}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next Question
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Voice Configuration Modal */}
      <AnimatePresence>
        {showVoiceSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-5 h-5 text-brand-400" />
                  <h3 className="text-base font-bold text-white">AI Voice & Audio Preferences</h3>
                </div>
                <button
                  onClick={() => setShowVoiceSettingsModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Voice Gender Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Voice Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['auto', 'male', 'female'] as VoiceGender[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => updateVoiceSettings({ gender: g, voiceURI: '' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                        voiceSettings.gender === g
                          ? 'bg-brand-600 text-white border-brand-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {g} Voice
                    </button>
                  ))}
                </div>
              </div>

              {/* System Voice Selector */}
              {availableVoices.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Specific Voice Engine</label>
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

              {/* Speed Slider */}
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

              {/* Pitch Slider */}
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
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              {/* Audition Button */}
              <div className="pt-2 flex justify-between gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => testVoice()}
                  icon={<Play className="w-3.5 h-3.5 text-purple-400" />}
                >
                  Audition Voice
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowVoiceSettingsModal(false)}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Finish Confirmation Modal */}
      <AnimatePresence>
        {showFinishConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">End Interview Early?</h3>
              <p className="text-xs text-slate-400">
                You have answered {questionIndex + 1} of {totalQuestions} questions. Your answers will be submitted for evaluation.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowFinishConfirm(false)}
                >
                  Continue Interview
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 bg-red-600 hover:bg-red-500"
                  onClick={handleFinishInterview}
                  isLoading={isEvaluating}
                >
                  End & Evaluate
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
