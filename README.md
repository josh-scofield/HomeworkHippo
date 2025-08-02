# HomeworkHippo 🦛

AI-powered science homework help platform using Claude AI and Stripe payments.

## Features

- **AI-Powered Solutions**: Get step-by-step science homework help using Claude AI
- **Image Recognition**: Upload photos of problems for instant analysis
- **All Sciences**: Chemistry, Physics, Biology, and more
- **Subscription Management**: $17/month with 7-day free trial
- **Modern UI**: Clean, Anthropic-inspired design

## Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/homeworkhippo.git
cd homeworkhippo
```

### 2. Environment Setup
The API keys are already embedded in the code:
- Anthropic API Key: ✅ Configured
- Stripe Publishable Key: ✅ Configured  
- Stripe Price ID: ✅ Configured

### 3. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy automatically

#### Option B: Vercel CLI
```bash
npm install -g vercel
vercel
```

### 4. Configure Domain
1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain: `homeworkhippo.com`
3. Update DNS settings as instructed

### 5. Set Up Stripe Webhook (Post-deployment)
1. Get your deployed URL from Vercel
2. In Stripe Dashboard → Webhooks
3. Add endpoint: `https://your-domain.com/api/webhook`
4. Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Update webhook secret in code

## File Structure
```
homeworkhippo/
├── index.html          # Main application
├── success.html        # Payment success page
├── package.json        # Dependencies
├── vercel.json         # Vercel configuration
└── README.md          # This file
```

## Technology Stack
- **Frontend**: HTML, CSS, JavaScript
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Payments**: Stripe Checkout
- **Hosting**: Vercel
- **Domain**: SiteGround (DNS pointing to Vercel)

## Support
For technical issues, check the browser console for error messages.

## License
MIT License