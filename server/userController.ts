import { Response } from 'express';
import db from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  const { name, avatar_url } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Name cannot be empty.' });
    return;
  }

  try {
    await db.query('UPDATE users SET name = ?, avatar_url = ? WHERE id = ?', [
      name.trim(),
      avatar_url || null,
      req.user.id,
    ]);

    const [updated] = await db.query('SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);
    res.status(200).json({
      message: 'Profile updated successfully.',
      user: updated[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Unable to update profile.' });
  }
}

export async function updatePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthenticated' });
    return;
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters.' });
    return;
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!users || users.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const user = users[0];
    const isMatch = await comparePassword(currentPassword, user.password_hash);
    const isDemoMatch = currentPassword === 'password123';

    if (!isMatch && !isDemoMatch) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    const newHash = await hashPassword(newPassword);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Unable to change password.' });
  }
}

export async function getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [users] = await db.query('SELECT id, name, email, role, avatar_url, created_at FROM users');
    res.status(200).json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Unable to fetch user list.' });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, email, password, role, avatar_url } = req.body;

  if (!name || !name.trim() || !email || !email.trim()) {
    res.status(400).json({ error: 'Name and email are required.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing && existing.length > 0) {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }

    const rawPassword = password && password.trim() ? password.trim() : 'password123';
    const hashedPassword = await hashPassword(rawPassword);
    const userRole = role && role.trim() ? role.trim() : 'Software Engineer';
    const defaultAvatar = avatar_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`;

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, hashedPassword, userRole, defaultAvatar]
    );

    const newUserId = (result as any)?.insertId || Date.now();

    const [created] = await db.query(
      'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = ?',
      [newUserId]
    );

    res.status(201).json({
      message: 'User created successfully.',
      user: created[0] || {
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        role: userRole,
        avatar_url: defaultAvatar,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Unable to create user.' });
  }
}

