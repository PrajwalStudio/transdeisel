const { body, param } = require('express-validator');

const orderIdParam = [
  param('id').isInt({ min: 1 }).withMessage('order id must be a positive integer').toInt(),
];

const updateOrderRules = [
  ...orderIdParam,
  body('invoice_number')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('invoice_number must be at most 100 characters'),
  body('resolution_date')
    .optional({ nullable: true })
    .custom((val) => {
      if (val && isNaN(Date.parse(val))) throw new Error('resolution_date must be a valid date');
      return true;
    }),
  body('approval_status')
    .optional({ values: 'falsy' })
    .isIn(['Pending', 'Approved'])
    .withMessage('approval_status must be Pending or Approved'),
  body('completion_status')
    .optional({ values: 'falsy' })
    .isIn(['Pending', 'Completed'])
    .withMessage('completion_status must be Pending or Completed'),
  body().custom((value) => {
    if (!value.invoice_number && !value.approval_status && !value.completion_status) {
      throw new Error('At least one of invoice_number, approval_status, or completion_status is required');
    }
    return true;
  }),
];

module.exports = { orderIdParam, updateOrderRules };
