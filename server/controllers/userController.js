const User = require('../models/userModel');
const OTP = require('../models/otpModel');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const { Readable } = require('stream');


// @desc    Send OTP to email
// @route   POST /api/users/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to DB
        await OTP.findOneAndUpdate(
            { email },
            { code: otp, createdAt: Date.now() },
            { upsert: true, returnDocument: 'after' }
        );

        // Send OTP Email
        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #e11d48; text-align: center;">Vivah Email Verification</h2>
                <p>Hello,</p>
                <p>Please use the following OTP to verify your email address to begin your Vivah journey:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <h1 style="background-color: #fce7f3; color: #e11d48; padding: 15px; display: inline-block; border-radius: 5px; letter-spacing: 5px;">${otp}</h1>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888; text-align: center;">© ${new Date().getFullYear()} Vivah. All rights reserved.</p>
            </div>
        `;

        try {
            await sendEmail({
                email,
                subject: 'Verify your email - Vivah',
                html: message,
            });
            res.status(200).json({ message: 'OTP sent successfully' });
        } catch (emailError) {
            console.error('Email Send Error:', emailError.message);
            
            // In development, we allow registration even if email fails by logging OTP to console
            if (process.env.NODE_ENV === 'development') {
                console.log('------------------------------------');
                console.log('DEVELOPMENT MODE: EMAIL FAILED');
                console.log(`OTP for ${email}: ${otp}`);
                console.log('------------------------------------');
                return res.status(200).json({ 
                    message: 'OTP sent (Dev Mode: Check Server Logs)',
                    devMode: true 
                });
            }
            
            res.status(500).json({ message: 'Error sending verification email' });
        }
});


// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { email, code } = req.body;

        const otpRecord = await OTP.findOne({ email, code });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // OTP is valid
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const countWords = (str) => {
    if (!str) return 0;
    return str.trim().split(/\s+/).filter(Boolean).length;
};


// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (!user.isVerified) {
                return res.status(401).json({ 
                    message: 'Please verify your email before logging in',
                    requiresVerification: true,
                    email: user.email
                });
            }
            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                gender: user.gender,
                age: user.age,
                photos: user.photos,
                subscriptionTier: user.subscriptionTier,
                isAdmin: user.isAdmin,
                token: generateToken(user._id),
            });
        } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});


// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    try {
        const {
            fullName, email, password, gender, age, religion,
            caste, motherTongue, height, weight, skinColor, city, state,
            profession, education, income, bio, interests,
            familyDetails, photos, phoneNumber, whatsappNumber, contactEmail
        } = req.body;

        if (bio && countWords(bio) > 300) {
            res.status(400).json({ message: 'Bio must be 300 words or less' });
            return;
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        const user = await User.create({
            fullName,
            email,
            password,
            gender,
            age,
            religion,
            caste,
            motherTongue,
            height,
            weight,
            skinColor,
            location: { city, state },
            profession,
            education,
            income,
            bio,
            interests,
            familyDetails,
            photos: photos || [],
            phoneNumber,
            whatsappNumber,
            contactEmail,
            isVerified: true, // We assume verification was done in Step 1
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify email with OTP
// @route   POST /api/users/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({ 
            email,
            verificationCode: code,
            verificationCodeExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpire = undefined;
        await user.save();

        res.json({
            message: 'Email verified successfully',
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all profiles with filters
// @route   GET /api/users/profiles
// @access  Public
const getProfiles = async (req, res) => {
    try {
        const { religion, ageMin, ageMax, gender, city, search } = req.query;
        let query = { isAdmin: { $ne: true } }; // Never show admin accounts as profiles

        if (religion && religion !== 'All') query.religion = religion;
        if (gender && gender !== 'All') query.gender = gender;
        if (city && city !== 'All') query['location.city'] = new RegExp(city, 'i');

        if (ageMin || ageMax) {
            query.age = {};
            if (ageMin) query.age.$gte = parseInt(ageMin);
            if (ageMax) query.age.$lte = parseInt(ageMax);
        }

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { profession: { $regex: search, $options: 'i' } },
                { education: { $regex: search, $options: 'i' } },
            ];
        }

        const profiles = await User.find(query).select('-password');
        res.json(profiles);
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:id
// @access  Public
const getProfileById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user && user.isAdmin) {
            // Permit viewing own profile even if admin (needed for Edit Profile page)
            const authHeader = req.headers.authorization;
            let isOwnProfile = false;
            if (authHeader && authHeader.startsWith('Bearer')) {
                try {
                    const token = authHeader.split(' ')[1];
                    // Using a simple decode since we just need the ID to compare
                    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'secret');
                    if (decoded.id === user._id.toString()) {
                        isOwnProfile = true;
                    }
                } catch (err) {
                    // Token invalid or expired, proceed with 404 for admin
                }
            }

            if (!isOwnProfile) {
                return res.status(404).json({ message: 'Profile not found' });
            }
        }
        if (user) {
            // Record visitor if authenticated
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer')) {
                try {
                    const token = authHeader.split(' ')[1];
                    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
                    const visitorId = decoded.id;

                    if (visitorId && visitorId !== user._id.toString()) {
                        await User.findByIdAndUpdate(user._id, {
                            $push: { visitors: { user: visitorId, visitedAt: new Date() } }
                        });
                    }
                } catch (err) {
                    console.warn('Visitor record failed: Invalid token');
                }
            }

            res.json({
                ...user._doc,
                id: user._id
            });
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        console.error('Profile Fetch Error Details:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'User not found in request' });
        }
        const user = await User.findById(req.user._id);

        if (user) {
            user.fullName = req.body.fullName || user.fullName;
            user.email = req.body.email || user.email;
            user.age = req.body.age || user.age;
            user.gender = req.body.gender || user.gender;
            user.religion = req.body.religion || user.religion;
            user.caste = req.body.caste || user.caste;
            user.motherTongue = req.body.motherTongue || user.motherTongue;
            user.height = req.body.height || user.height;
            user.weight = req.body.weight || user.weight;
            user.skinColor = req.body.skinColor || user.skinColor;
            user.profession = req.body.profession || user.profession;
            user.education = req.body.education || user.education;
            user.income = req.body.income || user.income;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            user.whatsappNumber = req.body.whatsappNumber || user.whatsappNumber;
            user.contactEmail = req.body.contactEmail || user.contactEmail;

            if (req.body.bio) {
                if (countWords(req.body.bio) > 300) {
                    return res.status(400).json({ message: 'Bio must be 300 words or less' });
                }
                user.bio = req.body.bio;
            }

            user.interests = req.body.interests || user.interests;
            user.familyDetails = req.body.familyDetails || user.familyDetails;
            user.location = req.body.location || user.location;

            if (req.body.photos) {
                user.photos = req.body.photos;
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            const userObj = updatedUser.toObject();
            delete userObj.password;

            res.json({
                ...userObj,
                id: updatedUser._id,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Update Error Details:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
};

// @desc    Upload image to GridFS
// @route   POST /api/users/upload
// @access  Private
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'photos',
        });

        const filename = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: req.file.mimetype,
            metadata: { 
                uploadedBy: req.user ? req.user._id : null,
                originalName: req.file.originalname
            }
        });

        const bufferStream = Readable.from(req.file.buffer);
        
        bufferStream.pipe(uploadStream)
            .on('error', (err) => {
                console.error('GridFS Manual Upload Error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Upload failed' });
                }
            })
            .on('finish', () => {
                const fileId = uploadStream.id;
                const url = `/api/users/image/${fileId}`;
                res.json({ url });
            });
    } catch (error) {
        console.error('Upload Controller Exception:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Upload failed' });
        }
    }
};

// @desc    Serve image from GridFS
// @route   GET /api/users/image/:id
// @access  Public
const serveImage = async (req, res) => {
    try {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'photos',
        });

        const fileId = new mongoose.Types.ObjectId(req.params.id);

        // Check if file exists
        const files = await bucket.find({ _id: fileId }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const file = files[0];

        // Set proper content type
        res.set('Content-Type', file.contentType || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache 1 year

        // Stream image from GridFS to response
        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.on('error', () => {
            res.status(404).json({ message: 'Image not found' });
        });
        downloadStream.pipe(res);
    } catch (error) {
        console.error('Image Serve Error:', error);
        if (error.name === 'BSONError' || error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid image ID' });
        }
        res.status(500).json({ message: 'Failed to retrieve image' });
    }
};

// @desc    Toggle shortlist a profile
// @route   POST /api/users/shortlist/:id
// @access  Private
const toggleShortlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const profilId = req.params.id;

        if (user.shortlisted.includes(profilId)) {
            user.shortlisted = user.shortlisted.filter(id => id.toString() !== profilId);
            await user.save();
            res.json({ message: 'Removed from shortlist', isShortlisted: false });
        } else {
            user.shortlisted.push(profilId);
            await user.save();
            res.json({ message: 'Added to shortlist', isShortlisted: true });
        }
    } catch (error) {
        console.error('Shortlist Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get shortlisted profiles
// @route   GET /api/users/shortlisted
// @access  Private
const getShortlistedProfiles = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('shortlisted', '-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Filter out any null entries from deleted users or admins
        res.json(user.shortlisted.filter(p => p !== null && !p.isAdmin));
    } catch (error) {
        console.error('Shortlist Fetch Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get profile visitors
// @route   GET /api/users/visitors
// @access  Private
const getVisitors = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('visitors.user', 'fullName photos age location religion profession isAdmin');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return unique visitors, sorted by most recent
        const uniqueVisitors = [];
        const seenIds = new Set();

        const sortedVisitors = (user.visitors || []).sort((a, b) => b.visitedAt - a.visitedAt);

        for (const visitor of sortedVisitors) {
            if (visitor.user && visitor.user._id && !visitor.user.isAdmin && !seenIds.has(visitor.user._id.toString())) {
                uniqueVisitors.push(visitor);
                seenIds.add(visitor.user._id.toString());
            }
        }

        res.json(uniqueVisitors.slice(0, 10)); // Top 10 recent unique visitors
    } catch (error) {
        console.error('Visitors Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('notifications.from', 'fullName photos isAdmin');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Filter out notifications from deleted users or admins
        const validNotifications = (user.notifications || []).filter(n => n.from !== null && !n.from.isAdmin);
        res.json(validNotifications.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
        console.error('Notifications Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/users/notifications/:id
// @access  Private
const markNotificationRead = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const notification = user.notifications.id(req.params.id);

        if (notification) {
            notification.read = true;
            await user.save();
            res.json({ message: 'Notification marked as read' });
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        console.error('Notification Update Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Forgot Password
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Get reset token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set expire
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #e11d48; text-align: center;">Vivah Password Reset</h2>
                <p>Hello ${user.fullName},</p>
                <p>You are receiving this email because you (or someone else) has requested the reset of a password. Please click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                </div>
                <p>Wait! If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <p>The link will expire in 10 minutes.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888; text-align: center;">© ${new Date().getFullYear()} Vivah. All rights reserved.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password reset token',
                html: message,
            });

            res.status(200).json({ message: 'Email sent successfully' });
        } catch (error) {
            console.error('Email Error:', error);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();

            res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reset Password
// @route   PUT /api/users/resetpassword/:resettoken
// @access  Public
const resetPassword = async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.resettoken)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token or token expired' });
        }

        // Set new password
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            message: 'Password reset successful',
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    verifyEmail,
    sendOTP,
    verifyOTP,
    forgotPassword,
    resetPassword,
    authUser,
    registerUser,
    getProfiles,
    getProfileById,
    updateProfile,
    uploadImage,
    serveImage,
    toggleShortlist,
    getShortlistedProfiles,
    getVisitors,
    getNotifications,
    markNotificationRead,
};
