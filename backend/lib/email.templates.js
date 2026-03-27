const appName = process.env.EMAIL_FROM_NAME || "Social Media App";

const getClientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

export const buildVerifyEmail = ({ name, token }) => {
  const link = `${getClientUrl()}/verify-email?token=${token}`;
  return {
    subject: `${appName} - Verify your email`,
    text: `Hi ${name || "there"}, verify your email by visiting: ${link}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2 style="margin: 0 0 12px;">Verify your email</h2>
        <p>Hi ${name || "there"},</p>
        <p>Thanks for signing up. Please verify your email to activate your account.</p>
        <p>
          <a href="${link}" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">
            Verify Email
          </a>
        </p>
        <p style="font-size: 12px; color: #555;">If you did not create an account, you can ignore this email.</p>
      </div>
    `,
  };
};

export const buildResetPasswordEmail = ({ name, token }) => {
  const link = `${getClientUrl()}/reset-password?token=${token}`;
  return {
    subject: `${appName} - Reset your password`,
    text: `Hi ${name || "there"}, reset your password by visiting: ${link}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2 style="margin: 0 0 12px;">Reset your password</h2>
        <p>Hi ${name || "there"},</p>
        <p>We received a request to reset your password. Click below to choose a new one.</p>
        <p>
          <a href="${link}" style="display: inline-block; padding: 10px 16px; background: #16a34a; color: #fff; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        <p style="font-size: 12px; color: #555;">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  };
};
