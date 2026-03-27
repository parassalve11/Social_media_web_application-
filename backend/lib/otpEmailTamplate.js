// Function to generate OTP email HTML body
export const generateOtpEmailBody = ({ otp }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #4CAF50; padding: 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">(संन्या) Social Media</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 30px; text-align: center;">
                  <h2 style="color: #333333; font-size: 20px; margin: 0 0 20px;">Your One-Time Password (OTP)</h2>
                  <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                    Hello,
                  </p>
                  <p style="color: #555555; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                    To proceed with your verification, please use the following OTP:
                  </p>
                  <div style="background-color: #f0f0f0; display: inline-block; padding: 15px 30px; border-radius: 5px; font-size: 24px; font-weight: bold; color: #333333; margin: 20px 0;">
                    ${otp}
                  </div>
                  <p style="color: #555555; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">
                    This OTP is valid for the next 10 minutes. Do not share it with anyone.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 20px; text-align: center;">
                  <p style="color: #777777; font-size: 12px; line-height: 1.5; margin: 0;">
                    If you did not request this OTP, please ignore this email or contact our support team.
                  </p>
                  <p style="color: #777777; font-size: 12px; line-height: 1.5; margin: 10px 0 0;">
                    &copy; 2025 (संन्या) Social Media. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};