const pool = require('../config/db');

const getMonthlyAmcVisits = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    // Default to current month/year if not provided
    const targetMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const query = `
      SELECT 
        e.equipment_no, 
        e.customer_name, 
        e.site_name, 
        e.amc_location, 
        e.amc_start_date, 
        e.amc_end_date,
        e.engine_dgno,
        e.engine_make,
        e.engine_model,
        e.kva_hp,
        sr.request_id as visit_id,
        sr.visit_date,
        sr.comments as visit_comments
      FROM equipment e
      LEFT JOIN service_request sr 
        ON e.equipment_no = sr.equipment_no 
        AND sr.call_category = 'AMC Visit'
        AND EXTRACT(MONTH FROM sr.visit_date) = $1
        AND EXTRACT(YEAR FROM sr.visit_date) = $2
      WHERE e.in_amc = true
      ORDER BY e.customer_name, e.equipment_no
    `;
    const result = await pool.query(query, [targetMonth, targetYear]);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMonthlyAmcVisits,
};
