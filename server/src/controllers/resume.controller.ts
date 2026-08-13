import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/db';
import { ResumeService } from '../services/resume.service';
import { GeminiService } from '../services/gemini.service';

export class ResumeController {
  static async analyzeResume(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      if (!req.file) {
        return res.status(400).json({ error: 'PDF resume file is required' });
      }

      const originalFilename = req.file.originalname || 'resume.pdf';

      // Extract text from PDF buffer
      const resumeText = await ResumeService.extractTextFromPdfBuffer(req.file.buffer);

      // Perform Gemini ATS Analysis
      const analysis = await GeminiService.analyzeResume(resumeText);

      // Store analysis result in SQLite database
      const stmt = db.prepare(`
        INSERT INTO resume_analysis (
          user_id, original_filename, ats_score, summary,
          missing_skills_json, matched_skills_json, recommended_skills_json,
          grammar_issues_json, formatting_issues_json, keyword_density_json,
          experience_analysis_json, education_analysis_json, projects_analysis_json,
          achievements_analysis_json, project_suggestions_json, tips_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        userId,
        originalFilename,
        analysis.atsScore,
        analysis.summary,
        JSON.stringify(analysis.missingSkills),
        JSON.stringify(analysis.matchedSkills),
        JSON.stringify(analysis.recommendedSkills),
        JSON.stringify(analysis.grammarIssues),
        JSON.stringify(analysis.formattingIssues),
        JSON.stringify(analysis.keywordDensity),
        JSON.stringify(analysis.experienceAnalysis),
        JSON.stringify(analysis.educationAnalysis),
        JSON.stringify(analysis.projectsAnalysis),
        JSON.stringify(analysis.achievementsAnalysis),
        JSON.stringify(analysis.projectSuggestions),
        JSON.stringify(analysis.tips)
      );

      return res.status(201).json({
        id: Number(result.lastInsertRowid),
        originalFilename,
        atsScore: analysis.atsScore,
        summary: analysis.summary,
        missingSkills: analysis.missingSkills,
        matchedSkills: analysis.matchedSkills,
        recommendedSkills: analysis.recommendedSkills,
        grammarIssues: analysis.grammarIssues,
        formattingIssues: analysis.formattingIssues,
        keywordDensity: analysis.keywordDensity,
        experienceAnalysis: analysis.experienceAnalysis,
        educationAnalysis: analysis.educationAnalysis,
        projectsAnalysis: analysis.projectsAnalysis,
        achievementsAnalysis: analysis.achievementsAnalysis,
        projectSuggestions: analysis.projectSuggestions,
        tips: analysis.tips,
        created_at: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Resume analysis error:', error);
      return res.status(500).json({ error: error.message || 'Failed to analyze resume PDF' });
    }
  }

  static async getLatestAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const row = db.prepare('SELECT * FROM resume_analysis WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId) as any;

      if (!row) {
        return res.json({ analysis: null });
      }

      return res.json({
        analysis: {
          id: row.id,
          originalFilename: row.original_filename,
          atsScore: row.ats_score,
          summary: row.summary,
          missingSkills: JSON.parse(row.missing_skills_json || '[]'),
          matchedSkills: JSON.parse(row.matched_skills_json || '[]'),
          recommendedSkills: JSON.parse(row.recommended_skills_json || '[]'),
          grammarIssues: JSON.parse(row.grammar_issues_json || '[]'),
          formattingIssues: JSON.parse(row.formatting_issues_json || '[]'),
          keywordDensity: JSON.parse(row.keyword_density_json || '[]'),
          experienceAnalysis: JSON.parse(row.experience_analysis_json || '[]'),
          educationAnalysis: JSON.parse(row.education_analysis_json || '[]'),
          projectsAnalysis: JSON.parse(row.projects_analysis_json || '[]'),
          achievementsAnalysis: JSON.parse(row.achievements_analysis_json || '[]'),
          projectSuggestions: JSON.parse(row.project_suggestions_json || '[]'),
          tips: JSON.parse(row.tips_json || '[]'),
          created_at: row.created_at
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve resume analysis report' });
    }
  }
}

