# Social Media Web App - Auth Improvements

## Overview
This update hardens authentication, adds reliable email delivery with RabbitMQ fallback, introduces secure token flows, and improves frontend UX for signup, verification, and password reset.

## New/Updated Environment Variables
Backend (.env):

- `RABBITMQ_URL=` (optional, preferred)
- `RABBITMQ_HOST=` `RABBITMQ_PORT=` `RABBITMQ_USERNAME=` `RABBITMQ_PASSWORD=` (optional fallback)
- `EMAIL_QUEUE_NAME=email-send`
- `RABBITMQ_TIMEOUT_MS=1500`
- `EMAIL_SMTP_HOST=`
- `EMAIL_SMTP_PORT=465`
- `EMAIL_SMTP_USER=`
- `EMAIL_SMTP_PASS=`
- `EMAIL_SMTP_SECURE=true`
- `EMAIL_FROM_NAME=`
- `EMAIL_FROM_ADDRESS=`
- `SENDGRID_API_KEY=` (optional if you add SendGrid support later)
- `TOKEN_EXPIRES_MINUTES_VERIFY=1440`
- `TOKEN_EXPIRES_MINUTES_PWD_RESET=60`
- `MAX_FAILED_LOGINS=5`
- `LOCKOUT_DURATION_MIN=30`
- `ACCESS_TOKEN_MINUTES=15`
- `REFRESH_TOKEN_DAYS=30`
- `LOGIN_RATE_LIMIT_PER_IP=20`
- `LOGIN_RATE_LIMIT_WINDOW_SEC=300`
- `RESET_RATE_LIMIT_PER_IP=5`
- `RESET_RATE_LIMIT_WINDOW_SEC=300`
- `RESEND_VERIFY_WINDOW_SEC=60`
- `CAPTCHA_VERIFY_URL=` (optional)
- `CAPTCHA_SECRET=` (optional)
- `EMAIL_DRY_RUN=true` (tests only)

Frontend:

- `CLIENT_URL=` (already used)

## Migration
MongoDB does not require schema migrations, but you should backfill new fields on existing users:

```bash
node backend/migrate-auth-fields.js
```

## Running
```bash
npm install
npm run dev
```

## Deployment
Deploy the frontend and backend separately.

- Frontend: deploy the `frontend/` directory as its own Vercel project.
- Backend: deploy `backend/server.js` to a Node host such as Render or Railway. This backend uses Express, Socket.IO, and background email workers, so it should not be deployed as a single Vercel frontend project.

If Vercel shows `404: NOT_FOUND` for this repo, the usual cause is importing the repository root instead of setting the Vercel project's Root Directory to `frontend`.

Frontend environment variables:

- `NEXT_PUBLIC_BACKEND_URL=`
- `NEXT_PUBLIC_API_BASE_URL=`

## Tests
```bash
npm run test:unit
npm run test:integration
```

## Postman Collection
Import `postman_auth_collection.json` into Postman for ready-to-run requests.

## API Examples (curl)

Signup:
```bash
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","username":"jane","email":"jane@example.com","password":"StrongPass1!"}'
```

Verify email:
```bash
curl -X POST http://localhost:5000/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"<token-from-email>"}'
```

Login:
```bash
curl -X POST http://localhost:5000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"identifier":"jane@example.com","password":"StrongPass1!"}'
```

Forgot password:
```bash
curl -X POST http://localhost:5000/api/v1/auth/forgot \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com"}'
```

Reset password:
```bash
curl -X POST http://localhost:5000/api/v1/auth/reset \
  -H "Content-Type: application/json" \
  -d '{"token":"<token-from-email>","newPassword":"NewPass1!"}'
```

## RabbitMQ Fallback Validation
1. Set `RABBITMQ_URL` to an invalid value or stop RabbitMQ.
2. Submit signup or forgot password.
3. Confirm logs show `email.queue_unavailable` and `email.sent` via direct sender.

## Backward Compatibility Notes
- The OTP-based `/auth/forget-password/:email` flow is deprecated.
- `/auth/forget-password/check` now maps to the new `/auth/forgot` flow.
- Signup no longer logs users in automatically. Users must verify email before login.
