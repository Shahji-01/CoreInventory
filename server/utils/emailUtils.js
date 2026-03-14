const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Required via .env
    pass: process.env.SMTP_PASS, // Required via .env
  },
});

const sendOtpEmail = async (to, otp) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP_USER and SMTP_PASS are not configured in .env. Skipping email delivery.');
    console.log(`[DEV FALLBACK] OTP for ${to}: ${otp}`);
    return;
  }
  
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: 'CoreInventory - Password Reset OTP',
      text: `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f5; color: #18181b; max-width: 600px; margin: auto; border-radius: 8px;">
          <h2 style="color: #00f5a0;">CoreInventory</h2>
          <p>You requested a password reset. Here is your One-Time Password (OTP):</p>
          <div style="background-color: #fff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px solid #e4e4e7;">
            <h1 style="font-size: 32px; letter-spacing: 4px; color: #18181b; margin: 0;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #64748b;">This code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #64748b;">If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent successfully to ${to}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    // Don't throw here to prevent the API call from blowing up just because the email failed, 
    // unless strict delivery guarantees are required by your system.
  }
};

module.exports = { sendOtpEmail };
