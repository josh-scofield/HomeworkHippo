export default async function handler(req, res) {
    const { token } = req.query;
    
    if (!token) {
        return res.redirect('/?error=invalid-token');
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    try {
        // Find user with this token
        const response = await fetch(
            `${supabaseUrl}/rest/v1/users?verification_token=eq.${token}`,
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            }
        );
        
        const users = await response.json();
        
        if (users && users.length > 0) {
            // Mark as verified
            await fetch(
                `${supabaseUrl}/rest/v1/users?id=eq.${users[0].id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${supabaseKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email_verified: true,
                        verification_token: null
                    })
                }
            );
            
            // Redirect to success with message
            return res.redirect('/?verified=true&message=Email verified successfully!');
        }
        
        return res.redirect('/?error=invalid-token');
    } catch (error) {
        console.error('Verification error:', error);
        return res.redirect('/?error=verification-failed');
    }
}
