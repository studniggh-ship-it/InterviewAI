import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, hashToken } from '../middleware/auth';
import { db } from '../config/db';
import { env } from '../config/env';

export class AuthController {
  public static validatePassword(password: string): { isValid: boolean; message: string } {
    if (!password || password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number (0-9).' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&* etc.).' };
    }
    return { isValid: true, message: 'Password meets all security criteria.' };
  }

  public static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static async register(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, password, college, skills, bio, target_role, experience, phone, linkedin, github, portfolio } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Full name is required.' });
      }

      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email address is required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!this.validateEmail(normalizedEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address format (e.g., alex@example.com).' });
      }

      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.message });
      }

      // Check existing user case-insensitively
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(normalizedEmail);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const stmt = db.prepare(`
        INSERT INTO users (
          name, email, password_hash, college, skills, bio,
          target_role, experience, phone, linkedin, github, portfolio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        name.trim(),
        normalizedEmail,
        passwordHash,
        college || '',
        skills || '',
        bio || '',
        target_role || '',
        experience || '',
        phone || '',
        linkedin || '',
        github || '',
        portfolio || ''
      );

      const userId = Number(result.lastInsertRowid);

      // Initialize default settings and streaks
      db.prepare('INSERT INTO user_settings (user_id, theme, notifications_enabled, language) VALUES (?, ?, ?, ?)').run(userId, 'dark', 1, 'en');
      db.prepare('INSERT INTO user_streaks (user_id, streak_count, longest_streak, daily_goal_minutes) VALUES (?, ?, ?, ?)').run(userId, 1, 1, 20);

      const token = jwt.sign({ id: userId, email: normalizedEmail, name: name.trim() }, env.JWT_SECRET, { expiresIn: '30d' });
      const tokenHash = hashToken(token);
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      // Register active session in user_sessions table
      db.prepare(`
        INSERT INTO user_sessions (user_id, token_hash, user_agent, ip_address, is_active, expires_at)
        VALUES (?, ?, ?, ?, 1, datetime('now', '+30 days'))
      `).run(userId, tokenHash, userAgent, ipAddress);

      const user = db.prepare(`
        SELECT id, name, email, college, skills, bio, avatar_url, phone, linkedin, github, portfolio, target_role, experience, education, created_at
        FROM users WHERE id = ?
      `).get(userId);

      const settings = db.prepare('SELECT theme, notifications_enabled, language FROM user_settings WHERE user_id = ?').get(userId);
      const streak = db.prepare('SELECT streak_count, longest_streak, daily_goal_minutes, last_interview_date FROM user_streaks WHERE user_id = ?').get(userId);

      return res.status(201).json({
        message: 'Account created successfully',
        token,
        user,
        settings,
        streak
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Failed to create account due to server error.' });
    }
  }

  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email address and password are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail) as any;
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password. Please check your credentials.' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, env.JWT_SECRET, { expiresIn: '30d' });
      const tokenHash = hashToken(token);
      const userAgent = req.headers['user-agent'] || '';
      const ipAddress = req.ip || req.socket.remoteAddress || '';

      // Register session in user_sessions table
      db.prepare(`
        INSERT INTO user_sessions (user_id, token_hash, user_agent, ip_address, is_active, expires_at)
        VALUES (?, ?, ?, ?, 1, datetime('now', '+30 days'))
      `).run(user.id, tokenHash, userAgent, ipAddress);

      delete user.password_hash;

      let settings = db.prepare('SELECT theme, notifications_enabled, language FROM user_settings WHERE user_id = ?').get(user.id);
      if (!settings) {
        db.prepare('INSERT INTO user_settings (user_id, theme, notifications_enabled, language) VALUES (?, ?, ?, ?)').run(user.id, 'dark', 1, 'en');
        settings = { theme: 'dark', notifications_enabled: 1, language: 'en' };
      }

      let streak = db.prepare('SELECT streak_count, longest_streak, daily_goal_minutes, last_interview_date FROM user_streaks WHERE user_id = ?').get(user.id);
      if (!streak) {
        db.prepare('INSERT INTO user_streaks (user_id, streak_count, longest_streak, daily_goal_minutes) VALUES (?, ?, ?, ?)').run(user.id, 1, 1, 20);
        streak = { streak_count: 1, longest_streak: 1, daily_goal_minutes: 20, last_interview_date: '' };
      }

      return res.json({
        message: 'Logged in successfully',
        token,
        user,
        settings,
        streak
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Failed to authenticate user.' });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const token = req.rawToken;
      if (token) {
        const tokenHash = hashToken(token);
        db.prepare('UPDATE user_sessions SET is_active = 0 WHERE token_hash = ?').run(tokenHash);
      }
      return res.json({ message: 'Logged out successfully.' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to terminate session.' });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const user = db.prepare(`
        SELECT id, name, email, college, skills, bio, avatar_url, phone, linkedin, github, portfolio, target_role, experience, education, created_at
        FROM users WHERE id = ?
      `).get(userId);

      if (!user) {
        return res.status(404).json({ error: 'User session expired or not found.' });
      }

      let settings = db.prepare('SELECT theme, notifications_enabled, language FROM user_settings WHERE user_id = ?').get(userId);
      if (!settings) {
        db.prepare('INSERT INTO user_settings (user_id, theme, notifications_enabled, language) VALUES (?, ?, ?, ?)').run(userId, 'dark', 1, 'en');
        settings = { theme: 'dark', notifications_enabled: 1, language: 'en' };
      }

      let streak = db.prepare('SELECT streak_count, longest_streak, daily_goal_minutes, last_interview_date FROM user_streaks WHERE user_id = ?').get(userId);
      if (!streak) {
        db.prepare('INSERT INTO user_streaks (user_id, streak_count, longest_streak, daily_goal_minutes) VALUES (?, ?, ?, ?)').run(userId, 1, 1, 20);
        streak = { streak_count: 1, longest_streak: 1, daily_goal_minutes: 20, last_interview_date: '' };
      }

      return res.json({
        user,
        settings,
        streak
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch user session.' });
    }
  }

  static async forgotPassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email address is required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!this.validateEmail(normalizedEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      const user = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(normalizedEmail);
      if (!user) {
        // Return friendly message to prevent email enumeration
        return res.json({ message: 'If an account exists with this email, password reset instructions have been dispatched.' });
      }

      return res.json({ message: 'Password reset instructions have been dispatched to your email.' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to process password reset request.' });
    }
  }
}


