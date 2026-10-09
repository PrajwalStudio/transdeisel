const pool = require('../config/db');

const handleControllerError = (err, next) => {
  if (err.code === '23505') {
    err.statusCode = 409;
    err.publicMessage = 'Duplicate value detected';
  } else if (err.code === '23503') {
    err.statusCode = 400;
    err.publicMessage = 'Referenced data does not exist';
  }
  next(err);
};

const getAllEquipment = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM equipment ORDER BY equipment_no');
    res.json(result.rows);
  } catch (err) {
    handleControllerError(err, next);
  }
};

const getEquipmentById = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM equipment WHERE equipment_no = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    handleControllerError(err, next);
  }
};

const createEquipment = async (req, res, next) => {
  const {
    equipment_no,
    manufacturing_date,
    warranty_status,
    warranty_start_date,
    warranty_end_date,
    in_amc,
    amc_start_date,
    amc_end_date,
    amc_location,
    amc_amount,
    po_number,
    po_date,
    engine_dgno,
    engine_make,
    engine_model,
    kva_hp,
    alternator_make,
    alternator_sno,
    alternator_model,
    customer_name,
    site_name,
    address,
    contact_person,
    contact_number,
    email,
  } = req.body;

  const status = warranty_status || 'Out of Warranty';
  const start = status === 'In Warranty' ? warranty_start_date : null;
  const end = status === 'In Warranty' ? warranty_end_date : null;

  const isAmc = Boolean(in_amc);
  const amcStart = isAmc ? (amc_start_date || null) : null;
  const amcEnd = isAmc ? (amc_end_date || null) : null;
  const location = isAmc ? (amc_location || 'Udupi') : null;
  const amount = isAmc && amc_amount !== '' && amc_amount !== null && amc_amount !== undefined ? parseFloat(amc_amount) : null;
  const poNum = isAmc && po_number ? po_number : null;
  const poDate = isAmc && po_date ? po_date : null;

  try {
    const result = await pool.query(
      `INSERT INTO equipment (
        equipment_no, manufacturing_date, warranty_status,
        warranty_start_date, warranty_end_date,
        in_amc, amc_start_date, amc_end_date, amc_location, amc_amount,
        po_number, po_date,
        engine_dgno, engine_make, engine_model, kva_hp,
        alternator_make, alternator_sno, alternator_model,
        customer_name, site_name, address,
        contact_person, contact_number, email
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
      ) RETURNING *`,
      [
        equipment_no,
        manufacturing_date,
        status,
        start,
        end,
        isAmc,
        amcStart,
        amcEnd,
        location,
        amount,
        poNum,
        poDate,
        engine_dgno,
        engine_make,
        engine_model,
        kva_hp,
        alternator_make,
        alternator_sno,
        alternator_model,
        customer_name,
        site_name,
        address,
        contact_person,
        contact_number,
        email,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    handleControllerError(err, next);
  }
};

const updateEquipment = async (req, res, next) => {
  const {
    manufacturing_date,
    warranty_status,
    warranty_start_date,
    warranty_end_date,
    in_amc,
    amc_start_date,
    amc_end_date,
    amc_location,
    amc_amount,
    po_number,
    po_date,
    engine_dgno,
    engine_make,
    engine_model,
    kva_hp,
    alternator_make,
    alternator_sno,
    alternator_model,
    customer_name,
    site_name,
    address,
    contact_person,
    contact_number,
    email,
  } = req.body;

  const status = warranty_status || 'Out of Warranty';
  const start = status === 'In Warranty' ? (warranty_start_date || null) : null;
  const end = status === 'In Warranty' ? (warranty_end_date || null) : null;

  const isAmc = Boolean(in_amc);
  const amcStart = isAmc ? (amc_start_date || null) : null;
  const amcEnd = isAmc ? (amc_end_date || null) : null;
  const location = isAmc ? (amc_location || 'Udupi') : null;
  const amount = isAmc && amc_amount !== '' && amc_amount !== null && amc_amount !== undefined ? parseFloat(amc_amount) : null;
  const poNum = isAmc && po_number ? po_number : null;
  const poDate = isAmc && po_date ? po_date : null;

  try {
    const result = await pool.query(
      `UPDATE equipment
       SET manufacturing_date = $1,
           warranty_status = $2,
           warranty_start_date = $3,
           warranty_end_date = $4,
           in_amc = $5,
           amc_start_date = $6,
           amc_end_date = $7,
           amc_location = $8,
           amc_amount = $9,
           po_number = $10,
           po_date = $11,
           engine_dgno = $12,
           engine_make = $13,
           engine_model = $14,
           kva_hp = $15,
           alternator_make = $16,
           alternator_sno = $17,
           alternator_model = $18,
           customer_name = $19,
           site_name = $20,
           address = $21,
           contact_person = $22,
           contact_number = $23,
           email = $24
       WHERE equipment_no = $25 RETURNING *`,
      [
        manufacturing_date || null,
        status,
        start,
        end,
        isAmc,
        amcStart,
        amcEnd,
        location,
        amount,
        poNum,
        poDate,
        engine_dgno || null,
        engine_make || null,
        engine_model || null,
        kva_hp || null,
        alternator_make || null,
        alternator_sno || null,
        alternator_model || null,
        customer_name || null,
        site_name || null,
        address || null,
        contact_person || null,
        contact_number || null,
        email || null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    handleControllerError(err, next);
  }
};

const updateWarranty = async (req, res, next) => {
  const { warranty_status, warranty_start_date, warranty_end_date, in_amc, amc_start_date, amc_end_date, amc_location, amc_amount, po_number, po_date } = req.body;
  const start = warranty_status === 'In Warranty' ? warranty_start_date : null;
  const end = warranty_status === 'In Warranty' ? warranty_end_date : null;

  const isAmc = Boolean(in_amc);
  const amcStart = isAmc ? (amc_start_date || null) : null;
  const amcEnd = isAmc ? (amc_end_date || null) : null;
  const location = isAmc ? (amc_location || 'Udupi') : null;
  const amount = isAmc && amc_amount !== '' && amc_amount !== null && amc_amount !== undefined ? parseFloat(amc_amount) : null;
  const poNum = isAmc && po_number ? po_number : null;
  const poDate = isAmc && po_date ? po_date : null;

  try {
    const result = await pool.query(
      `UPDATE equipment
       SET warranty_status = $1,
           warranty_start_date = $2,
           warranty_end_date = $3,
           in_amc = $4,
           amc_start_date = $5,
           amc_end_date = $6,
           amc_location = $7,
           amc_amount = $8,
           po_number = $9,
           po_date = $10
       WHERE equipment_no = $11 RETURNING *`,
      [warranty_status, start, end, isAmc, amcStart, amcEnd, location, amount, poNum, poDate, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    handleControllerError(err, next);
  }
};

const deleteEquipment = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM equipment WHERE equipment_no = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json({ message: 'Equipment deleted successfully', deleted: result.rows[0] });
  } catch (err) {
    handleControllerError(err, next);
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  updateWarranty,
  deleteEquipment,
};

