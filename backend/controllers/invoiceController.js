const pool = require('../config/db');

const getAllInvoices = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT i.invoice_id, i.invoice_number, i.resolution_date, i.created_at,
              sr.request_id, sr.equipment_no, sr.call_category, sr.visit_date, sr.running_hours, sr.symptom, sr.activity,
              e.customer_name, e.site_name, e.engine_model, e.kva_hp, e.contact_person, e.contact_number
       FROM invoices i
       JOIN service_request sr ON i.request_id = sr.request_id
       JOIN equipment e ON sr.equipment_no = e.equipment_no
       ORDER BY sr.visit_date DESC NULLS LAST`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const updateInvoice = async (req, res, next) => {
  const { id } = req.params;
  const { invoice_number, resolution_date } = req.body;
  try {
    if (!invoice_number) {
      return res.status(400).json({ error: 'invoice_number is required' });
    }
    const result = await pool.query(
      `UPDATE invoices SET invoice_number = $1, resolution_date = $2 WHERE invoice_id = $3 RETURNING *`,
      [invoice_number, resolution_date || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllInvoices, updateInvoice };
