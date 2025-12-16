import { pool } from '../config/database.js';

export const getSalesReport = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;

    let dateFormat, groupByClause;
    switch (group_by) {
      case 'day':
        dateFormat = "TO_CHAR(sale_date, 'YYYY-MM-DD')";
        groupByClause = "TO_CHAR(sale_date, 'YYYY-MM-DD')";
        break;
      case 'week':
        dateFormat = "TO_CHAR(sale_date, 'YYYY-WW')";
        groupByClause = "TO_CHAR(sale_date, 'YYYY-WW')";
        break;
      case 'month':
        dateFormat = "TO_CHAR(sale_date, 'YYYY-MM')";
        groupByClause = "TO_CHAR(sale_date, 'YYYY-MM')";
        break;
      default:
        dateFormat = "TO_CHAR(sale_date, 'YYYY-MM-DD')";
        groupByClause = "TO_CHAR(sale_date, 'YYYY-MM-DD')";
    }

    let query = `
      SELECT ${dateFormat} as period,
             COUNT(*) as total_sales,
             SUM(total_amount) as total_revenue,
             SUM(tax_amount) as total_tax,
             SUM(discount_amount) as total_discount
      FROM sales
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND sale_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND sale_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` GROUP BY ${groupByClause} ORDER BY period DESC`;

    const result = await pool.query(query, params);
    res.json({ report: result.rows });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInventoryReport = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.name, m.category, m.price,
              COALESCE(SUM(b.quantity), 0) as total_stock,
              COUNT(DISTINCT b.id) as batch_count
       FROM medicines m
       LEFT JOIN batches b ON m.id = b.medicine_id AND b.expiry_date > CURRENT_DATE
       GROUP BY m.id, m.name, m.category, m.price
       ORDER BY m.name ASC`
    );

    res.json({ inventory: result.rows });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getExpiryReport = async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const result = await pool.query(
      `SELECT b.*, m.name as medicine_name, m.category
       FROM batches b
       JOIN medicines m ON b.medicine_id = m.id
       WHERE b.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
       AND b.quantity > 0
       ORDER BY b.expiry_date ASC`
    );

    res.json({ batches: result.rows });
  } catch (error) {
    console.error('Get expiry report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    // Today's sales
    const todaySales = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM sales
       WHERE DATE(sale_date) = CURRENT_DATE`
    );

    // This month's sales
    const monthSales = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM sales
       WHERE DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE)`
    );

    // Low stock medicines
    const lowStock = await pool.query(
      `SELECT COUNT(DISTINCT m.id) as count
       FROM medicines m
       LEFT JOIN batches b ON m.id = b.medicine_id
       WHERE b.expiry_date > CURRENT_DATE OR b.expiry_date IS NULL
       GROUP BY m.id
       HAVING COALESCE(SUM(b.quantity), 0) <= 10`
    );

    // Expiring batches (next 30 days)
    const expiring = await pool.query(
      `SELECT COUNT(*) as count
       FROM batches
       WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
       AND quantity > 0`
    );

    // Pending prescriptions
    const pendingPrescriptions = await pool.query(
      `SELECT COUNT(*) as count
       FROM prescriptions
       WHERE status = 'pending'`
    );

    res.json({
      todaySales: todaySales.rows[0],
      monthSales: monthSales.rows[0],
      lowStockCount: parseInt(lowStock.rows.length),
      expiringCount: parseInt(expiring.rows[0].count),
      pendingPrescriptions: parseInt(pendingPrescriptions.rows[0].count),
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

