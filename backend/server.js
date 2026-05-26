require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const ticketRoutes = require('./routes/tickets');
const bfhlRoutes = require('./routes/bfhl');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS with allowed origins
const allowedOrigins = [
  'http://localhost:5173', // Vite local development
  'http://localhost:3000', // Alternative local port
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.ALLOWED_ORIGINS) {
  const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...customOrigins);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server or tools (no origin header)
    if (!origin) return callback(null, true);
    
    // Check if the request origin matches any allowed origin
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Support exact matches or wildcard matches
      return allowedOrigin === origin || origin.endsWith('.' + allowedOrigin.replace(/^https?:\/\//, ''));
    });

    if (isAllowed) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Mount routes
app.use('/tickets', ticketRoutes);
app.use('/bfhl', bfhlRoutes);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
