# Production setup (multi-user)

## 1. Resend DNS (required to email all users)

Domain `ashishb.com.np` is already added in Resend but **not verified**.
DNS is hosted on **Vercel**. Add these records under  
[Vercel → Domains → ashishb.com.np → DNS Records](https://vercel.com/dashboard):

| Type | Name | Value | Priority |
|------|------|-------|----------|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC+XIa4dvciC6bMRf1tpXn17hXBLfetUk4xCdrSH0uBHg7+szRlAACfp+tRC6hj4p9/5evTsY7DsjGWVusnRbDxQUTsBFE8p4Z4RbDoJNO7XSva/mKgKrBYRSCoET/lVTF6hBZPEIn63YJI/sZrlSkcusfPWGjMelzULWNSIKcbyQIDAQAB` | — |
| MX | `send` | `feedback-smtp.ap-northeast-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |

Then in Resend → Domains → ashishb.com.np → **Verify**.

Set:

```bash
EMAIL_FROM=JobFlow <noreply@ashishb.com.np>
```

`onboarding@resend.dev` can only send to your own inbox — it cannot serve other users.

## 2. Turso database (required on Vercel)

Local SQLite under `/tmp` is wiped across serverless instances. Create a Turso DB:

```bash
# https://docs.turso.tech/cli/installation
turso auth login
turso db create jobflow
turso db show jobflow --url
turso db tokens create jobflow
```

Set on Vercel:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## 3. Auth env (required)

- `AUTH_SECRET` — long random string (`openssl rand -hex 32`)
- `APP_URL=https://ashish-job.vercel.app`
- `RESEND_API_KEY`
- `EMAIL_FROM=JobFlow <noreply@ashishb.com.np>`
