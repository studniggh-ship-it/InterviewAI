import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/db';

export class DashboardController {
  static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as any;
      const streakRecord = db.prepare('SELECT streak_count, longest_streak, daily_goal_minutes, last_interview_date FROM user_streaks WHERE user_id = ?').get(userId) as any;
      const latestResume = db.prepare('SELECT ats_score, created_at FROM resume_analysis WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId) as any;
      const activeInterview = db.prepare(`
        SELECT id, role, difficulty, duration_minutes, created_at
        FROM interviews
        WHERE user_id = ? AND status = 'in_progress'
        ORDER BY created_at DESC
        LIMIT 1
      `).get(userId) as any;

      const totalInterviewsRow = db.prepare('SELECT COUNT(*) as count FROM interviews WHERE user_id = ?').get(userId) as any;
      const completedInterviewsRow = db.prepare("SELECT COUNT(*) as count FROM interviews WHERE user_id = ? AND status = 'completed'").get(userId) as any;
      const pendingInterviewsRow = db.prepare("SELECT COUNT(*) as count FROM interviews WHERE user_id = ? AND status = 'in_progress'").get(userId) as any;

      const scoreAggRow = db.prepare(`
        SELECT 
          AVG(f.overall_score) as avgScore,
          MAX(f.overall_score) as maxScore,
          MIN(f.overall_score) as minScore,
          AVG(COALESCE(f.accuracy_score, f.technical_score, 80)) as avgAccuracy,
          SUM(CASE WHEN f.overall_score >= 70 THEN 1 ELSE 0 END) as passedCount
        FROM interviews i
        JOIN feedback f ON f.interview_id = i.id
        WHERE i.user_id = ? AND i.status = 'completed'
      `).get(userId) as any;

      const totalPracticeTimeRow = db.prepare(`
        SELECT 
          SUM(i.duration_minutes) as totalMins,
          (SELECT SUM(a.time_spent_seconds) FROM answers a WHERE a.user_id = ?) as totalSecondsAnswered
        FROM interviews i
        WHERE i.user_id = ? AND i.status = 'completed'
      `).get(userId, userId) as any;

      const questionsAnsweredRow = db.prepare(`
        SELECT COUNT(*) as count
        FROM answers
        WHERE user_id = ? AND answer_text NOT IN ('', '(Skipped)', '(No answer)')
      `).get(userId) as any;

      const recentInterviews = db.prepare(`
        SELECT 
          i.id, 
          i.role, 
          i.difficulty, 
          i.duration_minutes, 
          i.created_at, 
          i.status, 
          f.overall_score,
          (SELECT COUNT(*) FROM answers a WHERE a.interview_id = i.id AND a.answer_text NOT IN ('', '(Skipped)', '(No answer)')) as answered_questions
        FROM interviews i
        LEFT JOIN feedback f ON f.interview_id = i.id
        WHERE i.user_id = ?
        ORDER BY i.created_at DESC
        LIMIT 5
      `).all(userId);

      // Real 7-day chronological progression
      const past7DaysData = db.prepare(`
        SELECT 
          strftime('%Y-%m-%d', i.created_at) as sessionDate,
          ROUND(AVG(f.overall_score)) as avgScore,
          COUNT(*) as sessionCount
        FROM interviews i
        JOIN feedback f ON f.interview_id = i.id
        WHERE i.user_id = ? AND i.status = 'completed' AND date(i.created_at) >= date('now', '-6 days')
        GROUP BY strftime('%Y-%m-%d', i.created_at)
        ORDER BY sessionDate ASC
      `).all(userId) as any[];

      // Construct a continuous 7-day trend array
      const weeklyProgress = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
        const match = past7DaysData.find((row) => row.sessionDate === dateStr);
        weeklyProgress.push({
          day: dayLabel,
          date: dateStr,
          score: match ? Number(match.avgScore) : 0,
          count: match ? Number(match.sessionCount) : 0,
        });
      }

