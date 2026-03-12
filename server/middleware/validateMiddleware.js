const { z } = require('zod');

const registerSchema = z.object({
    fullName: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    gender: z.enum(['Male', 'Female', 'Other']),
    age: z.number().min(18, 'Must be at least 18 years old'),
    religion: z.string().optional(),
    bio: z.string().max(2000).optional(), // Approx 300 words
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        res.status(400);
        next(new Error(error.errors.map(e => e.message).join(', ')));
    }
};

module.exports = { registerSchema, loginSchema, validate };
