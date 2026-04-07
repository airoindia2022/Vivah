const express = require('express');
const router = express.Router();
const {
    authUser,
    registerUser,
    getProfiles,
    getProfileById,
    updateProfile,
    toggleShortlist,
    getShortlistedProfiles,
    getVisitors,
    getNotifications,
    markNotificationRead,
    uploadImage,
    serveImage,
    forgotPassword,
    resetPassword,
    verifyEmail,
    sendOTP,
    verifyOTP,
    sendInterest,
    handleInterest,
    getInterests,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/gridfs');
const { validate, registerSchema, loginSchema } = require('../middleware/validateMiddleware');

router.post('/login', validate(loginSchema), authUser);
router.post('/register', validate(registerSchema), registerUser);

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/verify-email', verifyEmail);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/profiles', getProfiles);
router.get('/profile/:id', getProfileById);
router.put('/profile', protect, updateProfile);
router.post('/shortlist/:id', protect, toggleShortlist);
router.get('/shortlisted', protect, getShortlistedProfiles);
router.get('/visitors', protect, getVisitors);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id', protect, markNotificationRead);
router.post('/interest/:id', protect, sendInterest);
router.put('/interest/:id', protect, handleInterest);
router.get('/interests', protect, getInterests);
router.post('/upload', upload.single('image'), uploadImage);
router.get('/image/:id', serveImage);

module.exports = router;
