import { pool } from '../config/database.js';

export const getBatches = async (req, res) => {
  try {
    const { medicine_id } = req.query;
    let query = `
      SELECT b.*, m.name as medicine_name, s.name as supplier_name
      FROM batches b
      LEFT JOIN medicines m ON b.medicine_id = m.id
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (medicine_id) {
      query += ` AND b.medicine_id = $${paramCount}`;
      params.push(medicine_id);
      paramCount++;
    }

    query += ' ORDER BY b.expiry_date ASC';

    const result = await pool.query(query, params);
    res.json({ batches: result.rows });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT b.*, m.name as medicine_name, s.name as supplier_name
       FROM batches b
       LEFT JOIN medicines m ON b.medicine_id = m.id
       LEFT JOIN suppliers s ON b.supplier_id = s.id
       WHERE b.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({ batch: result.rows[0] });
  } catch (error) {
    console.error('Get batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createBatch = async (req, res) => {
  try {
    const { medicine_id, batch_number, expiry_date, quantity, supplier_id, purchase_price } =
      req.body;

    if (!medicine_id || !batch_number || !expiry_date || quantity === undefined) {
      return res.status(400).json({
        message: 'Medicine ID, batch number, expiry date, and quantity are required',
      });
    }

    const result = await pool.query(
      'INSERT INTO batches (medicine_id, batch_number, expiry_date, quantity, supplier_id, purchase_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [medicine_id, batch_number, expiry_date, quantity, supplier_id, purchase_price]
    );

    res.status(201).json({ batch: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Batch number already exists for this medicine' });
    }
    console.error('Create batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_number, expiry_date, quantity, supplier_id, purchase_price } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (batch_number) {
      updates.push(`batch_number = $${paramCount++}`);
      values.push(batch_number);
    }
    if (expiry_date) {
      updates.push(`expiry_date = $${paramCount++}`);
      values.push(expiry_date);
    }
    if (quantity !== undefined) {
      updates.push(`quantity = $${paramCount++}`);
      values.push(quantity);
    }
    if (supplier_id !== undefined) {
      updates.push(`supplier_id = $${paramCount++}`);
      values.push(supplier_id);
    }
    if (purchase_price !== undefined) {
      updates.push(`purchase_price = $${paramCount++}`);
      values.push(purchase_price);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE batches SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({ batch: result.rows[0] });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM batches WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getExpiringBatches = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const result = await pool.query(
      `SELECT b.*, m.name as medicine_name
       FROM batches b
       JOIN medicines m ON b.medicine_id = m.id
       WHERE b.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
       AND b.quantity > 0
       ORDER BY b.expiry_date ASC`
    );

    res.json({ batches: result.rows });
  } catch (error) {
    console.error('Get expiring batches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

