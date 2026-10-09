const pool = require('../config/db');

const handleControllerError = (err, next) => {
  next(err);
};

const getAllOrders = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT so.*, e.equipment_no, sr.call_category, sr.visit_date,
              sr.symptom, sr.cause, sr.activity,
              sr.running_hours, sr.comments,
              e.customer_name, e.kva_hp, e.site_name, e.engine_model
       FROM service_orders so
       JOIN service_request sr ON so.request_id = sr.request_id
       JOIN equipment e ON sr.equipment_no = e.equipment_no
       WHERE sr.call_category != 'AMC Visit'::call_category_enum
       ORDER BY so.order_id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    handleControllerError(err, next);
  }
};

const updateOrder = async (req, res, next) => {
  const { invoice_number, resolution_date, approval_status, completion_status } = req.body;
  const orderId = req.params.id;

  try {
    if (invoice_number) {
      // Find the request_id associated with this order
      const orderRes = await pool.query(`SELECT request_id, approval_status FROM service_orders WHERE order_id = $1`, [orderId]);
      if (orderRes.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const { request_id, approval_status } = orderRes.rows[0];

      if (approval_status !== 'Approved') {
        return res.status(400).json({ error: 'Order must be approved before generating an invoice' });
      }

      // Insert into invoices (with optional resolution_date)
      await pool.query(
        `INSERT INTO invoices (request_id, invoice_number, resolution_date) VALUES ($1, $2, $3)`,
        [request_id, invoice_number, resolution_date || null]
      );

      // Delete from service_orders
      await pool.query(`DELETE FROM service_orders WHERE order_id = $1`, [orderId]);

      return res.json({ message: 'Order moved to invoices successfully' });
    } else if (approval_status || completion_status) {
      const updates = [];
      const params = [];
      if (approval_status) {
        params.push(approval_status);
        updates.push(`approval_status = $${params.length}`);
      }
      if (completion_status) {
        params.push(completion_status);
        updates.push(`completion_status = $${params.length}`);
      }
      params.push(orderId);

      const result = await pool.query(
        `UPDATE service_orders SET ${updates.join(', ')} WHERE order_id = $${params.length} RETURNING *`,
        params
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.json(result.rows[0]);
    } else {
      return res.status(400).json({ error: 'At least one field (invoice_number, approval_status, completion_status) is required' });
    }
  } catch (err) {
    handleControllerError(err, next);
  }
};

module.exports = { getAllOrders, updateOrder };
