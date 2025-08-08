export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // DEBUG: Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  console.log('Supabase URL exists:', !!supabaseUrl);
  console.log('Supabase Key exists:', !!supabaseKey);
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ 
      error: 'Environment variables missing',
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey
    });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Database configuration missing' });
  }

  try {
    if (req.method === 'POST') {
      const { email, name, password, action, subscribed, stripeCustomerId } = req.body;
      
      if (action === 'signup') {
        // Create new user
        const response = await fetch(`${supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            email,
            name,
            password,
            subscribed: false,
            trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            questions_used: 0
          })
        });

        if (response.ok) {
          const userData = await response.json();
          return res.status(200).json({ success: true, user: userData[0] });
          
        } else {
      const error = await response.json();
      console.error('Supabase error:', error);
      // Return detailed error to frontend for debugging
      return res.status(400).json({ 
        error: 'Database error', 
        details: error,
        status: response.status,
        statusText: response.statusText
      });
    }
      
      if (action === 'login') {
        // Find user by email and password
        const response = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${email}&password=eq.${password}`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        const users = await response.json();
        if (users.length > 0) {
          return res.status(200).json({ success: true, user: users[0] });
        } else {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      }
      
      if (action === 'updateSubscription') {
        // Update user subscription status
        const response = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${email}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            subscribed,
            stripe_customer_id: stripeCustomerId
          })
        });

        if (response.ok) {
          const userData = await response.json();
          return res.status(200).json({ success: true, user: userData[0] });
        } else {
          return res.status(400).json({ error: 'Update failed' });
        }
      }
    }

    if (req.method === 'GET') {
      // Get user by email
      const email = req.query.email;
      const response = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${email}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      const users = await response.json();
      if (users.length > 0) {
        return res.status(200).json({ success: true, user: users[0] });
      } else {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    return res.status(400).json({ error: 'Invalid request' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