      // Real 6-month chronological progression
      const monthlyProgress = db.prepare(`
        SELECT 
          strftime('%Y-%m', i.created_at) as monthKey,
          ROUND(AVG(f.overall_score)) as avgScore,
          COUNT(*) as sessionCount
        FROM interviews i
        JOIN feedback f ON f.interview_id = i.id
        WHERE i.user_id = ? AND i.status = 'completed'
        GROUP BY strftime('%Y-%m', i.created_at)
        ORDER BY monthKey ASC
        LIMIT 6
      `).all(userId).map((row: any) => ({
        month: row.monthKey,
        avgScore: row.avgScore ? Number(row.avgScore) : 0,
        count: row.sessionCount ? Number(row.sessionCount) : 0,
      }));

      const totalCompleted = completedInterviewsRow?.count || 0;
      const totalAll = totalInterviewsRow?.count || 0;
      const totalPending = pendingInterviewsRow?.count || 0;
      const averageScore = scoreAggRow?.avgScore ? Math.round(scoreAggRow.avgScore) : 0;
      const bestScore = scoreAggRow?.maxScore ? Math.round(scoreAggRow.maxScore) : 0;
      const lowestScore = scoreAggRow?.minScore ? Math.round(scoreAggRow.minScore) : 0;
      const interviewAccuracy = scoreAggRow?.avgAccuracy ? Math.round(scoreAggRow.avgAccuracy) : 0;
      const passedCount = scoreAggRow?.passedCount || 0;
      const successPercentage = totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 0;

      // Practice minutes from actual sessions
      const totalPracticeMinutes = totalPracticeTimeRow?.totalMins || (totalPracticeTimeRow?.totalSecondsAnswered ? Math.round(totalPracticeTimeRow.totalSecondsAnswered / 60) : 0);

      // Real improvement delta between latest and previous completed interview
      const lastTwoSessions = db.prepare(`
        SELECT f.communication_score, f.technical_score, f.overall_score
        FROM interviews i
        JOIN feedback f ON f.interview_id = i.id
        WHERE i.user_id = ? AND i.status = 'completed'
        ORDER BY i.created_at DESC
        LIMIT 2
      `).all(userId) as any[];

      let communicationImprovement = 0;
      let technicalImprovement = 0;
      if (lastTwoSessions.length >= 2) {
        communicationImprovement = Number(lastTwoSessions[0].communication_score) - Number(lastTwoSessions[1].communication_score);
        technicalImprovement = Number(lastTwoSessions[0].technical_score) - Number(lastTwoSessions[1].technical_score);
      }

      const currentStreak = streakRecord?.streak_count || (totalCompleted > 0 ? 1 : 0);
      const longestStreak = streakRecord?.longest_streak || currentStreak;

      return res.json({
        greeting: `Welcome back, ${user ? user.name : 'Candidate'}!`,
        dailyGoalMinutes: streakRecord ? streakRecord.daily_goal_minutes : 20,
        dailyStreak: currentStreak,
        longestStreak: longestStreak,
        continueInterview: activeInterview || null,
        recentInterviews,
        resumeScore: latestResume ? latestResume.ats_score : null,
        weeklyProgress,
        monthlyProgress,
        communicationImprovement,
        technicalImprovement,
        stats: {
          totalInterviews: totalAll,
          totalCompleted,
          pendingInterviews: totalPending,
          averageScore,
          bestScore,
          highestScore: bestScore,
          lowestScore,
          totalPracticeTimeMinutes: totalPracticeMinutes,
          currentStreak,
          longestStreak,
          resumeScore: latestResume ? latestResume.ats_score : null,
          interviewAccuracy,
          communicationImprovement,
          technicalImprovement,
          questionsAnswered: questionsAnsweredRow?.count || 0,
          successPercentage
        }
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return res.status(500).json({ error: 'Failed to retrieve dashboard stats' });
    }
  }

