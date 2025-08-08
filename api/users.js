export default async function handler(req, res) {
  // Allow all origins for now
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  // Check if we have the credentials
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return res.status(500).json({ 
      error: 'Database not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel environment variables.'
    });
  }

  try {
    if (req.method === 'POST') {
      const { email, name, password, action } = req.body;
      
      if (action === 'signup') {
        console.log('Attempting signup for:', email);
        
        // Create the trial end date (7 days from now)
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 7);
        
        // Create new user in Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            email: email,
            name: name,
            password: password,
            subscribed: false,
            trial_end: trialEnd.toISOString(),
            questions_used: 0
          })
        });

        const responseText = await response.text();
        console.log('Supabase response:', response.status, responseText);

        if (response.ok) {
          const userData = JSON.parse(responseText);
          return res.status(200).json({ 
            success: true, 
            user: userData[0] || userData 
          });
        } else {
          // Check if user already exists
          if (responseText.includes('duplicate') || responseText.includes('unique')) {
            return res.status(400).json({ 
              error: 'This email is already registered. Please sign in instead.' 
            });
          }
          return res.status(400).json({ 
            error: 'Signup failed', 
            details: responseText 
          });
        }
      }
      
      if (action === 'login') {
        console.log('Attempting login for:', email);
        
        // Find user by email and password
        const response = await fetch(
          `${supabaseUrl}/rest/v1/users?email=eq.${email}&password=eq.${password}`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );

        const users = await response.json();
        console.log('Found users:', users.length);
        
        if (users && users.length > 0) {
          return res.status(200).json({ 
            success: true, 
            user: users[0] 
          });
        } else {
          return res.status(401).json({ 
            error: 'Invalid email or password' 
          });
        }
      }
    }

    return res.status(400).json({ error: 'Invalid request' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
}
