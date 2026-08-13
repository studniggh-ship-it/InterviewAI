export type ThemeMode = 'dark' | 'light' | 'system';

export interface User {
  id: number;
  name: string;
  email: string;
  college?: string;
  skills?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  target_role?: string;
  experience?: string;
  education?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserSettings {
  theme: ThemeMode;
  notifications_enabled: boolean | number;
  language: string;
}

export interface UserStreak {
  streak_count: number;
  longest_streak: number;
  daily_goal_minutes: number;
  last_interview_date: string;
}

export interface Question {
  id: number;
  question_index: number;
  question_text: string;
  category: string;
}

export interface InterviewSession {
  id: number;
  role: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration_minutes: number;
  status: 'in_progress' | 'completed';
  resume_id?: number | null;
  resume_filename?: string;
  total_questions?: number;
  answered_questions?: number;
  created_at: string;
  completed_at?: string;
  overall_score?: number;
  technical_score?: number;
  communication_score?: number;
  grammar_score?: number;
  confidence_score?: number;
  problem_solving_score?: number;
  accuracy_score?: number;
  vocabulary_score?: number;
  leadership_score?: number;
  behavior_score?: number;
  difficulty_level?: string;
  estimated_performance?: string;
  strengths?: string[];
  weaknesses?: string[];
  suggestedAnswers?: { questionIndex: number; question: string; suggestedAnswer: string }[];
  tips?: string[];
  transcript?: {
    question_id: number;
    question_index: number;
    question_text: string;
    category: string;
    answer_text: string;
    time_spent_seconds: number;
  }[];
}

export interface EvaluationReport {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  problemSolvingScore: number;
  grammarScore: number;
  vocabularyScore: number;
  leadershipScore: number;
  behaviorScore: number;
  accuracyScore: number;
  difficultyLevel: string;
  estimatedPerformance: string;
  strengths: string[];
  weaknesses: string[];
  suggestedAnswers: {
    questionIndex: number;
    question: string;
    suggestedAnswer: string;
  }[];
  tips: string[];
}

export interface KeywordDensityItem {
  keyword: string;
  count: number;
  category: string;
}

export interface ResumeAnalysis {
  id?: number;
  originalFilename: string;
  atsScore: number;
  summary: string;
  missingSkills: string[];
  matchedSkills: string[];
  recommendedSkills: string[];
  grammarIssues: string[];
  formattingIssues: string[];
  keywordDensity: KeywordDensityItem[];
  experienceAnalysis: string[];
  educationAnalysis: string[];
  projectsAnalysis: string[];
  achievementsAnalysis: string[];
  projectSuggestions: string[];
  tips: string[];
  created_at?: string;
}

export interface DashboardStats {
  greeting: string;
  dailyGoalMinutes: number;
  dailyStreak: number;
  longestStreak: number;
  continueInterview: InterviewSession | null;
  recentInterviews: InterviewSession[];
  resumeScore: number | null;
  weeklyProgress: { day: string; date: string; score: number; count: number }[];
  monthlyProgress: { month: string; avgScore: number; count: number }[];
  communicationImprovement?: number;
  technicalImprovement?: number;
  stats: {
    totalInterviews: number;
    totalCompleted: number;
    pendingInterviews: number;
    averageScore: number;
    bestScore: number;
    highestScore: number;
    lowestScore: number;
    totalPracticeTimeMinutes: number;
    currentStreak: number;
    longestStreak: number;
    resumeScore: number | null;
    interviewAccuracy: number;
    communicationImprovement?: number;
    technicalImprovement?: number;
    questionsAnswered: number;
    successPercentage: number;
  };
}

export interface ProgressAnalytics {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  bestScore: number;
  successRate: number;
  averageTimeMinutes: number;
  questionAccuracy: number;
  questionsAnswered: number;
  currentStreak: number;
  longestStreak: number;
  breakdown: {
    technical: number;
    communication: number;
    problemSolving: number;
    grammar: number;
    confidence: number;
    accuracy: number;
    vocabulary: number;
    leadership?: number;
    behavior?: number;
  };
  weakTopics: string[];
  strongTopics: string[];
  roleBreakdown: {
    role: string;
    totalSessions: number;
    avgScore: number;
  }[];
  historyScores: {
    id: number;
    date: string;
    role: string;
    difficulty: string;
    duration_minutes: number;
    score: number;
    technical: number;
    communication: number;
    problemSolving: number;
    grammar?: number;
    confidence?: number;
    accuracy?: number;
  }[];
  dailyPractice: { day: string; score: number; interviews: number }[];
  weeklyProgress: { day: string; score: number; interviews: number }[];
  monthlyProgress: { month: string; avgScore: number; interviews: number }[];
  difficultyDistribution?: { name: string; value: number }[];
  performanceTiers?: { name: string; value: number }[];
}

