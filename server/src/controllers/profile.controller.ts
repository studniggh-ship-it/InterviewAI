import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/db';

export class ProfileController {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const user = db.prepare(`
        SELECT id, name, email, college, skills, bio, avatar_url, phone, linkedin, github, portfolio, target_role, experience, education, created_at, updated_at
        FROM users WHERE id = ?
      `).get(userId);

      if (!user) {
        return res.status(404).json({ error: 'User profile not found' });
      }
      return res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ error: 'Failed to retrieve profile' });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const {
        name,
        college,
        skills,
        bio,
        avatar_url,
        phone,
        linkedin,
        github,
        portfolio,
        target_role,
        experience,
        education
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Full Name cannot be empty' });
      }

      db.prepare(`
        UPDATE users
        SET name = ?,
            college = ?,
            skills = ?,
            bio = ?,
            avatar_url = COALESCE(?, avatar_url),
            phone = ?,
            linkedin = ?,
            github = ?,
            portfolio = ?,
            target_role = ?,
            experience = ?,
            education = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        name.trim(),
        college || '',
        skills || '',
        bio || '',
        avatar_url || null,
        phone || '',
        linkedin || '',
        github || '',
        portfolio || '',
        target_role || '',
        experience || '',
        education || college || '',
        userId
      );

      const updatedUser = db.prepare(`
        SELECT id, name, email, college, skills, bio, avatar_url, phone, linkedin, github, portfolio, target_role, experience, education, created_at, updated_at
        FROM users WHERE id = ?
      `).get(userId);

      return res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  static async uploadAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      if (!req.file) {
        return res.status(400).json({ error: 'No avatar image file uploaded' });
      }

      const mimeType = req.file.mimetype;
      const base64Data = req.file.buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      db.prepare('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(dataUri, userId);

      return res.json({
        message: 'Profile photo updated successfully',
        avatar_url: dataUri
      });
    } catch (error) {
      console.error('Upload avatar error:', error);
      return res.status(500).json({ error: 'Failed to upload profile photo' });
    }
  }
}

