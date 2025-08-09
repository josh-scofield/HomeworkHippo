export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!stripeSecretKey || !supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Get user from Supabase to find stripe_customer_id
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${email}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const users = await userResponse.json();
    
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const customerId = user.stripe_customer_id;

    if (!customerId) {
      return res.status(400).json({ error: 'No subscription found' });
    }

    // Get customer's subscriptions from Stripe
    const subscriptionsResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        }
      }
    );

    const subscriptions = await subscriptionsResponse.json();

    if (!subscriptions.data || subscriptions.data.length === 0) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    // Cancel the first active subscription
    const subscriptionId = subscriptions.data[0].id;
    
    const cancelResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'cancel_at_period_end=true'
      }
    );

    if (cancelResponse.ok) {
      console.log('Subscription cancelled for:', email);
      return res.status(200).json({ 
        success: true, 
        message: 'Subscription will cancel at end of billing period' 
      });
    } else {
      const error = await cancelResponse.text();
      console.error('Stripe cancellation error:', error);
      return res.status(500).json({ error: 'Failed to cancel subscription' });
    }

  } catch (error) {
    console.error('Cancellation error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
