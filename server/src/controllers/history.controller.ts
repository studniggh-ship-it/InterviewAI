import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/db';

export class HistoryController {
  static async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const sessions = db.prepare(`
        SELECT 
          i.id,
          i.role,
          i.difficulty,
          i.duration_minutes,
          i.status,
          i.resume_id,
          i.created_at,
          i.completed_at,
          f.overall_score,
          f.technical_score,
          f.communication_score,
          f.grammar_score,
          f.confidence_score,
          f.problem_solving_score,
          f.accuracy_score,
          f.vocabulary_score,
          f.leadership_score,
          f.behavior_score,
          f.difficulty_level,
          f.estimated_performance,
          f.strengths_json,
          f.weaknesses_json,
          f.suggested_answers_json,
          f.tips_json,
          (SELECT COUNT(*) FROM questions q WHERE q.interview_id = i.id) as total_questions,
          (SELECT COUNT(*) FROM answers a WHERE a.interview_id = i.id AND a.answer_text NOT IN ('', '(Skipped)', '(No answer)')) as answered_questions,
          r.original_filename as resume_filename
        FROM interviews i
        LEFT JOIN feedback f ON f.interview_id = i.id
        LEFT JOIN resume_analysis r ON r.id = i.resume_id
        WHERE i.user_id = ?
        ORDER BY i.created_at DESC
      `).all(userId) as any[];

      // Attach full QA transcript to each session
      const enriched = sessions.map(session => {
        const qaRows = db.prepare(`
          SELECT 
            q.id as question_id,
            q.question_index,
            q.question_text,
            q.category,
            COALESCE(a.answer_text, '(No answer provided)') as answer_text,
            COALESCE(a.time_spent_seconds, 0) as time_spent_seconds
          FROM questions q
          LEFT JOIN answers a ON a.question_id = q.id
          WHERE q.interview_id = ?
          ORDER BY q.question_index ASC
        `).all(session.id);

        let strengths: string[] = [];
        let weaknesses: string[] = [];
        let suggestedAnswers: any[] = [];
        let tips: string[] = [];

        try { strengths = JSON.parse(session.strengths_json || '[]'); } catch (e) {}
        try { weaknesses = JSON.parse(session.weaknesses_json || '[]'); } catch (e) {}
        try { suggestedAnswers = JSON.parse(session.suggested_answers_json || '[]'); } catch (e) {}
        try { tips = JSON.parse(session.tips_json || '[]'); } catch (e) {}

        return {
          ...session,
          strengths,
          weaknesses,
          suggestedAnswers,
          tips,
          transcript: qaRows
        };
      });

      return res.json({ history: enriched });
    } catch (error) {
      console.error('Get history error:', error);
      return res.status(500).json({ error: 'Failed to retrieve interview history' });
    }
  }

  static async deleteInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const interviewId = Number(req.params.id);

      const existing = db.prepare('SELECT id FROM interviews WHERE id = ? AND user_id = ?').get(interviewId, userId);
      if (!existing) {
        return res.status(404).json({ error: 'Interview record not found' });
      }

      db.prepare('DELETE FROM interviews WHERE id = ?').run(interviewId);

      return res.json({ message: 'Interview record deleted successfully' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete interview record' });
    }
  }
}

