  // api/stripe-webhook.js - Handles Stripe payment notifications
  export default async function handler(req, res) {
    // Only allow POST requests from Stripe
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      console.log('Webhook received:', req.body);
      
      // For now, just log what we receive and return success
      // We'll add the real logic in the next steps
      
      res.status(200).json({ received: true });
      
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook failed' });
    }
  }
