export default async function handler(req, res) {
  console.log('Webhook received:', req.body.type);
  
  try {
    const event = req.body;
    
    // Handle successful subscription events
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated') {
      
      const subscription = event.data.object;
      const customerEmail = subscription.metadata?.userEmail || subscription.customer_email;
      
      console.log('Subscription event for:', customerEmail);
      
      if (customerEmail) {
        // Update user subscription status
        const updateResponse = await fetch(`${process.env.VERCEL_URL || 'https://homework-hippo.vercel.app'}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateSubscription',
            email: customerEmail,
            subscribed: true,
            stripeCustomerId: subscription.customer
          })
        });
        
        console.log('User updated:', customerEmail);
      }
      
    } else if (event.type === 'customer.subscription.deleted') {
      
      const subscription = event.data.object;
      const customerEmail = subscription.metadata?.userEmail || subscription.customer_email;
      
      if (customerEmail) {
        // Remove subscription access
        await fetch(`${process.env.VERCEL_URL || 'https://homework-hippo.vercel.app'}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateSubscription',
            email: customerEmail,
            subscribed: false
          })
        });
        
        console.log('Subscription cancelled for:', customerEmail);
      }
    }
    
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook failed' });
  }
}
