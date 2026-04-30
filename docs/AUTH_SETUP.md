# Authentication Setup Guide

## Problem: No Email Received on Sign Up

By default, Supabase requires email confirmation for new users, but emails won't be sent unless you configure email settings in your Supabase project.

## Quick Solutions

### Option 1: Disable Email Confirmation (Recommended for Development)

This is the fastest way to get authentication working locally.

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers** → **Email**
3. Scroll down to **Email Confirmation**
4. **Uncheck** "Enable email confirmations"
5. Click **Save**

Now users can sign up and immediately sign in without email confirmation.

### Option 2: Configure Email Provider

If you want email confirmation to work:

#### Using Supabase's Built-in Email (Limited)

Supabase provides limited email sending for development:
- Go to **Authentication** → **Email Templates**
- Customize your confirmation email template
- Note: Limited to a few emails per hour

#### Using Custom SMTP (Production)

For production, configure a custom SMTP provider:

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable custom SMTP
3. Configure your email provider:

**Gmail Example:**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Password: your-app-password (not your regular password)
Sender Email: your-email@gmail.com
Sender Name: SIM-OPS
```

**SendGrid Example:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: your-sendgrid-api-key
Sender Email: noreply@yourdomain.com
Sender Name: SIM-OPS
```

**AWS SES Example:**
```
SMTP Host: email-smtp.us-east-1.amazonaws.com
SMTP Port: 587
SMTP User: your-ses-smtp-username
SMTP Password: your-ses-smtp-password
Sender Email: verified@yourdomain.com
Sender Name: SIM-OPS
```

4. Click **Save**
5. Send a test email to verify

### Option 3: Auto-Confirm Users (Development Only)

You can auto-confirm users via SQL:

```sql
-- Auto-confirm all new users (DEVELOPMENT ONLY)
CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_confirm_user_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION auto_confirm_user();
```

**⚠️ WARNING:** Remove this trigger before going to production!

To remove:
```sql
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
DROP FUNCTION IF EXISTS auto_confirm_user();
```

## Testing Authentication

### Test Sign Up Flow

1. Go to http://localhost:3000/auth
2. Click **Sign Up** tab
3. Enter email: `test@example.com`
4. Enter password: `password123`
5. Click **Register Operator**

**Expected Results:**

**With Email Confirmation Disabled:**
- ✅ "Account created! You can now sign in."
- ✅ Auto-switches to Sign In tab
- ✅ Can immediately sign in

**With Email Confirmation Enabled:**
- ✅ "Check your email to confirm your account!"
- ✅ Email sent to inbox
- ✅ Click confirmation link
- ✅ Can then sign in

### Test Sign In Flow

1. Go to http://localhost:3000/auth
2. Enter your email and password
3. Click **Access System**
4. Should redirect to dashboard

### Verify User in Database

Check if user was created:

```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

## Common Issues

### Issue: "Email not confirmed"

**Cause:** Email confirmation is enabled but email wasn't sent/confirmed

**Solution:**
- Disable email confirmation (Option 1)
- Or manually confirm user:
  ```sql
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW()
  WHERE email = 'user@example.com';
  ```

### Issue: "Invalid login credentials"

**Cause:** Wrong email/password or user doesn't exist

**Solution:**
- Check if user exists in database
- Try signing up again
- Verify password meets minimum requirements (6+ characters)

### Issue: "User already registered"

**Cause:** Email already exists in database

**Solution:**
- Use a different email
- Or delete existing user:
  ```sql
  DELETE FROM auth.users WHERE email = 'user@example.com';
  ```

### Issue: Emails going to spam

**Cause:** Email provider reputation or configuration

**Solution:**
- Check spam folder
- Configure SPF/DKIM records for your domain
- Use a reputable email service (SendGrid, AWS SES)
- Verify sender email address

### Issue: "Rate limit exceeded"

**Cause:** Too many signup attempts

**Solution:**
- Wait a few minutes
- Configure rate limits in Supabase dashboard
- Use custom SMTP with higher limits

## Email Templates

Customize your email templates in Supabase:

1. Go to **Authentication** → **Email Templates**
2. Edit templates:
   - **Confirm signup** - Sent when user signs up
   - **Invite user** - Sent when inviting users
   - **Magic Link** - Sent for passwordless login
   - **Change Email Address** - Sent when changing email
   - **Reset Password** - Sent for password reset

### Example Confirmation Email Template

```html
<h2>Welcome to SIM-OPS!</h2>
<p>Click the link below to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

## Security Best Practices

### Development
- ✅ Disable email confirmation for faster testing
- ✅ Use test email addresses
- ✅ Don't use real user data

### Production
- ✅ Enable email confirmation
- ✅ Use custom SMTP provider
- ✅ Configure SPF/DKIM records
- ✅ Use strong password requirements
- ✅ Enable rate limiting
- ✅ Monitor authentication logs
- ✅ Set up email templates
- ✅ Test email delivery

## Alternative: Passwordless Authentication

Instead of email/password, you can use magic links:

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: `${window.location.origin}/`,
  },
});
```

This sends a one-time login link to the user's email.

## Testing Email Delivery

### Using MailHog (Local Testing)

1. Install MailHog:
   ```bash
   # Windows (using Chocolatey)
   choco install mailhog
   
   # Mac
   brew install mailhog
   
   # Or download from: https://github.com/mailhog/MailHog
   ```

2. Run MailHog:
   ```bash
   mailhog
   ```

3. Configure Supabase SMTP:
   ```
   Host: localhost
   Port: 1025
   User: (leave empty)
   Password: (leave empty)
   ```

4. View emails at: http://localhost:8025

### Using Mailtrap (Cloud Testing)

1. Sign up at https://mailtrap.io
2. Get SMTP credentials
3. Configure in Supabase
4. View emails in Mailtrap inbox

## Monitoring

Check authentication activity:

```sql
-- Recent signups
SELECT 
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Failed login attempts (if audit logging enabled)
SELECT 
  created_at,
  payload->>'email' as email,
  payload->>'error' as error
FROM auth.audit_log_entries
WHERE payload->>'action' = 'login'
  AND payload->>'error' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

## Support

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Discord](https://discord.supabase.com/)

## Quick Reference

| Task | Command/Action |
|------|----------------|
| Disable email confirmation | Dashboard → Auth → Providers → Email → Uncheck confirmation |
| Manually confirm user | `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '...'` |
| Delete user | `DELETE FROM auth.users WHERE email = '...'` |
| View users | `SELECT * FROM auth.users ORDER BY created_at DESC` |
| Test SMTP | Dashboard → Auth → SMTP Settings → Send test email |
| View email templates | Dashboard → Auth → Email Templates |
