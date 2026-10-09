const notFound = (req, res) => {
  res.status(404).json({ error: 'Resource not found' });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.error('[ERROR]', {
    method: req.method,
    path: req.originalUrl,
    message: err.message,
  });

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Something went wrong' : err.publicMessage || 'Request failed',
  });
};

module.exports = { notFound, errorHandler };
