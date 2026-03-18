const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    let transportConfig;

    if (process.env.EMAIL_SERVICE) {
        // Service mode: works with Gmail, Yahoo, Outlook etc.
        transportConfig = {
            service: process.env.EMAIL_SERVICE, // e.g. 'gmail'
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,   // App Password for Gmail
            },
        };
    } else {
        // Custom SMTP mode (host/port)
        transportConfig = {
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: { rejectUnauthorized: false },
        };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const message = {
        from: `${process.env.FROM_NAME || 'Vivah Support'} <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;
