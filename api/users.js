// api/users.js - User database management
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Simple in-memory user storage (we'll enhance this)
    // In production, this would be a real database
    const users = global.users || (global.users = new Map());

    if (req.method === 'POST') {
      // Create or update user
      const { email, name, password, action } = req.body;
      
      if (action === 'signup') {
        const user = {
          email,
          name,
          password,
          subscribed: false,
          stripeCustomerId: null,
          trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          questionsUsed: 0,
          createdAt: new Date().toISOString()
        };
        
        users.set(email, user);
        return res.status(200).json({ success: true, user });
      }
      
      if (action === 'login') {
        const user = users.get(email);
        if (user && user.password === password) {
          return res.status(200).json({ success: true, user });
        }
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      if (action === 'updateSubscription') {
        const user = users.get(email);
        if (user) {
          user.subscribed = req.body.subscribed;
          user.stripeCustomerId = req.body.stripeCustomerId;
          users.set(email, user);
          return res.status(200).json({ success: true, user });
        }
      }
    }

    if (req.method === 'GET') {
      // Get user by email
      const email = req.query.email;
      const user = users.get(email);
      if (user) {
        return res.status(200).json({ success: true, user });
      }
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(400).json({ error: 'Invalid request' });

  } catch (error) {
    console.error('User API error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
