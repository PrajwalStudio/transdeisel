const { body, param } = require('express-validator');
const { normalizeWhitespace } = require('../utils/sanitize');

const emptyToNull = (value) => (value === '' || value === undefined ? null : value);

const textField = (field, max) =>
  body(field)
    .optional({ values: 'falsy' })
    .customSanitizer((value) => (value ? normalizeWhitespace(value) : null))
    .if((val) => val !== null && val !== undefined)
    .isLength({ max })
    .withMessage(`${field} must be at most ${max} characters`);

const optionalDateField = (field) =>
  body(field)
    .optional({ values: 'falsy' })
    .customSanitizer(emptyToNull)
    .if((val) => val !== null && val !== undefined)
    .isISO8601()
    .withMessage(`${field} must be a valid date`);

const optionalPhoneField = (field) =>
  body(field)
    .optional({ values: 'falsy' })
    .customSanitizer(emptyToNull)
    .if((val) => val !== null && val !== undefined)
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage(`${field} must be between 7 and 20 characters`);

const optionalEmailField = (field) =>
  body(field)
    .optional({ values: 'falsy' })
    .customSanitizer(emptyToNull)
    .if((val) => val !== null && val !== undefined)
    .trim()
    .isEmail()
    .withMessage(`${field} must be valid`)
    .normalizeEmail();

const equipmentIdParam = [
  param('id')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid equipment number')
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('Equipment number contains invalid characters'),
];

const createEquipmentRules = [
  body('equipment_no')
    .trim()
    .notEmpty()
    .withMessage('equipment_no is required')
    .isLength({ max: 50 })
    .withMessage('equipment_no must be at most 50 characters')
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('equipment_no contains invalid characters'),
  optionalDateField('manufacturing_date'),
  body('warranty_status')
    .optional({ values: 'falsy' })
    .isIn(['In Warranty', 'Out of Warranty'])
    .withMessage("warranty_status must be 'In Warranty' or 'Out of Warranty'"),
  optionalDateField('warranty_start_date'),
  optionalDateField('warranty_end_date'),
  body('in_amc').optional().isBoolean().withMessage('in_amc must be a boolean'),
  optionalDateField('amc_start_date'),
  optionalDateField('amc_end_date'),
  body('amc_location').optional({ values: 'falsy' }).isIn(['Udupi', 'Mangalore', '', null]).withMessage("amc_location must be 'Udupi' or 'Mangalore'"),
  body('amc_amount').optional({ values: 'falsy' }).isNumeric().withMessage('amc_amount must be a valid number'),
  body('po_number').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('po_number must be at most 100 characters'),
  optionalDateField('po_date'),
  optionalPhoneField('contact_number'),
  optionalEmailField('email'),
  textField('engine_dgno', 50),
  textField('engine_make', 50),
  textField('engine_model', 50),
  textField('kva_hp', 50),
  textField('alternator_make', 50),
  textField('alternator_sno', 50),
  textField('alternator_model', 50),
  textField('customer_name', 100),
  textField('site_name', 100),
  textField('address', 500),
  textField('contact_person', 100),
];

const updateEquipmentRules = [
  ...equipmentIdParam,
  optionalDateField('manufacturing_date'),
  body('warranty_status')
    .optional({ values: 'falsy' })
    .isIn(['In Warranty', 'Out of Warranty'])
    .withMessage("warranty_status must be 'In Warranty' or 'Out of Warranty'"),
  optionalDateField('warranty_start_date'),
  optionalDateField('warranty_end_date'),
  body('in_amc').optional().isBoolean().withMessage('in_amc must be a boolean'),
  optionalDateField('amc_start_date'),
  optionalDateField('amc_end_date'),
  body('amc_location').optional({ values: 'falsy' }).isIn(['Udupi', 'Mangalore', '', null]).withMessage("amc_location must be 'Udupi' or 'Mangalore'"),
  body('amc_amount').optional({ values: 'falsy' }).isNumeric().withMessage('amc_amount must be a valid number'),
  body('po_number').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('po_number must be at most 100 characters'),
  optionalDateField('po_date'),
  optionalPhoneField('contact_number'),
  optionalEmailField('email'),
  textField('engine_dgno', 50),
  textField('engine_make', 50),
  textField('engine_model', 50),
  textField('kva_hp', 50),
  textField('alternator_make', 50),
  textField('alternator_sno', 50),
  textField('alternator_model', 50),
  textField('customer_name', 100),
  textField('site_name', 100),
  textField('address', 500),
  textField('contact_person', 100),
];

const updateWarrantyRules = [
  ...equipmentIdParam,
  body('warranty_status')
    .notEmpty()
    .withMessage('warranty_status is required')
    .isIn(['In Warranty', 'Out of Warranty'])
    .withMessage("warranty_status must be 'In Warranty' or 'Out of Warranty'"),
  optionalDateField('warranty_start_date'),
  optionalDateField('warranty_end_date'),
];

module.exports = {
  equipmentIdParam,
  createEquipmentRules,
  updateEquipmentRules,
  updateWarrantyRules,
};
