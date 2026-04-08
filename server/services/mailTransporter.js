import nodemailer from "nodemailer";

export async function sendMail(toEmail, subject, bodyText) {
  // Configure the transporter with your email service
  // For Gmail, you will need to generate an "App Password" in your Google Account settings
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER, // e.g., 'your-email@gmail.com'
      pass: process.env.EMAIL_PASS, // e.g., 'your-google-app-password'
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: subject,
    html: bodyText.replace(/\n/g, '<br>'), 
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Failed to send email");
  }
}