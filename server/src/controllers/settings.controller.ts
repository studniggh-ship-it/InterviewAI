import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/db';

export class SettingsController {
  static async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      let settings = db.prepare('SELECT theme, notifications_enabled, language FROM user_settings WHERE user_id = ?').get(userId);

      if (!settings) {
        db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(userId);
        settings = { theme: 'dark', notifications_enabled: 1, language: 'en' };
      }

      return res.json(settings);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { theme, notifications_enabled, language } = req.body;

      db.prepare(`
        UPDATE user_settings
        SET theme = COALESCE(?, theme),
            notifications_enabled = COALESCE(?, notifications_enabled),
            language = COALESCE(?, language),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        theme || null,
        notifications_enabled !== undefined ? (notifications_enabled ? 1 : 0) : null,
        language || null,
        userId
      );

      const updated = db.prepare('SELECT theme, notifications_enabled, language FROM user_settings WHERE user_id = ?').get(userId);

      return res.json({
        message: 'Settings updated successfully',
        settings: updated
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update settings' });
    }
  }
}
