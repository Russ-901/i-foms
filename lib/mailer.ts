import nodemailer from 'nodemailer';

function buildTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendInviteEmail(to: string, name: string, inviteUrl: string) {
  const transporter = buildTransporter();

  const info = await transporter.sendMail({
    from: `"i-FOMS Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "You've been invited to i-FOMS",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to i-FOMS, ${name}!</h2>
        <p>An administrator has added you as staff. Set up your account by clicking the link below:</p>
        <a href="${inviteUrl}" style="background-color:#16a34a; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">
          Set Up My Account
        </a>
        <p style="margin-top: 20px;">This link expires in 7 days. If you weren't expecting this, you can safely ignore it.</p>
      </div>
    `,
  });

  console.log('✅ Invite email sent:', info.messageId);
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  try {
    const transporter = buildTransporter();

    const info = await transporter.sendMail({
      from: `"i-FOMS Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to i-FOMS, ${name}!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verifyUrl}" style="background-color:#16a34a; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">
            Verify Email
          </a>
          <p style="margin-top: 20px;">If you did not request this, you can safely ignore it.</p>
        </div>
      `,
    });

    console.log('✅ Verification email sent:', info.messageId);
  } catch (err) {
    console.error('❌ Failed to send verification email:', err);
    throw err; // rethrow to show in API log
  }
}