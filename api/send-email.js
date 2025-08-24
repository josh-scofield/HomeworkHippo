// This uses a free email service - you can upgrade to SendGrid/Mailgun later
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, type } = req.body;

  // Email templates
  const templates = {
    welcome_verification: {
  subject: 'Welcome to HomeworkHippo! Please verify your email 🦛',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3B82F6;">Welcome to HomeworkHippo!</h1>
      <p>Hi there,</p>
      <p>Thanks for signing up! Your 7-day free trial has started.</p>
      <p style="margin: 24px 0;">
        <a href="https://homeworkhippo.com/verify?token=${req.body.verificationToken}" 
           style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">
          Verify Your Email
        </a>
      </p>
      <p>This link expires in 24 hours. You can still use HomeworkHippo while unverified.</p>
      <h2>What you get with your trial:</h2>
      <ul>
        <li>3 free questions to try our AI</li>
        <li>Image upload support</li>
        <li>Step-by-step solutions</li>
      </ul>
      <p>Questions? Reply to this email!</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">HomeworkHippo - AI-Powered Science Help</p>
    </div>
  `
},
    
    welcome: {
      subject: 'Welcome to HomeworkHippo! 🦛',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #F97316;">Welcome to HomeworkHippo!</h1>
          <p>Hi there,</p>
          <p>Thank you for subscribing to HomeworkHippo! You now have unlimited access to AI-powered science homework help.</p>
          <h2>What you can do now:</h2>
          <ul>
            <li>Ask unlimited science questions</li>
            <li>Upload images of problems</li>
            <li>Get step-by-step solutions</li>
            <li>Learn at your own pace</li>
          </ul>
          <p>If you have any questions, reply to this email and we'll help you out!</p>
          <p>Best regards,<br>The HomeworkHippo Team</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">HomeworkHippo - AI-Powered Science Homework Help<br>
          <a href="https://homeworkhippo.com">homeworkhippo.com</a></p>
        </div>
      `
    },
    cancelled: {
      subject: 'Sorry to see you go 😢',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #F97316;">We're sorry to see you go</h1>
          <p>Hi there,</p>
          <p>Your HomeworkHippo subscription has been cancelled. You'll continue to have access until the end of your current billing period.</p>
          <p>We'd love to hear your feedback on how we can improve. Simply reply to this email and let us know!</p>
          <h2>Changed your mind?</h2>
          <p>You can resubscribe anytime at <a href="https://homeworkhippo.com">homeworkhippo.com</a></p>
          <p>Thank you for giving HomeworkHippo a try!</p>
          <p>Best regards,<br>The HomeworkHippo Team</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">HomeworkHippo - AI-Powered Science Homework Help<br>
          <a href="https://homeworkhippo.com">homeworkhippo.com</a></p>
        </div>
      `
    }
  };

  const template = templates[type] || { subject, html };

  try {
    // Using Web3Forms free email API (100 emails/month free)
    // Get your access key at: https://web3forms.com/
    const WEB3FORMS_KEY = process.env.WEB3FORMS_KEY || '784568f1-8f21-4833-b104-8434217d7c1a';
    
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        to: to,
        subject: template.subject,
        from_name: 'HomeworkHippo',
        from_email: 'noreply@homeworkhippo.com',
        html: template.html
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      // If Web3Forms fails, just log it but don't break the flow
      console.log('Email service unavailable, continuing without email');
      return res.status(200).json({ success: true, note: 'Email not sent' });
    }

  } catch (error) {
    console.error('Email error:', error);
    // Don't fail the whole process if email fails
    return res.status(200).json({ success: true, note: 'Email not sent' });
  }
}
