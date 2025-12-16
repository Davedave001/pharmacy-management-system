import { pool } from '../config/database.js';

export const getNotifications = async (req, res) => {
  try {
    const { unread_only = false } = req.query;
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (req.user.role !== 'admin') {
      query += ` AND (user_id = $${paramCount} OR user_id IS NULL)`;
      params.push(req.user.id);
      paramCount++;
    }

    if (unread_only === 'true') {
      query += ` AND read = false`;
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await pool.query(query, params);
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE notifications SET read = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { type, title, message, user_id } = req.body;

    if (!type || !title) {
      return res.status(400).json({ message: 'Type and title are required' });
    }

    const result = await pool.query(
      'INSERT INTO notifications (type, title, message, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [type, title, message, user_id]
    );

    res.status(201).json({ notification: result.rows[0] });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

