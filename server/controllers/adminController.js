const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const generateToken = require('../utils/generateToken');

// @desc    Get all users (admin)
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
    try {
        const { search, gender, subscription, page = 1, limit = 20 } = req.query;
        let query = {};

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
        const totalUsers = await User.countDocuments();
        const maleUsers = await User.countDocuments({ gender: 'Male' });
        const femaleUsers = await User.countDocuments({ gender: 'Female' });
        const verifiedUsers = await User.countDocuments({ isVerified: true });
        const premiumUsers = await User.countDocuments({ subscriptionTier: { $in: ['Gold', 'Diamond', 'Silver'] } });

        // New registrations in last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const newUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        // Subscription breakdown
        const subscriptionBreakdown = await User.aggregate([
            { $group: { _id: '$subscriptionTier', count: { $sum: 1 } } }
        ]);

        // Total Revenue
        const revenueData = await Transaction.aggregate([
            { $match: { status: 'Success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        res.json({
            totalUsers,
            maleUsers,
            femaleUsers,
            verifiedUsers,
            premiumUsers,
            newUsers,
            subscriptionBreakdown,
            totalRevenue,
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

module.exports = { getAllUsers, bulkDeleteUsers, deleteUser, toggleVerify, getStats, seedAdmin, getAllTransactions };
