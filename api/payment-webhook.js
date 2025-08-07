export default async function handler(req, res) {
  console.log('Webhook received:', req.body.type);
  
  try {
    const event = req.body;
    
    // Handle successful subscription events
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated') {
      
      const subscription = event.data.object;
      const customerEmail = subscription.customer; // This is actually the customer ID
      
      console.log('Subscription event:', {
        customer: subscription.customer,
        status: subscription.status,
        current_period_end: subscription.current_period_end
      });
      
      // TODO: Update user subscription status in your app
      // For now, just log the important data
      
    } else if (event.type === 'customer.subscription.deleted') {
      
      const subscription = event.data.object;
      console.log('Subscription cancelled:', subscription.customer);
      
      // TODO: Remove subscription access
      
    }
    
    // Always return success to Stripe
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook failed' });
  }
}
