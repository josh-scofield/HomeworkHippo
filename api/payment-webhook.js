module.exports = async function handler(req, res) {
  console.log('Webhook received:', req.body.type);
  
  // Get credentials
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  try {
    const event = req.body;
    
    // Handle subscription events
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated') {
      
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      console.log('Customer ID:', customerId);
      
      // Fetch customer details from Stripe to get email
      let customerEmail = null;
      
      if (stripeSecretKey) {
        const customerResponse = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          }
        });
        
        if (customerResponse.ok) {
          const customer = await customerResponse.json();
          customerEmail = customer.email;
          console.log('Found customer email:', customerEmail);
        }
      } else {
        console.error('STRIPE_SECRET_KEY not configured');
      }
      
      if (customerEmail && supabaseUrl && supabaseKey) {
        // Detect plan type from price ID
        const priceId = subscription.items.data[0].price.id;
        let planType = 'basic'; // default

        if (priceId === process.env.STRIPE_UNLIMITED_MONTHLY || 
            priceId === process.env.STRIPE_UNLIMITED_YEARLY) {
          planType = 'unlimited';
        }

        // Update user in Supabase
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
            stripe_customer_id: customerId,
            plan_type: planType
          })
        });
        
        if (response.ok) {
          console.log('User subscription activated:', customerEmail);
          fetch('https://homework-hippo.vercel.app/api/send-email.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: customerEmail,
              type: 'welcome'
            })
          }).catch(err => console.log('Email send failed:', err));
        } else {
          console.error('Failed to update user:', await response.text());
        }
      } else {
        console.error('Missing email or credentials');
      }
      
    } else if (event.type === 'customer.subscription.deleted') {
      
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      // Fetch customer email from Stripe
      let customerEmail = null;
      
      if (stripeSecretKey) {
        const customerResponse = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          }
        });
        
        if (customerResponse.ok) {
          const customer = await customerResponse.json();
          customerEmail = customer.email;
        }
      }
      
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
        fetch('https://homework-hippo.vercel.app/api/send-email.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: customerEmail,
            type: 'cancelled'
          })
        }).catch(err => console.log('Email send failed:', err));
      }
    }
    
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook failed' });
  }
};
