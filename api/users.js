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
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    // Handle GET requests
    if (req.method === 'GET') {
      const email = req.query.email;
      
      if (!email) {
        return res.status(400).json({ error: 'Email parameter required' });
      }
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/users?email=eq.${email}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );

      if (response.ok) {
        const users = await response.json();
        if (users && users.length > 0) {
          // Check if month needs reset
          const user = users[0];
          const resetDate = new Date(user.month_reset_date);
          const now = new Date();
          
          // If it's been more than 30 days, reset the counter
          if ((now - resetDate) > 30 * 24 * 60 * 60 * 1000) {
            await fetch(
              `${supabaseUrl}/rest/v1/users?email=eq.${email}`,
              {
                method: 'PATCH',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  questions_this_month: 0,
                  month_reset_date: now.toISOString()
                })
              }
            );
            user.questions_this_month = 0;
          }
          
          return res.status(200).json({ success: true, user });
        } else {
          return res.status(404).json({ error: 'User not found' });
        }
      } else {
        return res.status(500).json({ error: 'Database error' });
      }
    }

    // Handle POST requests
    if (req.method === 'POST') {
      const { email, name, password, phone, action } = req.body;
      
      if (action === 'signup') {
        // Create verification token
        const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
        
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
            phone: phone ? phone.replace(/\D/g, '') : null, // Store only digits
            subscribed: false,
            trial_end: trialEnd.toISOString(),
            questions_used: 0,
            questions_this_month: 0,
            plan_type: 'trial',
            email_verified: false,
            verification_token: verificationToken,
            month_reset_date: new Date().toISOString()
          })
        });

        const responseText = await response.text();

        if (response.ok) {
          const userData = JSON.parse(responseText);
          
          // Send welcome email with verification link
          await fetch(`${process.env.VERCEL_URL || 'https://homeworkhippo.com'}/api/send-email.js`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: email,
              type: 'welcome_verification',
              verificationToken: verificationToken
            })
          }).catch(err => console.log('Email send failed:', err));
          
          return res.status(200).json({ 
            success: true, 
            user: userData[0] || userData 
          });
        } else {
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
      
      if (action === 'updateSubscription') {
        const updates = { 
          subscribed: req.body.subscribed,
          plan_type: req.body.planType || 'basic'
        };
        
        if (req.body.stripeCustomerId) {
          updates.stripe_customer_id = req.body.stripeCustomerId;
        }
        
        const response = await fetch(
          `${supabaseUrl}/rest/v1/users?email=eq.${email}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(updates)
          }
        );

        if (response.ok) {
          const userData = await response.json();
          return res.status(200).json({ 
            success: true, 
            user: userData[0] 
          });
        } else {
          return res.status(400).json({ error: 'Update failed' });
        }
      }
      
      if (action === 'incrementQuestions') {
        // Increment question counter
        const response = await fetch(
          `${supabaseUrl}/rest/v1/users?email=eq.${email}`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          }
        );
        
        const users = await response.json();
        if (users && users.length > 0) {
          const user = users[0];
          
          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/users?email=eq.${email}`,
            {
              method: 'PATCH',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
              },
              body: JSON.stringify({
                questions_this_month: (user.questions_this_month || 0) + 1,
                questions_used: (user.questions_used || 0) + 1
              })
            }
          );
          
          if (updateResponse.ok) {
            const updatedUser = await updateResponse.json();
            return res.status(200).json({ success: true, user: updatedUser[0] });
          }
        }
        
        return res.status(400).json({ error: 'Failed to update question count' });
      }
    }

    return res.status(400).json({ error: 'Invalid request method' });

  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
}
