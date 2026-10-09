const pool = require('../config/db');

const handleControllerError = (err, next) => {
  if (err.code === '23503') {
    err.statusCode = 400;
    err.publicMessage = 'Invalid equipment reference';
  }
  next(err);
};

const getAllRequests = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT sr.*, e.customer_name, e.kva_hp, e.site_name, e.engine_model, so.approval_status
       FROM service_request sr
       JOIN equipment e ON sr.equipment_no = e.equipment_no
       LEFT JOIN service_orders so ON sr.request_id = so.request_id
       ORDER BY sr.request_id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    handleControllerError(err, next);
  }
};

const createRequest = async (req, res, next) => {
  const { equipment_no, call_category, pm_service_period, visit_date, running_hours, symptom, cause, activity, comments } = req.body;
  const client = await pool.connect();

  const period = call_category?.startsWith('Preventive Maintainance') ? (pm_service_period || null) : null;

  try {
    await client.query('BEGIN');

    const reqResult = await client.query(
      `INSERT INTO service_request (equipment_no, call_category, pm_service_period, visit_date, running_hours, symptom, cause, activity, comments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [equipment_no, call_category, period, visit_date, running_hours, symptom, cause, activity, comments]
    );
    const newRequest = reqResult.rows[0];

    await client.query(`INSERT INTO service_orders (request_id) VALUES ($1)`, [newRequest.request_id]);

    await client.query('COMMIT');
    res.status(201).json(newRequest);
  } catch (err) {
    await client.query('ROLLBACK');
    handleControllerError(err, next);
  } finally {
    client.release();
  }
};

const updateRequest = async (req, res, next) => {
  const { call_category, pm_service_period, visit_date, running_hours, symptom, cause, activity, comments } = req.body;
  const requestId = req.params.id;

  const period = call_category?.startsWith('Preventive Maintainance') ? (pm_service_period || null) : null;

  try {
    const result = await pool.query(
      `UPDATE service_request 
       SET call_category = COALESCE($1, call_category),
           pm_service_period = $2,
           visit_date = COALESCE($3, visit_date),
           running_hours = COALESCE($4, running_hours),
           symptom = COALESCE($5, symptom),
           cause = COALESCE($6, cause),
           activity = COALESCE($7, activity),
           comments = COALESCE($8, comments)
       WHERE request_id = $9 RETURNING *`,
      [call_category, period, visit_date, running_hours, symptom, cause, activity, comments, requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    handleControllerError(err, next);
  }
};

const deleteRequest = async (req, res, next) => {
  const requestId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM service_request WHERE request_id = $1 RETURNING *',
      [requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    res.json({ message: 'Service request deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    handleControllerError(err, next);
  }
};

module.exports = { getAllRequests, createRequest, updateRequest, deleteRequest };
