import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/db';
import { GeminiService } from '../services/gemini.service';

export class InterviewController {
  /**
   * Initializes a new interview session and generates the first question using Gemini API.
   */
  static async startInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { role, difficulty, duration_minutes, resume_id } = req.body;

      if (!role || !difficulty || !duration_minutes) {
        return res.status(400).json({ error: 'Role, difficulty, and duration_minutes are required' });
      }

      // Insert interview session record
      const stmt = db.prepare(`
        INSERT INTO interviews (user_id, role, difficulty, duration_minutes, status, resume_id)
        VALUES (?, ?, ?, ?, 'in_progress', ?)
      `);
      const result = stmt.run(userId, role, difficulty, Number(duration_minutes), resume_id || null);
      const interviewId = Number(result.lastInsertRowid);

      // Fetch resume context if resume_id is linked
      let resumeContext = undefined;
      if (resume_id) {
        const resRow = db.prepare('SELECT * FROM resume_analysis WHERE id = ?').get(resume_id) as any;
        if (resRow) {
          resumeContext = {
            summary: resRow.summary,
            matchedSkills: JSON.parse(resRow.matched_skills_json || '[]'),
            projects: JSON.parse(resRow.projects_analysis_json || '[]'),
            experience: JSON.parse(resRow.experience_analysis_json || '[]')
          };
        }
      }

      // Generate single first question using Gemini API
      const totalQuestions = Number(duration_minutes) === 10 ? 4 : Number(duration_minutes) === 20 ? 7 : 10;
      const qRes = await GeminiService.generateQuestion(role, difficulty, 0, [], [], resumeContext);
      const openingGreeting = GeminiService.getOpeningGreeting(role, totalQuestions, req.user?.name);

      // Insert 1st question into database
      const qStmt = db.prepare(`
        INSERT INTO questions (interview_id, question_index, question_text, category)
        VALUES (?, 0, ?, ?)
      `);
      const qResult = qStmt.run(interviewId, qRes.questionText, qRes.category);

