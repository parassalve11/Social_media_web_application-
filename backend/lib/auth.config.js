export const AUTH_CONFIG = {
  accessTokenMinutes: Number.parseInt(process.env.ACCESS_TOKEN_MINUTES || "15", 10),
  refreshTokenDays: Number.parseInt(process.env.REFRESH_TOKEN_DAYS || "30", 10),
  verifyTokenMinutes: Number.parseInt(
    process.env.TOKEN_EXPIRES_MINUTES_VERIFY || "1440",
    10
  ),
  resetTokenMinutes: Number.parseInt(
    process.env.TOKEN_EXPIRES_MINUTES_PWD_RESET || "60",
    10
  ),
  maxFailedLogins: Number.parseInt(process.env.MAX_FAILED_LOGINS || "5", 10),
  lockoutDurationMinutes: Number.parseInt(
    process.env.LOCKOUT_DURATION_MIN || "30",
    10
  ),
  loginRateLimitPerIp: Number.parseInt(
    process.env.LOGIN_RATE_LIMIT_PER_IP || "20",
    10
  ),
  loginRateLimitWindowSec: Number.parseInt(
    process.env.LOGIN_RATE_LIMIT_WINDOW_SEC || "300",
    10
  ),
  resetRateLimitPerIp: Number.parseInt(
    process.env.RESET_RATE_LIMIT_PER_IP || "5",
    10
  ),
  resetRateLimitWindowSec: Number.parseInt(
    process.env.RESET_RATE_LIMIT_WINDOW_SEC || "300",
    10
  ),
  resendVerifyWindowSec: Number.parseInt(
    process.env.RESEND_VERIFY_WINDOW_SEC || "60",
    10
  ),
};
