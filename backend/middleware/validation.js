const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    error: 'Validation failed',
    details: result.array().map((item) => ({ field: item.path, message: item.msg })),
  });
};

const rejectUnknownFields = (allowedFields) => (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const unknownFields = Object.keys(req.body).filter((key) => !allowedFields.includes(key));
  if (unknownFields.length > 0) {
    return res.status(400).json({
      error: 'Unexpected fields in request body',
      details: unknownFields,
    });
  }

  return next();
};

module.exports = { validate, rejectUnknownFields };
