const getOTPTemplate = (otp) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #e11d48; text-align: center;">Vivah Email Verification</h2>
        <p>Hello,</p>
        <p>Please use the following OTP to verify your email address to begin your Vivah journey:</p>
        <div style="text-align: center; margin: 30px 0;">
            <h1 style="background-color: #fce7f3; color: #e11d48; padding: 15px; display: inline-block; border-radius: 5px; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">© ${new Date().getFullYear()} Vivah. All rights reserved.</p>
    </div>
`;

const getPasswordResetTemplate = (user, resetUrl) => `
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

module.exports = {
    getOTPTemplate,
    getPasswordResetTemplate
};
