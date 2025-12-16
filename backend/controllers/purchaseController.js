import { pool } from '../config/database.js';

export const getPurchases = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, s.name as supplier_name, u.name as created_by_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN users u ON p.created_by = u.id
       ORDER BY p.purchase_date DESC`
    );
    res.json({ purchases: result.rows });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchaseResult = await pool.query(
      `SELECT p.*, s.name as supplier_name, u.name as created_by_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (purchaseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    const itemsResult = await pool.query(
      `SELECT pi.*, m.name as medicine_name
       FROM purchase_items pi
       LEFT JOIN medicines m ON pi.medicine_id = m.id
       WHERE pi.purchase_id = $1`,
      [id]
    );

    res.json({
      purchase: purchaseResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPurchase = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { supplier_id, purchase_date, invoice_number, items, status } = req.body;

    if (!items || items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Purchase items are required' });
    }

    // Calculate total
    let total_amount = 0;
    for (const item of items) {
      total_amount += item.quantity * item.unit_price;
    }

    // Create purchase record
    const purchaseResult = await client.query(
      `INSERT INTO purchases (supplier_id, purchase_date, total_amount, invoice_number, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [supplier_id, purchase_date, total_amount, invoice_number, status || 'pending', req.user.id]
    );

    const purchaseId = purchaseResult.rows[0].id;

    // Create purchase items and batches
    for (const item of items) {
      // Insert purchase item
      await client.query(
        `INSERT INTO purchase_items (purchase_id, medicine_id, batch_number, expiry_date, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          purchaseId,
          item.medicine_id,
          item.batch_number,
          item.expiry_date,
          item.quantity,
          item.unit_price,
          item.quantity * item.unit_price,
        ]
      );

      // Create or update batch if status is 'received'
      if (status === 'received') {
        const batchCheck = await client.query(
          'SELECT id FROM batches WHERE medicine_id = $1 AND batch_number = $2',
          [item.medicine_id, item.batch_number]
        );

        if (batchCheck.rows.length > 0) {
          // Update existing batch
          await client.query(
            'UPDATE batches SET quantity = quantity + $1, expiry_date = $2, purchase_price = $3 WHERE id = $4',
            [item.quantity, item.expiry_date, item.unit_price, batchCheck.rows[0].id]
          );
        } else {
          // Create new batch
          await client.query(
            `INSERT INTO batches (medicine_id, batch_number, expiry_date, quantity, supplier_id, purchase_price)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [item.medicine_id, item.batch_number, item.expiry_date, item.quantity, supplier_id, item.unit_price]
          );
        }
      }
    }

    await client.query('COMMIT');

    // Fetch complete purchase with items
    const purchaseResult = await pool.query(
      `SELECT p.*, s.name as supplier_name, u.name as created_by_name
       FROM purchases p
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [purchaseId]
    );

    const itemsResult = await pool.query(
      `SELECT pi.*, m.name as medicine_name
       FROM purchase_items pi
       LEFT JOIN medicines m ON pi.medicine_id = m.id
       WHERE pi.purchase_id = $1`,
      [purchaseId]
    );

    res.status(201).json({
      purchase: purchaseResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

export const updatePurchase = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status } = req.body;

    // If status is being changed to 'received', create/update batches
    if (status === 'received') {
      const itemsResult = await client.query(
        'SELECT * FROM purchase_items WHERE purchase_id = $1',
        [id]
      );

      const purchaseResult = await client.query('SELECT supplier_id FROM purchases WHERE id = $1', [
        id,
      ]);
      const supplier_id = purchaseResult.rows[0]?.supplier_id;

      for (const item of itemsResult.rows) {
        const batchCheck = await client.query(
          'SELECT id FROM batches WHERE medicine_id = $1 AND batch_number = $2',
          [item.medicine_id, item.batch_number]
        );

        if (batchCheck.rows.length > 0) {
          await client.query(
            'UPDATE batches SET quantity = quantity + $1, expiry_date = $2, purchase_price = $3 WHERE id = $4',
            [item.quantity, item.expiry_date, item.unit_price, batchCheck.rows[0].id]
          );
        } else {
          await client.query(
            `INSERT INTO batches (medicine_id, batch_number, expiry_date, quantity, supplier_id, purchase_price)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              item.medicine_id,
              item.batch_number,
              item.expiry_date,
              item.quantity,
              supplier_id,
              item.unit_price,
            ]
          );
        }
      }
    }

    const result = await client.query(
      `UPDATE purchases SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Purchase not found' });
    }

    await client.query('COMMIT');
    res.json({ purchase: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM purchases WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

