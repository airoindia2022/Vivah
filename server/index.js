const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

connectDB();

const app = express();

// Security Middlewares
app.use(helmet());

// Express 5 makes req.query and req.params non-writable by default, which breaks express-mongo-sanitize
app.use((req, res, next) => {
    if (req.query) {
        const query = req.query;
        Object.defineProperty(req, 'query', {
            value: query,
            writable: true,
            enumerable: true,
            configurable: true
        });
    }
    if (req.params) {
        const params = req.params;
        Object.defineProperty(req, 'params', {
            value: params,
            writable: true,
            enumerable: true,
            configurable: true
        });
    }
    next();
});


app.use(mongoSanitize());


// CORS Configuration
const corsOptions = {
    origin: process.env.CLIENT_URL || 'https://vivah-plum.vercel.app',
    credentials: true,
};
app.use(cors(corsOptions));

// HTTP Request Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Performance Middleware
app.use(compression());

// Body Parser
app.use(express.json({ limit: '10kb' })); // Limit body size for security

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

