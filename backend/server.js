const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(morgan('combined'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const corsError = new Error('Not allowed by CORS');
      corsError.statusCode = 403;
      corsError.publicMessage = 'Origin not allowed';
      return callback(corsError);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '100kb' }));

app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/amc', require('./routes/amcRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
