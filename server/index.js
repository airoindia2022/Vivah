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

const app = express();

// Trust Proxy for production (important for rate limits)
app.set('trust proxy', 1);


// Security Middlewares
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));


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
const allowedOrigins = [
    'http://localhost:5173',
    'https://shubhvivah.org.in',
    'https://www.shubhvivah.org.in',
    'https://vivah-plum.vercel.app',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// HTTP Request Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Performance Middleware
app.use(compression());

// Body Parser
app.use(express.json({ limit: '50mb' })); // Increased limit to support large bios and profiles

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

connectDB().then(() => {
const server = app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Handle Graceful Shutdown
    const shutdown = async (signal) => {
        console.log(`\n[${signal}] Received. Shutting down gracefully...`);
        server.close(async () => {
            console.log('HTTP server closed.');
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
                console.log('MongoDB connection closed.');
            }
            process.exit(0);
        });
        
        // If it doesn't shut down in 10s, force exit
        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

}).catch(err => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`[CRITICAL] Unhandled Rejection at:`, promise, 'reason:', err.message);
    // Ideally log to an error monitoring service here
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(`[CRITICAL] Uncaught Exception:`, err.message);
    process.exit(1);
});
