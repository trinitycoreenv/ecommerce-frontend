# Email System Setup Guide

## SendGrid Configuration

### 1. Create SendGrid Account
1. Go to [SendGrid](https://sendgrid.com/) and create a free account
2. Verify your account via email
3. Complete the account setup process

### 2. Generate API Key
1. Go to Settings > API Keys
2. Click "Create API Key"
3. Choose "Restricted Access" and give it "Mail Send" permissions
4. Copy the generated API key

### 3. Environment Variables
Add these to your `.env` file:

```env
# SendGrid Email Configuration
SENDGRID_API_KEY="your_sendgrid_api_key_here"
FROM_EMAIL="noreply@yourecommerce.com"
FROM_NAME="E-commerce Platform"

# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Your SendGrid API Key is already configured!** 🎉

### 4. Domain Authentication (Optional but Recommended)
For production, authenticate your domain with SendGrid:
1. Go to Settings > Sender Authentication
2. Follow the domain authentication process
3. Update your FROM_EMAIL to use your authenticated domain

## Email Templates

The system includes three email templates:

### 1. Email Verification
- Sent when users register
- Contains verification link with 24-hour expiration
- Beautiful HTML template with responsive design

### 2. Welcome Email
- Sent after successful email verification
- Role-specific welcome message
- Direct link to appropriate dashboard

### 3. Vendor Approval Email
- Sent when admin approves/rejects vendor applications
- Status-specific messaging (Approved/Rejected/Pending Info)
- Professional business communication

## Development vs Production

### Development Mode
- If `SENDGRID_API_KEY` is not set, emails are logged to console
- Perfect for testing without sending real emails
- All email content is displayed in terminal

### Production Mode
- Requires valid `SENDGRID_API_KEY`
- Emails are sent via SendGrid
- Includes error handling and logging

## Testing

### Local Testing
1. Set `NODE_ENV=development` in your `.env`
2. Don't set `SENDGRID_API_KEY` to see console logs
3. Register a new user to see verification email in console

### SendGrid Sandbox Mode
1. Set `SENDGRID_API_KEY` to your actual key
2. Enable sandbox mode in SendGrid dashboard
3. Emails will be accepted but not delivered

### Production Testing
1. Use a test email address
2. Monitor SendGrid dashboard for delivery stats
3. Check spam folders if emails don't arrive

## Troubleshooting

### Common Issues
1. **API Key Invalid**: Verify your SendGrid API key
2. **Domain Not Authenticated**: Check sender authentication settings
3. **Emails in Spam**: Use domain authentication and proper SPF records
4. **Rate Limits**: Free tier allows 100 emails/day

### Error Handling
- Email failures don't break user registration
- All email errors are logged to console
- Graceful fallback to console logging in development

## Email Content Customization

Edit email templates in `lib/email.ts`:
- HTML templates with inline CSS
- Responsive design for mobile devices
- Brand colors and styling
- Professional business communication

## Security Considerations

1. **API Key Security**: Never commit API keys to version control
2. **Email Validation**: All emails are validated before sending
3. **Rate Limiting**: Built-in protection against spam
4. **Audit Logging**: All email actions are logged for security
