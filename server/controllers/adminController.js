const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const generateToken = require('../utils/generateToken');
const os = require('os');
const mongoose = require('mongoose');
const Config = require('../models/configModel');

// Cache for settings to avoid DB hits on every OTP send
let settingsCache = {};

const getSetting = async (key, defaultValue = null) => {
    if (settingsCache[key] !== undefined) return settingsCache[key];
    const config = await Config.findOne({ key });
    if (config) {
        settingsCache[key] = config.value;
        return config.value;
    }
    return defaultValue;
};

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
    try {
        const { search, gender, subscription, page = 1, limit = 20 } = req.query;
        let query = { isAdmin: { $ne: true } }; // Never show other admins or self in user directory

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (gender && gender !== 'All') query.gender = gender;
        if (subscription && subscription !== 'All') query.subscriptionTier = subscription;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
    } catch (error) {
        console.error('Admin getAllUsers Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Bulk delete users
// @route   DELETE /api/admin/users
// @access  Admin
const bulkDeleteUsers = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No user IDs provided' });
        }

        // Prevent deleting self
        const filteredIds = ids.filter(id => id !== req.user._id.toString());

        const result = await User.deleteMany({ _id: { $in: filteredIds } });
        res.json({ message: `${result.deletedCount} user(s) deleted successfully`, deletedCount: result.deletedCount });
    } catch (error) {
        console.error('Admin bulkDelete Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a single user
// @route   DELETE /api/admin/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
    try {
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own admin account' });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Admin deleteUser Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Toggle user verified status
// @route   PUT /api/admin/users/:id/verify
// @access  Admin
const toggleVerify = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.isVerified = !user.isVerified;
        await user.save();
        res.json({ message: `User ${user.isVerified ? 'verified' : 'unverified'}`, isVerified: user.isVerified });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ isAdmin: { $ne: true } });
        const maleUsers = await User.countDocuments({ gender: 'Male', isAdmin: { $ne: true } });
        const femaleUsers = await User.countDocuments({ gender: 'Female', isAdmin: { $ne: true } });
        const verifiedUsers = await User.countDocuments({ isVerified: true, isAdmin: { $ne: true } });
        const premiumUsers = await User.countDocuments({ subscriptionTier: { $in: ['Gold', 'Diamond', 'Silver'] }, isAdmin: { $ne: true } });

        // Time-series data for the last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const userCount = await User.countDocuments({
                createdAt: { $gte: date, $lt: nextDate },
                isAdmin: { $ne: true }
            });

            const revenueData = await Transaction.aggregate([
                { $match: { createdAt: { $gte: date, $lt: nextDate }, status: 'Success' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const revenueCount = revenueData.length > 0 ? revenueData[0].total : 0;

            last7Days.push({
                name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                date: date.toISOString().split('T')[0],
                users: userCount,
                revenue: revenueCount
            });
        }

        // Religion breakdown
        const religionBreakdown = await User.aggregate([
            { $match: { isAdmin: { $ne: true }, religion: { $exists: true, $ne: null } } },
            { $group: { _id: '$religion', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Age distribution
        const ageDistribution = await User.aggregate([
            { $match: { isAdmin: { $ne: true } } },
            {
                $bucket: {
                    groupBy: "$age",
                    boundaries: [18, 25, 30, 35, 40, 50, 60, 100],
                    default: "Other",
                    output: {
                        count: { $sum: 1 }
                    }
                }
            }
        ]);

        // Subscription breakdown
        const subscriptionBreakdown = await User.aggregate([
            { $match: { isAdmin: { $ne: true } } },
            { $group: { _id: '$subscriptionTier', count: { $sum: 1 } } }
        ]);

        // Total Revenue
        const revenueTotalData = await Transaction.aggregate([
            { $match: { status: 'Success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = revenueTotalData.length > 0 ? revenueTotalData[0].total : 0;

        res.json({
            totalUsers,
            maleUsers,
            femaleUsers,
            verifiedUsers,
            premiumUsers,
            totalRevenue,
            last7Days,
            religionBreakdown,
            ageDistribution,
            subscriptionBreakdown,
        });
    } catch (error) {
        console.error('Admin getStats Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create or seed admin account
// @route   POST /api/admin/seed
// @access  Public (only works if no admin exists)
const seedAdmin = async (req, res) => {
    try {
        const existingAdmin = await User.findOne({ isAdmin: true });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const admin = await User.create({
            fullName: 'Super Admin',
            email: 'admin@matrimony.com',
            password: 'Admin@123',
            gender: 'Male',
            age: 30,
            religion: 'General',
            isAdmin: true,
            isVerified: true,
            subscriptionTier: 'Diamond',
        });

        res.status(201).json({
            message: 'Admin created successfully',
            credentials: {
                email: 'admin@matrimony.com',
                password: 'Admin@123',
            },
            token: generateToken(admin._id),
        });
    } catch (error) {
        console.error('Seed Admin Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all transactions (admin)
// @route   GET /api/admin/transactions
// @access  Admin
const getAllTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const total = await Transaction.countDocuments();
        const transactions = await Transaction.find()
            .populate('user', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({ 
            transactions, 
            total, 
            page: parseInt(page), 
            pages: Math.ceil(total / parseInt(limit)) 
        });
    } catch (error) {
        console.error('Admin getAllTransactions Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get platform health metrics
// @route   GET /api/admin/health
// @access  Admin
const getPlatformHealth = async (req, res) => {
    try {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const systemMemory = {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem(),
        };

        const cpuUsage = os.loadavg(); // Returns 1, 5, and 15 minute load averages
        const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';

        // Get some basic app stats
        const totalUsers = await User.countDocuments();
        const pendingVerifications = await User.countDocuments({ isVerified: false, isAdmin: { $ne: true } });

        res.json({
            status: 'Healthy',
            uptime: Math.floor(uptime),
            memory: {
                process: {
                    rss: memoryUsage.rss,
                    heapTotal: memoryUsage.heapTotal,
                    heapUsed: memoryUsage.heapUsed,
                },
                system: systemMemory,
            },
            cpu: {
                loadAverage: cpuUsage,
                cores: os.cpus().length,
                model: os.cpus()[0].model,
            },
            database: {
                status: dbStatus,
                name: mongoose.connection.name,
            },
            platform: os.platform(),
            nodeVersion: process.version,
            appStats: {
                totalUsers,
                pendingVerifications,
            }
        });
    } catch (error) {
        console.error('Admin getPlatformHealth Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all system settings
// @route   GET /api/admin/settings
// @access  Admin
const getSettings = async (req, res) => {
    try {
        const settings = await Config.find();
        
        // Ensure DISABLE_EMAIL_OTP exists
        let otpSetting = settings.find(s => s.key === 'DISABLE_EMAIL_OTP');
        if (!otpSetting) {
            otpSetting = await Config.create({
                key: 'DISABLE_EMAIL_OTP',
                value: process.env.DISABLE_EMAIL_OTP === 'true',
                description: 'Disable email OTP verification for signup (Temporary feature)'
            });
            settings.push(otpSetting);
        }

        res.json(settings);
    } catch (error) {
        console.error('Admin getSettings Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a system setting
// @route   PUT /api/admin/settings/:key
// @access  Admin
const updateSetting = async (req, res) => {
    try {
        const { value } = req.body;
        const { key } = req.params;

        const config = await Config.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );

        // Update cache
        settingsCache[key] = value;
        // Also update env for redundancy (only if string/boolean)
        if (typeof value === 'boolean' || typeof value === 'string') {
            process.env[key] = String(value);
        }

        res.json({ message: 'Setting updated successfully', config });
    } catch (error) {
        console.error('Admin updateSetting Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { 
    getAllUsers, 
    bulkDeleteUsers, 
    deleteUser, 
    toggleVerify, 
    getStats, 
    seedAdmin, 
    getAllTransactions, 
    getPlatformHealth,
    getSettings,
    updateSetting,
    getSetting // exported for internal use
};
