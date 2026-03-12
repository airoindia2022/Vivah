const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    age: { type: Number, required: true },
    religion: { type: String },
    caste: { type: String },
    motherTongue: { type: String },
    height: { type: String },
    weight: { type: String },
    skinColor: { type: String },
    location: {
        city: { type: String },
        state: { type: String },
        country: { type: String, default: 'India' }
    },
    profession: { type: String },
    education: { type: String },
    income: { type: String },
    photos: [{ type: String }],
    bio: {
        type: String,
        validate: {
            validator: function (v) {
                if (!v) return true;
                return v.trim().split(/\s+/).filter(Boolean).length <= 300;
            },
            message: 'Bio must be 300 words or less'
        }
    },
    interests: [{ type: String }],
    familyDetails: {
        fatherStatus: { type: String },
        motherStatus: { type: String },
        siblings: { type: String },
        familyValues: { type: String, enum: ['Traditional', 'Moderate', 'Liberal'], default: 'Moderate' }
    },
    subscriptionTier: { type: String, enum: ['Free', 'Silver', 'Gold', 'Diamond'], default: 'Free' },
    isVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    shortlisted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    interestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    interestsReceived: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['Pending', 'Accepted', 'Declined'], default: 'Pending' }
    }],
    visitors: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        visitedAt: { type: Date, default: Date.now }
    }],
    notifications: [{
        type: { type: String, enum: ['Interest', 'Acceptance', 'Message'], required: true },
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    verificationCode: { type: String },
    verificationCodeExpire: { type: Date },
    lastActive: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Add indexes for common search fields
userSchema.index({ gender: 1 });
userSchema.index({ religion: 1 });
userSchema.index({ age: 1 });
userSchema.index({ 'location.city': 1 });
userSchema.index({ isAdmin: 1 });


// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
