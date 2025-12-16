import { pool } from '../config/database.js';

export const getPrescriptions = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT p.*, u.name as created_by_name
      FROM prescriptions p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (p.patient_name ILIKE $${paramCount} OR p.doctor_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ prescriptions: result.rows });
  } catch (error) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, u.name as created_by_name
       FROM prescriptions p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json({ prescription: result.rows[0] });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPrescription = async (req, res) => {
  try {
    const { patient_name, doctor_name, prescription_date, file_path, notes } = req.body;

    if (!patient_name) {
      return res.status(400).json({ message: 'Patient name is required' });
    }

    const result = await pool.query(
      `INSERT INTO prescriptions (patient_name, doctor_name, prescription_date, file_path, notes, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      [patient_name, doctor_name, prescription_date, file_path, notes, req.user.id]
    );

    res.status(201).json({ prescription: result.rows[0] });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_name, doctor_name, prescription_date, file_path, status, notes } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (patient_name) {
      updates.push(`patient_name = $${paramCount++}`);
      values.push(patient_name);
    }
    if (doctor_name !== undefined) {
      updates.push(`doctor_name = $${paramCount++}`);
      values.push(doctor_name);
    }
    if (prescription_date) {
      updates.push(`prescription_date = $${paramCount++}`);
      values.push(prescription_date);
    }
    if (file_path !== undefined) {
      updates.push(`file_path = $${paramCount++}`);
      values.push(file_path);
    }
    if (status) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE prescriptions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json({ prescription: result.rows[0] });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM prescriptions WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

