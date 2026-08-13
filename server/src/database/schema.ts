import { db } from '../config/db';

export function initializeDatabaseSchema() {
  // Base Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      college TEXT DEFAULT '',
      skills TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      linkedin TEXT DEFAULT '',
      github TEXT DEFAULT '',
      portfolio TEXT DEFAULT '',
      target_role TEXT DEFAULT '',
      experience TEXT DEFAULT '',
      education TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      theme TEXT DEFAULT 'dark',
      notifications_enabled INTEGER DEFAULT 1,
      language TEXT DEFAULT 'en',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      streak_count INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      daily_goal_minutes INTEGER DEFAULT 20,
      last_interview_date TEXT DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      status TEXT DEFAULT 'in_progress',
      resume_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER NOT NULL,
      question_index INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      interview_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      answer_text TEXT NOT NULL,
      time_spent_seconds INTEGER DEFAULT 0,
      correctness_score INTEGER DEFAULT 0,
      feedback_text TEXT DEFAULT '',
      strengths_text TEXT DEFAULT '',
      weaknesses_text TEXT DEFAULT '',
      suggested_answer TEXT DEFAULT '',
      ai_understanding TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE,
      FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER UNIQUE NOT NULL,
      overall_score INTEGER NOT NULL,
      technical_score INTEGER NOT NULL,
      communication_score INTEGER NOT NULL,
      grammar_score INTEGER NOT NULL,
      confidence_score INTEGER NOT NULL,
      problem_solving_score INTEGER NOT NULL,
      accuracy_score INTEGER DEFAULT 80,
      vocabulary_score INTEGER DEFAULT 80,
      leadership_score INTEGER DEFAULT 80,
      behavior_score INTEGER DEFAULT 80,
      difficulty_level TEXT DEFAULT 'Medium',
      estimated_performance TEXT DEFAULT 'Hire',
      strengths_json TEXT NOT NULL,
      weaknesses_json TEXT NOT NULL,
      suggested_answers_json TEXT NOT NULL,
      tips_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resume_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      original_filename TEXT NOT NULL,
      ats_score INTEGER NOT NULL,
      summary TEXT NOT NULL,
      missing_skills_json TEXT NOT NULL,
      matched_skills_json TEXT DEFAULT '[]',
      recommended_skills_json TEXT NOT NULL,
      grammar_issues_json TEXT DEFAULT '[]',
      formatting_issues_json TEXT DEFAULT '[]',
      keyword_density_json TEXT DEFAULT '[]',
      experience_analysis_json TEXT DEFAULT '[]',
      education_analysis_json TEXT DEFAULT '[]',
      projects_analysis_json TEXT DEFAULT '[]',
      achievements_analysis_json TEXT DEFAULT '[]',
      project_suggestions_json TEXT NOT NULL,
      tips_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      user_agent TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Create Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_interviews_user ON interviews(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_questions_interview ON questions(interview_id, question_index);
    CREATE INDEX IF NOT EXISTS idx_answers_interview ON answers(interview_id, question_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_interview ON feedback(interview_id);
    CREATE INDEX IF NOT EXISTS idx_resume_user ON resume_analysis(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
  `);

  // Safe non-destructive column migrations for existing SQLite databases
  const safeAddColumn = (table: string, column: string, typeDef: string) => {
    try {
      const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      const colExists = tableInfo.some((col: any) => col.name === column);
      if (!colExists) {
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`).run();
      }
    } catch (e) {
      // Column may already exist or table is being created
    }
  };

  // User columns
  safeAddColumn('users', 'phone', "TEXT DEFAULT ''");
  safeAddColumn('users', 'linkedin', "TEXT DEFAULT ''");
  safeAddColumn('users', 'github', "TEXT DEFAULT ''");
  safeAddColumn('users', 'portfolio', "TEXT DEFAULT ''");
  safeAddColumn('users', 'target_role', "TEXT DEFAULT ''");
  safeAddColumn('users', 'experience', "TEXT DEFAULT ''");
  safeAddColumn('users', 'education', "TEXT DEFAULT ''");

  // Streak columns
  safeAddColumn('user_streaks', 'longest_streak', 'INTEGER DEFAULT 0');

  // Interview columns
  safeAddColumn('interviews', 'resume_id', 'INTEGER');

  // Feedback columns
  safeAddColumn('feedback', 'accuracy_score', 'INTEGER DEFAULT 80');
  safeAddColumn('feedback', 'vocabulary_score', 'INTEGER DEFAULT 80');
  safeAddColumn('feedback', 'leadership_score', 'INTEGER DEFAULT 80');
  safeAddColumn('feedback', 'behavior_score', 'INTEGER DEFAULT 80');
  safeAddColumn('feedback', 'difficulty_level', "TEXT DEFAULT 'Medium'");
  safeAddColumn('feedback', 'estimated_performance', "TEXT DEFAULT 'Hire'");

  // Resume columns
  safeAddColumn('resume_analysis', 'matched_skills_json', "TEXT DEFAULT '[]'");
  safeAddColumn('resume_analysis', 'grammar_issues_json', "TEXT DEFAULT '[]'");
  safeAddColumn('resume_analysis', 'formatting_issues_json', "TEXT DEFAULT '[]'");
  safeAddColumn('resume_analysis', 'keyword_density_json', "TEXT DEFAULT '[]'");
  safeAddColumn('resume_analysis', 'experience_analysis_json', "TEXT DEFAULT '[]'");
  safeAddColumn('resume_analysis', 'education_analysis_json', "TEXT DEFAULT '[]'");
  // Answers evaluation columns
  safeAddColumn('answers', 'correctness_score', 'INTEGER DEFAULT 0');
  safeAddColumn('answers', 'feedback_text', "TEXT DEFAULT ''");
  safeAddColumn('answers', 'strengths_text', "TEXT DEFAULT ''");
  safeAddColumn('answers', 'weaknesses_text', "TEXT DEFAULT ''");
  safeAddColumn('answers', 'suggested_answer', "TEXT DEFAULT ''");
  safeAddColumn('answers', 'ai_understanding', "TEXT DEFAULT ''");

  console.log('✅ Database schema and migrations initialized successfully');
}

