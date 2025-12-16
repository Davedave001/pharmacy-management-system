import { pool } from '../config/database.js';

export const getSales = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await pool.query(
      `SELECT s.*, u.name as sold_by_name, p.patient_name
       FROM sales s
       LEFT JOIN users u ON s.sold_by = u.id
       LEFT JOIN prescriptions p ON s.prescription_id = p.id
       ORDER BY s.sale_date DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ sales: result.rows });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get sale details
    const saleResult = await pool.query(
      `SELECT s.*, u.name as sold_by_name, p.patient_name
       FROM sales s
       LEFT JOIN users u ON s.sold_by = u.id
       LEFT JOIN prescriptions p ON s.prescription_id = p.id
       WHERE s.id = $1`,
      [id]
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Get sale items
    const itemsResult = await pool.query(
      `SELECT si.*, m.name as medicine_name, b.batch_number
       FROM sale_items si
       JOIN medicines m ON si.medicine_id = m.id
       LEFT JOIN batches b ON si.batch_id = b.id
       WHERE si.sale_id = $1`,
      [id]
    );

    res.json({
      sale: saleResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createSale = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      items,
      prescription_id,
      payment_method,
      discount_amount = 0,
      tax_rate = 0,
      notes,
    } = req.body;

    if (!items || items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Sale items are required' });
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
    }

    const tax_amount = subtotal * (tax_rate / 100);
    const total_amount = subtotal + tax_amount - discount_amount;

    // Create sale record
    const saleResult = await client.query(
      `INSERT INTO sales (total_amount, tax_amount, discount_amount, payment_method, prescription_id, sold_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [total_amount, tax_amount, discount_amount, payment_method, prescription_id, req.user.id, notes]
    );

    const saleId = saleResult.rows[0].id;

    // Create sale items and update batch quantities
    for (const item of items) {
      // Insert sale item
      await client.query(
        `INSERT INTO sale_items (sale_id, batch_id, medicine_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          saleId,
          item.batch_id,
          item.medicine_id,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price,
        ]
      );

      // Update batch quantity
      if (item.batch_id) {
        await client.query(
          'UPDATE batches SET quantity = quantity - $1 WHERE id = $2',
          [item.quantity, item.batch_id]
        );
      }
    }

    // Update prescription status if provided
    if (prescription_id) {
      await client.query("UPDATE prescriptions SET status = 'fulfilled' WHERE id = $1", [
        prescription_id,
      ]);
    }

    await client.query('COMMIT');

    // Fetch complete sale with items
    const saleResult = await pool.query(
      `SELECT s.*, u.name as sold_by_name, p.patient_name
       FROM sales s
       LEFT JOIN users u ON s.sold_by = u.id
       LEFT JOIN prescriptions p ON s.prescription_id = p.id
       WHERE s.id = $1`,
      [saleId]
    );

    const itemsResult = await pool.query(
      `SELECT si.*, m.name as medicine_name, b.batch_number
       FROM sale_items si
       JOIN medicines m ON si.medicine_id = m.id
       LEFT JOIN batches b ON si.batch_id = b.id
       WHERE si.sale_id = $1`,
      [saleId]
    );

    res.status(201).json({
      sale: saleResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create sale error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, notes } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (payment_method) {
      updates.push(`payment_method = $${paramCount++}`);
      values.push(payment_method);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE sales SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json({ sale: result.rows[0] });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteSale = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get sale items to restore batch quantities
    const itemsResult = await client.query(
      'SELECT batch_id, quantity FROM sale_items WHERE sale_id = $1',
      [id]
    );

    // Restore batch quantities
    for (const item of itemsResult.rows) {
      if (item.batch_id) {
        await client.query('UPDATE batches SET quantity = quantity + $1 WHERE id = $2', [
          item.quantity,
          item.batch_id,
        ]);
      }
    }

    // Delete sale (cascade will delete items)
    const result = await client.query('DELETE FROM sales WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Sale not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete sale error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

export const getSalesByDateRange = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const result = await pool.query(
      `SELECT s.*, u.name as sold_by_name
       FROM sales s
       LEFT JOIN users u ON s.sold_by = u.id
       WHERE s.sale_date BETWEEN $1 AND $2
       ORDER BY s.sale_date DESC`,
      [start_date, end_date]
    );

    res.json({ sales: result.rows });
  } catch (error) {
    console.error('Get sales by date range error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

