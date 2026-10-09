const { body } = require('express-validator');
const { normalizeWhitespace } = require('../utils/sanitize');

const createRequestRules = [
  body('equipment_no')
    .trim()
    .notEmpty()
    .withMessage('equipment_no is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('equipment_no must be at most 50 characters')
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('equipment_no contains invalid characters'),
  body('call_category')
    .trim()
    .notEmpty()
    .withMessage('call_category is required')
    .isIn([
      'Preventive Maintainance-B',
      'Preventive Maintainance-C',
      'Preventive Maintainance-D',
      'Preventive Maintainance-E',
      'Complaint',
      'AMC Visit'
    ])
    .withMessage('Invalid call category'),
  body('pm_service_period')
    .optional({ values: 'falsy' })
    .customSanitizer((val) => (val === '' || val === undefined ? null : val))
    .if((val) => val !== null && val !== undefined)
    .isIn(['6 Months', '1 Year'])
    .withMessage("pm_service_period must be '6 Months' or '1 Year'"),
  body('visit_date').isISO8601().withMessage('visit_date must be a valid date'),
  body('running_hours')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('running_hours must be an integer between 0 and 1000000')
    .toInt(),
  body('symptom')
    .trim()
    .notEmpty()
    .withMessage('symptom is required')
    .isLength({ max: 1000 })
    .withMessage('symptom must be at most 1000 characters')
    .customSanitizer((value) => normalizeWhitespace(value)),
  body('cause')
    .optional({ nullable: true })
    .customSanitizer((value) => normalizeWhitespace(value))
    .isLength({ max: 1000 })
    .withMessage('cause must be at most 1000 characters'),
  body('activity')
    .optional({ nullable: true })
    .customSanitizer((value) => normalizeWhitespace(value))
    .isLength({ max: 1000 })
    .withMessage('activity must be at most 1000 characters'),
  body('comments')
    .optional({ nullable: true })
    .customSanitizer((value) => normalizeWhitespace(value))
    .isLength({ max: 1000 })
    .withMessage('comments must be at most 1000 characters'),
];

module.exports = { createRequestRules };
