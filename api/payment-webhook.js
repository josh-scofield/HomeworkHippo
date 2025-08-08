export default async function handler(req, res) {
  console.log('Webhook received:', req.body.type);
  
  // Get Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  try {
    const event = req.body;
    
    // Handle successful subscription events
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated') {
      
      const subscription = event.data.object;
      // Try to get email from different possible locations
      const customerEmail = subscription.customer_email || 
                           subscription.metadata?.userEmail ||
                           event.data.object.customer_email;
      
      console.log('Subscription activated for:', customerEmail);
      
      if (customerEmail && supabaseUrl && supabaseKey) {
        // Update user directly in Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${customerEmail}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            subscribed: true,
            stripe_customer_id: subscription.customer
          })
        });
        
        if (response.ok) {
          console.log('User subscription activated:', customerEmail);
        } else {
          console.error('Failed to update user:', await response.text());
        }
      }
      
    } else if (event.type === 'customer.subscription.deleted') {
      
      const subscription = event.data.object;
      const customerEmail = subscription.customer_email || 
                           subscription.metadata?.userEmail ||
                           event.data.object.customer_email;
      
      if (customerEmail && supabaseUrl && supabaseKey) {
        // Remove subscription access
        const response = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${customerEmail}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
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