      return res.status(201).json({
        interview: {
          id: interviewId,
          role,
          difficulty,
          duration_minutes: Number(duration_minutes),
          status: 'in_progress',
          created_at: new Date().toISOString()
        },
        openingGreeting,
        currentQuestion: {
          id: Number(qResult.lastInsertRowid),
          question_index: 0,
          question_text: qRes.questionText,
          category: qRes.category
        }
      });
    } catch (error: any) {
      console.error('Start interview error:', error);
      return res.status(500).json({ error: 'Failed to start interview session' });
    }
  }

  /**
   * Returns current state of the interview session to support seamless resume.
   */
  static async getSessionDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const interviewId = Number(req.params.id);

      const interview = db.prepare('SELECT * FROM interviews WHERE id = ? AND user_id = ?').get(interviewId, userId) as any;
      if (!interview) {
        return res.status(404).json({ error: 'Interview session not found' });
      }

      const questions = db.prepare(`
        SELECT q.id, q.question_index, q.question_text, q.category, a.answer_text, COALESCE(a.time_spent_seconds, 0) as time_spent_seconds
        FROM questions q
        LEFT JOIN answers a ON a.question_id = q.id
        WHERE q.interview_id = ?
        ORDER BY q.question_index ASC
      `).all(interviewId) as any[];

      const maxQuestions = interview.duration_minutes === 10 ? 4 : interview.duration_minutes === 20 ? 7 : 10;
      const latestAnsweredIndex = questions.length > 0 ? questions[questions.length - 1].question_index : 0;

      return res.json({
        interview,
        questions,
        totalQuestions: maxQuestions,
        currentIndex: latestAnsweredIndex,
        isCompleted: interview.status === 'completed'
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve session details' });
    }
  }

  /**
   * Submits an answer for the current question and returns or generates the next adaptive question.
   */
  static async submitAnswerAndNext(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const interviewId = Number(req.params.id);
      const { question_id, question_index, answer_text, time_spent_seconds, is_skip } = req.body;

      const interview = db.prepare('SELECT * FROM interviews WHERE id = ? AND user_id = ?').get(interviewId, userId) as any;
      if (!interview) {
        return res.status(404).json({ error: 'Interview session not found' });
      }

      if (interview.status === 'completed') {
        return res.status(400).json({ error: 'Interview session already completed' });
      }

      let singleEval: any = undefined;

      // Save answer and evaluate in real time if question_id is provided
      if (question_id) {
        const currentQRecord = db.prepare('SELECT question_text FROM questions WHERE id = ?').get(question_id) as any;
        const qText = currentQRecord ? currentQRecord.question_text : 'Interview Question';
        const finalAnswer = is_skip ? '(Skipped)' : (answer_text || '(No answer)');

        // Real-time AI evaluation for this specific answer
        singleEval = await GeminiService.evaluateSingleAnswer(
          interview.role,
          interview.difficulty,
          qText,
          finalAnswer
        );

        const existingAns = db.prepare('SELECT id FROM answers WHERE question_id = ?').get(question_id);
        if (existingAns) {
          db.prepare(`
            UPDATE answers 
            SET answer_text = ?, 
                time_spent_seconds = ?,
                correctness_score = ?,
                feedback_text = ?,
                strengths_text = ?,
                weaknesses_text = ?,
                suggested_answer = ?,
                ai_understanding = ?
            WHERE id = ?
          `).run(
            finalAnswer, 
            time_spent_seconds || 0,
            singleEval.correctnessScore,
            singleEval.feedbackText,
            singleEval.strengths,
            singleEval.weaknesses,
            singleEval.suggestedAnswer,
            singleEval.aiUnderstanding,
            (existingAns as any).id
          );
        } else {
          db.prepare(`
            INSERT INTO answers (
              question_id, interview_id, user_id, answer_text, time_spent_seconds,
              correctness_score, feedback_text, strengths_text, weaknesses_text, suggested_answer, ai_understanding
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            question_id, 
            interviewId, 
            userId, 
            finalAnswer, 
            time_spent_seconds || 0,
            singleEval.correctnessScore,
            singleEval.feedbackText,
            singleEval.strengths,
            singleEval.weaknesses,
            singleEval.suggestedAnswer,
            singleEval.aiUnderstanding
          );
        }
      }

      const nextIndex = Number(question_index) + 1;
      const maxQuestions = interview.duration_minutes === 10 ? 4 : interview.duration_minutes === 20 ? 7 : 10;

      if (nextIndex >= maxQuestions) {
        return res.json({
          isFinished: true,
          message: 'All scheduled questions completed. Please submit for evaluation.'
        });
      }

      // Check if next question already exists in DB
      let nextQ = db.prepare('SELECT * FROM questions WHERE interview_id = ? AND question_index = ?').get(interviewId, nextIndex) as any;

      if (!nextQ) {
        // Fetch all previous questions and candidate answers for adaptive generation
        const prevQA = db.prepare(`
          SELECT q.question_text, COALESCE(a.answer_text, '') as answer_text
          FROM questions q
          LEFT JOIN answers a ON a.question_id = q.id
          WHERE q.interview_id = ?
          ORDER BY q.question_index ASC
        `).all(interviewId) as any[];

        const prevQuestions = prevQA.map((q: any) => q.question_text);
        const prevAnswers = prevQA.map((q: any) => q.answer_text);

        // Fetch resume context if linked
        let resumeContext = undefined;
        if (interview.resume_id) {
          const resRow = db.prepare('SELECT * FROM resume_analysis WHERE id = ?').get(interview.resume_id) as any;
          if (resRow) {
            resumeContext = {
              summary: resRow.summary,
              matchedSkills: JSON.parse(resRow.matched_skills_json || '[]'),
              projects: JSON.parse(resRow.projects_analysis_json || '[]'),
              experience: JSON.parse(resRow.experience_analysis_json || '[]')
            };
          }
        }

        // Generate next single question using Gemini with anti-repetition and adaptive difficulty
        const qRes = await GeminiService.generateQuestion(
          interview.role,
          interview.difficulty,
          nextIndex,
          prevQuestions,
          prevAnswers,
          resumeContext,
          singleEval ? singleEval.correctnessScore : undefined
        );

        const qResult = db.prepare(`
          INSERT INTO questions (interview_id, question_index, question_text, category)
          VALUES (?, ?, ?, ?)
        `).run(interviewId, nextIndex, qRes.questionText, qRes.category);

        nextQ = {
          id: Number(qResult.lastInsertRowid),
          question_index: nextIndex,
          question_text: qRes.questionText,
          category: qRes.category
        };
      }

      // Fetch any existing answer for next question
      const existingAnswer = db.prepare('SELECT answer_text FROM answers WHERE question_id = ?').get(nextQ.id) as any;

      return res.json({
        isFinished: false,
        nextQuestion: nextQ,
        previousAnswer: existingAnswer ? existingAnswer.answer_text : ''
      });
    } catch (error: any) {
      console.error('Submit answer & next error:', error);
      return res.status(500).json({ error: 'Failed to process answer and fetch next question' });
    }
  }

  /**
   * Retrieves a question at a specific index (allows Previous / Next navigation).
   */
  static async getQuestionAtIndex(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const interviewId = Number(req.params.id);
      const index = Number(req.params.index);

      const interview = db.prepare('SELECT * FROM interviews WHERE id = ? AND user_id = ?').get(interviewId, userId);
      if (!interview) {
        return res.status(404).json({ error: 'Interview session not found' });
      }

      const question = db.prepare('SELECT * FROM questions WHERE interview_id = ? AND question_index = ?').get(interviewId, index) as any;
      if (!question) {
        return res.status(404).json({ error: 'Question not found at this index' });
      }

      const answer = db.prepare('SELECT answer_text, time_spent_seconds FROM answers WHERE question_id = ?').get(question.id) as any;

      return res.json({
        question,
        answer: answer ? answer.answer_text : ''
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch question' });
    }
  }

  /**
   * Finalizes the interview, sends all questions and answers to Gemini for evaluation, and saves feedback in SQLite.
   */
  static async finishInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const interviewId = Number(req.params.id);

      const interview = db.prepare('SELECT * FROM interviews WHERE id = ? AND user_id = ?').get(interviewId, userId) as any;
      if (!interview) {
        return res.status(404).json({ error: 'Interview session not found' });
      }

      // Fetch all questions and answers for this session
      const qas = db.prepare(`
        SELECT q.question_text as question, q.question_index, COALESCE(a.answer_text, '(No answer)') as answer, COALESCE(a.time_spent_seconds, 0) as timeSpentSeconds
        FROM questions q
        LEFT JOIN answers a ON a.question_id = q.id
        WHERE q.interview_id = ?
        ORDER BY q.question_index ASC
      `).all(interviewId) as any[];

      if (qas.length === 0) {
        return res.status(400).json({ error: 'No questions found for this interview session' });
      }

      // Generate evaluation via Gemini Service
      const evalRes = await GeminiService.evaluateInterview(interview.role, interview.difficulty, qas);

      // Save feedback in database
      const existingFb = db.prepare('SELECT id FROM feedback WHERE interview_id = ?').get(interviewId);
      if (existingFb) {
        db.prepare(`
          UPDATE feedback
          SET overall_score = ?, technical_score = ?, communication_score = ?, grammar_score = ?,
              confidence_score = ?, problem_solving_score = ?, accuracy_score = ?, vocabulary_score = ?,
              leadership_score = ?, behavior_score = ?, difficulty_level = ?, estimated_performance = ?,
              strengths_json = ?, weaknesses_json = ?, suggested_answers_json = ?, tips_json = ?
          WHERE interview_id = ?
        `).run(
          evalRes.overallScore,
          evalRes.technicalScore,
          evalRes.communicationScore,
          evalRes.grammarScore,
          evalRes.confidenceScore,
          evalRes.problemSolvingScore,
          evalRes.accuracyScore,
          evalRes.vocabularyScore,
          evalRes.leadershipScore,
          evalRes.behaviorScore,
          evalRes.difficultyLevel,
          evalRes.estimatedPerformance,
          JSON.stringify(evalRes.strengths),
          JSON.stringify(evalRes.weaknesses),
          JSON.stringify(evalRes.suggestedAnswers),
          JSON.stringify(evalRes.tips),
          interviewId
        );
      } else {
        db.prepare(`
          INSERT INTO feedback (
            interview_id, overall_score, technical_score, communication_score, grammar_score,
            confidence_score, problem_solving_score, accuracy_score, vocabulary_score,
            leadership_score, behavior_score, difficulty_level, estimated_performance,
            strengths_json, weaknesses_json, suggested_answers_json, tips_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          interviewId,
          evalRes.overallScore,
          evalRes.technicalScore,
          evalRes.communicationScore,
          evalRes.grammarScore,
          evalRes.confidenceScore,
          evalRes.problemSolvingScore,
          evalRes.accuracyScore,
          evalRes.vocabularyScore,
          evalRes.leadershipScore,
          evalRes.behaviorScore,
          evalRes.difficultyLevel,
          evalRes.estimatedPerformance,
          JSON.stringify(evalRes.strengths),
          JSON.stringify(evalRes.weaknesses),
          JSON.stringify(evalRes.suggestedAnswers),
          JSON.stringify(evalRes.tips)
        );
      }

      // Update interview status
      db.prepare("UPDATE interviews SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(interviewId);

      // Update user streak counter and longest streak
      const today = new Date().toISOString().split('T')[0];
      const streakRecord = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId) as any;
      if (streakRecord) {
        let newStreak = streakRecord.streak_count || 1;
        let longestStreak = streakRecord.longest_streak || newStreak;
        if (streakRecord.last_interview_date !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          if (streakRecord.last_interview_date === yesterday) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
          longestStreak = Math.max(longestStreak, newStreak);
          db.prepare('UPDATE user_streaks SET streak_count = ?, longest_streak = ?, last_interview_date = ? WHERE user_id = ?')
            .run(newStreak, longestStreak, today, userId);
        }
      }

      return res.json({
        message: 'Interview completed and evaluated successfully',
        feedback: evalRes
      });
    } catch (error: any) {
      console.error('Finish interview error:', error);
      return res.status(500).json({ error: 'Failed to generate interview feedback' });
    }
  }

  /**
   * Retrieves evaluated feedback details for an interview.
   */
  static async getFeedback(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const interviewId = Number(req.params.id);

      const interview = db.prepare('SELECT * FROM interviews WHERE id = ? AND user_id = ?').get(interviewId, userId) as any;
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      const fb = db.prepare('SELECT * FROM feedback WHERE interview_id = ?').get(interviewId) as any;
      if (!fb) {
        return res.status(404).json({ error: 'Feedback report not available yet for this interview' });
      }

      const questionsAnswers = db.prepare(`
        SELECT 
          q.question_text, 
          q.question_index, 
          q.category, 
          COALESCE(a.answer_text, '(No answer)') as answer_text, 
          COALESCE(a.time_spent_seconds, 0) as time_spent_seconds,
          COALESCE(a.correctness_score, 0) as correctness_score,
          COALESCE(a.feedback_text, '') as feedback_text,
          COALESCE(a.strengths_text, '') as strengths_text,
          COALESCE(a.weaknesses_text, '') as weaknesses_text,
          COALESCE(a.suggested_answer, '') as suggested_answer,
          COALESCE(a.ai_understanding, '') as ai_understanding
        FROM questions q
        LEFT JOIN answers a ON a.question_id = q.id
        WHERE q.interview_id = ?
        ORDER BY q.question_index ASC
      `).all(interviewId);

      return res.json({
        interview,
        questionsAnswers,
        feedback: {
          overallScore: fb.overall_score,
          technicalScore: fb.technical_score,
          communicationScore: fb.communication_score,
          confidenceScore: fb.confidence_score,
          problemSolvingScore: fb.problem_solving_score,
          grammarScore: fb.grammar_score,
          vocabularyScore: fb.vocabulary_score || fb.communication_score,
          leadershipScore: fb.leadership_score || 80,
          behaviorScore: fb.behavior_score || 82,
          accuracyScore: fb.accuracy_score || fb.technical_score,
          difficultyLevel: fb.difficulty_level || interview.difficulty,
          estimatedPerformance: fb.estimated_performance || (fb.overall_score >= 85 ? 'Strong Hire' : fb.overall_score >= 70 ? 'Hire' : 'Needs Practice'),
          strengths: JSON.parse(fb.strengths_json || '[]'),
          weaknesses: JSON.parse(fb.weaknesses_json || '[]'),
          suggestedAnswers: JSON.parse(fb.suggested_answers_json || '[]'),
          tips: JSON.parse(fb.tips_json || '[]'),
          created_at: fb.created_at
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve feedback report' });
    }
  }
}

