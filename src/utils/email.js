const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  // return nodemailer.createTransporter({
  // host: process.env.SMTP_HOST,
  // port: process.env.SMTP_PORT,
  // secure: process.env.SMTP_SECURE === 'true',
  // auth: {
  // user: process.env.SMTP_USER,
  //pass: process.env.SMTP_PASS
  //}
  //});

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "gajeraharsh283@gmail.com", // Your Gmail
      pass: "nzgd yzzb dzqx hugt", // App password (not your Gmail password!)
    },
  });
};

// Send email
const sendEmail = async ({ to, subject, html, text, attachments }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  welcome: (user) => ({
    subject: "Welcome to Our E-commerce Platform!",
    html: `
      <h1>Welcome ${user.firstName}!</h1>
      <p>Thank you for registering with our e-commerce platform.</p>
      <p>We're excited to have you as part of our community!</p>
    `,
  }),

  passwordReset: (resetToken) => ({
    subject: "Password Reset Request",
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `,
  }),

  orderConfirmation: (order) => ({
    subject: `Order Confirmation - #${order.orderNumber}`,
    html: `
      <h1>Order Confirmed!</h1>
      <p>Your order #${order.orderNumber} has been confirmed.</p>
      <p>Total: $${order.total}</p>
      <p>We'll notify you when your order ships.</p>
    `,
  }),

  orderShipped: (order, trackingNumber) => ({
    subject: `Order Shipped - #${order.orderNumber}`,
    html: `
      <h1>Your Order Has Shipped!</h1>
      <p>Order #${order.orderNumber} has been shipped.</p>
      <p>Tracking Number: ${trackingNumber}</p>
      <p>Estimated Delivery: ${order.estimatedDelivery}</p>
    `,
  }),

  contactNotification: (contact) => ({
    subject: `New Contact Form Submission: ${contact.subject}`,
    html: `
      <h1>New Contact Form Submission</h1>
      <p><strong>From:</strong> ${contact.name} (${contact.email})</p>
      <p><strong>Subject:</strong> ${contact.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${contact.message}</p>
    `,
  }),
};

module.exports = {
  sendEmail,
  emailTemplates,
};