  static async getProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      // Historical performance trends for Recharts
      const historyScores = db.prepare(`
        SELECT 
          i.id,
          i.created_at as date,
          i.role,
          i.difficulty,
          i.duration_minutes,
          f.overall_score as score,
          f.technical_score as technical,
          f.communication_score as communication,
          f.grammar_score as grammar,
          f.confidence_score as confidence,
          f.problem_solving_score as problemSolving,
          COALESCE(f.accuracy_score, f.technical_score) as accuracy,
          COALESCE(f.vocabulary_score, f.communication_score) as vocabulary
        FROM interviews i
        JOIN feedback f ON f.interview_id = i.id
        WHERE i.user_id = ? AND i.status = 'completed'
        ORDER BY i.created_at ASC
      `).all(userId) as any[];

      const totalCountRow = db.prepare("SELECT COUNT(*) as count FROM interviews WHERE user_id = ? AND status = 'completed'").get(userId) as any;
      const totalAllRow = db.prepare('SELECT COUNT(*) as count FROM interviews WHERE user_id = ?').get(userId) as any;

      const statsRow = db.prepare(`
        SELECT 
          AVG(f.overall_score) as avgOverall,
          MAX(f.overall_score) as maxOverall,
          AVG(f.technical_score) as avgTech,
          AVG(f.communication_score) as avgComm,
          AVG(f.problem_solving_score) as avgProb,
          AVG(f.grammar_score) as avgGrammar,
          AVG(f.confidence_score) as avgConfidence,
          AVG(COALESCE(f.accuracy_score, f.technical_score)) as avgAccuracy,
          AVG(COALESCE(f.vocabulary_score, f.communication_score)) as avgVocab,
          AVG(COALESCE(f.leadership_score, 80)) as avgLeadership,
          AVG(COALESCE(f.behavior_score, 82)) as avgBehavior,
          AVG(i.duration_minutes) as avgDuration,
          SUM(CASE WHEN f.overall_score >= 70 THEN 1 ELSE 0 END) as passedCount
        FROM interviews i
        JOIN feedback f ON f.interview_id = i.id
        WHERE i.user_id = ? AND i.status = 'completed'
      `).get(userId) as any;

      const streakRecord = db.prepare('SELECT streak_count, longest_streak FROM user_streaks WHERE user_id = ?').get(userId) as any;
      const totalQuestionsAnsweredRow = db.prepare(`
        SELECT COUNT(*) as count FROM answers WHERE user_id = ? AND answer_text NOT IN ('', '(Skipped)', '(No answer)')
      `).get(userId) as any;

      const totalCompleted = totalCountRow?.count || 0;
      const passedCount = statsRow?.passedCount || 0;
      const successRate = totalCompleted > 0 ? Math.round((passedCount / totalCompleted) * 100) : 0;

      // Aggregate strengths and weaknesses from real feedbacks
      const allFeedbackRows = db.prepare(`
        SELECT f.strengths_json, f.weaknesses_json
        FROM feedback f
        JOIN interviews i ON i.id = f.interview_id
        WHERE i.user_id = ? AND i.status = 'completed'
        ORDER BY f.created_at DESC
        LIMIT 10
      `).all(userId) as any[];

      const strongTopicsSet = new Set<string>();
      const weakTopicsSet = new Set<string>();

      allFeedbackRows.forEach(row => {
        try {
          const s = JSON.parse(row.strengths_json || '[]');
          const w = JSON.parse(row.weaknesses_json || '[]');
          s.forEach((item: string) => strongTopicsSet.add(item));
          w.forEach((item: string) => weakTopicsSet.add(item));
        } catch (e) {}
      });

      // Role performance breakdown
      const roleBreakdown = db.prepare(`
        SELECT 
          i.role,
          COUNT(*) as totalSessions,
          ROUND(AVG(f.overall_score)) as avgScore
        FROM interviews i
        JOIN feedback f ON f.interview_id = i.id
        WHERE i.user_id = ? AND i.status = 'completed'
        GROUP BY i.role
        ORDER BY totalSessions DESC
      `).all(userId) as any[];

      // Difficulty distribution for Pie Chart
      const difficultyDistribution = db.prepare(`
        SELECT 
          i.difficulty as name,
          COUNT(*) as value
        FROM interviews i
        WHERE i.user_id = ? AND i.status = 'completed'
        GROUP BY i.difficulty
      `).all(userId) as any[];

