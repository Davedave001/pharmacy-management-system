import { pool } from '../config/database.js';

export const getMedicines = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM medicines WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);
    res.json({ medicines: result.rows });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM medicines WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // Get batches for this medicine
    const batches = await pool.query(
      'SELECT * FROM batches WHERE medicine_id = $1 ORDER BY expiry_date ASC',
      [id]
    );

    res.json({
      medicine: result.rows[0],
      batches: batches.rows,
    });
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createMedicine = async (req, res) => {
  try {
    const { name, category, price, prescription_required, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const result = await pool.query(
      'INSERT INTO medicines (name, category, price, prescription_required, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, category, price, prescription_required || false, description]
    );

    res.status(201).json({ medicine: result.rows[0] });
  } catch (error) {
    console.error('Create medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, prescription_required, description } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      values.push(category);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (prescription_required !== undefined) {
      updates.push(`prescription_required = $${paramCount++}`);
      values.push(prescription_required);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE medicines SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ medicine: result.rows[0] });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM medicines WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLowStockMedicines = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const result = await pool.query(
      `SELECT m.*, COALESCE(SUM(b.quantity), 0) as total_stock
       FROM medicines m
       LEFT JOIN batches b ON m.id = b.medicine_id
       WHERE b.expiry_date > CURRENT_DATE OR b.expiry_date IS NULL
       GROUP BY m.id
       HAVING COALESCE(SUM(b.quantity), 0) <= $1
       ORDER BY total_stock ASC`,
      [threshold]
    );

    res.json({ medicines: result.rows });
  } catch (error) {
    console.error('Get low stock medicines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

