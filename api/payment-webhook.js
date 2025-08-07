export default async function handler(req, res) {
  // Log everything for debugging
  console.log('Webhook called!');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  
  // Always respond with success to Stripe
  res.status(200).json({ 
    received: true, 
    timestamp: new Date().toISOString() 
  });
}