      // Performance tiers for Pie Chart
      const performanceTiers = db.prepare(`
        SELECT 
          COALESCE(f.estimated_performance, CASE WHEN f.overall_score >= 85 THEN 'Strong Hire' WHEN f.overall_score >= 70 THEN 'Hire' ELSE 'Needs Practice' END) as name,
          COUNT(*) as value
        FROM feedback f
        JOIN interviews i ON i.id = f.interview_id
        WHERE i.user_id = ? AND i.status = 'completed'
        GROUP BY name
      `).all(userId) as any[];

      // Real daily practice for the last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dailyPractice = days.map((dayName, dayIndex) => {
        const matchingSessions = historyScores.filter(s => {
          const d = new Date(s.date);
          return d.getDay() === dayIndex;
        });
        const avgDayScore = matchingSessions.length > 0
          ? Math.round(matchingSessions.reduce((acc, s) => acc + s.score, 0) / matchingSessions.length)
          : 0;
        return {
          day: dayName,
          score: avgDayScore,
          interviews: matchingSessions.length
        };
      });

      // Real weekly practice groups
      const weeklyProgress = historyScores.slice(-7).map((s, idx) => ({
        day: `Session ${idx + 1}`,
        score: s.score,
        interviews: 1
      }));

      // Real monthly trends
      const monthlyProgress = db.prepare(`
        SELECT 
          strftime('%Y-%m', i.created_at) as monthKey,
          ROUND(AVG(f.overall_score)) as avgScore,
          COUNT(*) as totalInterviews
        FROM interviews i
        JOIN feedback f ON f.interview_id = i.id
        WHERE i.user_id = ? AND i.status = 'completed'
        GROUP BY strftime('%Y-%m', i.created_at)
        ORDER BY monthKey ASC
        LIMIT 6
      `).all(userId).map((row: any) => ({
        month: row.monthKey,
        avgScore: row.avgScore || 0,
        interviews: row.totalInterviews || 0
      }));

      return res.json({
        totalInterviews: totalAllRow?.count || 0,
        completedInterviews: totalCompleted,
        averageScore: statsRow?.avgOverall ? Math.round(statsRow.avgOverall) : 0,
        bestScore: statsRow?.maxOverall ? Math.round(statsRow.maxOverall) : 0,
        successRate,
        averageTimeMinutes: statsRow?.avgDuration ? Math.round(statsRow.avgDuration) : 0,
        questionAccuracy: statsRow?.avgAccuracy ? Math.round(statsRow.avgAccuracy) : 0,
        questionsAnswered: totalQuestionsAnsweredRow?.count || 0,
        currentStreak: streakRecord?.streak_count || 0,
        longestStreak: streakRecord?.longest_streak || streakRecord?.streak_count || 0,
        breakdown: {
          technical: statsRow?.avgTech ? Math.round(statsRow.avgTech) : 0,
          communication: statsRow?.avgComm ? Math.round(statsRow.avgComm) : 0,
          problemSolving: statsRow?.avgProb ? Math.round(statsRow.avgProb) : 0,
          confidence: statsRow?.avgConfidence ? Math.round(statsRow.avgConfidence) : 0,
          grammar: statsRow?.avgGrammar ? Math.round(statsRow.avgGrammar) : 0,
          vocabulary: statsRow?.avgVocab ? Math.round(statsRow.avgVocab) : 0,
          leadership: statsRow?.avgLeadership ? Math.round(statsRow.avgLeadership) : 0,
          behavior: statsRow?.avgBehavior ? Math.round(statsRow.avgBehavior) : 0,
          accuracy: statsRow?.avgAccuracy ? Math.round(statsRow.avgAccuracy) : 0,
        },
        weakTopics: Array.from(weakTopicsSet).slice(0, 5),
        strongTopics: Array.from(strongTopicsSet).slice(0, 5),
        roleBreakdown,
        difficultyDistribution,
        performanceTiers,
        historyScores,
        dailyPractice,
        weeklyProgress,
        monthlyProgress
      });
    } catch (error) {
      console.error('Progress error:', error);
      return res.status(500).json({ error: 'Failed to retrieve progress data' });
    }
  }
}

