const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const {
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
} = require('../controllers/adminController');

// Seed admin (public, only works once)
router.post('/seed', seedAdmin);

// All routes below require auth + admin
router.use(protect, adminMiddleware);

router.get('/health', getPlatformHealth);
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/transactions', getAllTransactions);
router.delete('/users', bulkDeleteUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/verify', toggleVerify);
router.get('/settings', getSettings);
router.put('/settings/:key', updateSetting);

module.exports = router;
