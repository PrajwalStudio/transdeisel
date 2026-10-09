const pool = require('../config/db');

const getEquipmentHistory = async (req, res, next) => {
  try {
    const { equipment_no } = req.query;
    const params = [];
    let whereClause = '';

    if (equipment_no) {
      params.push(equipment_no);
      whereClause = `WHERE sr.equipment_no = $1`;
    }

    const result = await pool.query(
      `SELECT
          sr.request_id,
          sr.equipment_no,
          sr.call_category,
          sr.pm_service_period,
          e.customer_name,
          e.kva_hp,
          e.site_name,
          sr.visit_date,
          sr.running_hours,
          sr.symptom,
          sr.cause,
          sr.activity,
          sr.comments,
          so.order_id,
          i.invoice_number,
          i.resolution_date,
          COALESCE(so.approval_status, CASE WHEN i.invoice_id IS NOT NULL THEN 'Completed' ELSE 'Pending' END) as approval_status,
          so.completion_status
       FROM service_request sr
       JOIN equipment e ON sr.equipment_no = e.equipment_no
       LEFT JOIN service_orders so ON so.request_id = sr.request_id
       LEFT JOIN invoices i ON i.request_id = sr.request_id
       ${whereClause}
       ORDER BY sr.visit_date DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getPMDueReport = async (req, res, next) => {
  try {
    const result = await pool.query(
      `WITH pm_summary AS (
          WITH latest_pm AS (
              SELECT DISTINCT ON (equipment_no)
                  equipment_no,
                  visit_date AS last_service_date,
                  pm_service_period,
                  running_hours AS last_running_hours,
                  comments AS last_comment
              FROM service_request
              WHERE call_category IN ('Preventive Maintainance-B', 'Preventive Maintainance-C', 'Preventive Maintainance-D', 'Preventive Maintainance-E')
              ORDER BY equipment_no, visit_date DESC NULLS LAST
          )
          SELECT
              e.equipment_no,
              e.customer_name,
              e.site_name,
              e.engine_model,
              e.kva_hp,
              e.contact_person,
              e.contact_number,
              pm.last_service_date,
              pm.pm_service_period,
              pm.last_running_hours,
              pm.last_comment,
              CASE
                  WHEN pm.pm_service_period = '6 Months' THEN pm.last_service_date + INTERVAL '6 months'
                  WHEN pm.pm_service_period = '1 Year' THEN pm.last_service_date + INTERVAL '1 year'
                  ELSE NULL
              END AS next_service_date,
              CURRENT_DATE - pm.last_service_date AS days_since_service,
              CASE
                  WHEN pm.last_service_date IS NULL THEN 'OK'
                  WHEN pm.pm_service_period = '6 Months' THEN
                      CASE
                          WHEN CURRENT_DATE > pm.last_service_date + INTERVAL '6 months' THEN 'Overdue'
                          WHEN CURRENT_DATE > pm.last_service_date + INTERVAL '6 months' - INTERVAL '30 days' THEN 'Due Soon'
                          ELSE 'OK'
                      END
                  WHEN pm.pm_service_period = '1 Year' THEN
                      CASE
                          WHEN CURRENT_DATE > pm.last_service_date + INTERVAL '1 year' THEN 'Overdue'
                          WHEN CURRENT_DATE > pm.last_service_date + INTERVAL '1 year' - INTERVAL '30 days' THEN 'Due Soon'
                          ELSE 'OK'
                      END
                  ELSE
                      CASE
                          WHEN CURRENT_DATE - pm.last_service_date > 90 THEN 'Overdue'
                          WHEN CURRENT_DATE - pm.last_service_date > 60 THEN 'Due Soon'
                          ELSE 'OK'
                      END
              END AS pm_status
          FROM equipment e
          LEFT JOIN latest_pm pm ON e.equipment_no = pm.equipment_no
       )
       SELECT * FROM pm_summary
       ORDER BY
          CASE WHEN pm_status = 'Overdue' THEN 1 WHEN pm_status = 'Due Soon' THEN 2 ELSE 3 END,
          next_service_date ASC NULLS LAST`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getCallCategoryVisits = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const params = [];
    let dateFilter = '';

    if (startDate) {
      params.push(startDate);
      dateFilter += ` AND sr.visit_date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      dateFilter += ` AND sr.visit_date <= $${params.length}`;
    }

    // Count ALL service_requests (including pending) so the cards
    // reflect every recorded visit; approval_status is shown in the detail drill-down
    const query = `
      SELECT
          sr.call_category,
          COUNT(*) as visits,
          COUNT(CASE WHEN so.approval_status = 'Approved' OR i.invoice_id IS NOT NULL THEN 1 END) as approved_visits
       FROM service_request sr
       LEFT JOIN service_orders so ON so.request_id = sr.request_id
       LEFT JOIN invoices i ON i.request_id = sr.request_id
       WHERE sr.visit_date IS NOT NULL ${dateFilter}
       GROUP BY sr.call_category
       ORDER BY visits DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getCallCategoryDetails = async (req, res, next) => {
  try {
    const { category, startDate, endDate } = req.query;

    if (!category) {
      return res.status(400).json({ error: 'category query param is required' });
    }

    const params = [category];
    let dateFilter = '';

    if (startDate) {
      params.push(startDate);
      dateFilter += ` AND sr.visit_date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      dateFilter += ` AND sr.visit_date <= $${params.length}`;
    }

    const result = await pool.query(
      `SELECT
          sr.request_id,
          sr.equipment_no,
          sr.call_category,
          sr.pm_service_period,
          sr.visit_date,
          sr.running_hours,
          sr.symptom,
          sr.cause,
          sr.activity,
          sr.comments,
          e.customer_name,
          e.site_name,
          e.kva_hp,
          e.contact_person,
          e.contact_number,
          so.order_id,
          COALESCE(so.approval_status, CASE WHEN i.invoice_id IS NOT NULL THEN 'Completed' ELSE 'Pending' END) as approval_status,
          so.completion_status
       FROM service_request sr
       JOIN equipment e ON sr.equipment_no = e.equipment_no
       LEFT JOIN service_orders so ON so.request_id = sr.request_id
       LEFT JOIN invoices i ON i.request_id = sr.request_id
       WHERE sr.call_category = $1 ${dateFilter}
       ORDER BY sr.visit_date DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { getEquipmentHistory, getPMDueReport, getCallCategoryVisits, getCallCategoryDetails };
