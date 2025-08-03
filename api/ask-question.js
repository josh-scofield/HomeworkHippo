// api/ask-question.js - Secure backend API for Vercel
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { question, imageData, imageType } = req.body;

    if (!question && !imageData) {
      return res.status(400).json({ error: 'Question or image is required' });
    }

    // Get API key from environment variables (secure!)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Prepare message for Claude
    const messages = [{
      role: 'user',
      content: []
    }];

    // Add text content
    if (question) {
      messages[0].content.push({
        type: 'text',
        text: `Please help me solve this science homework problem step by step. Provide a detailed explanation that helps me understand the concepts and learn how to solve similar problems in the future. Here's my question: ${question}`
      });
    }

    // Add image if provided
    if (imageData && imageType) {
      messages[0].content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageType,
          data: imageData
        }
      });
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: messages,
        system: `You are an expert science tutor helping students with homework. Always:
1. Provide step-by-step solutions
2. Explain the underlying concepts
3. Include relevant formulas or principles
4. Give tips for solving similar problems
5. Use clear, educational language appropriate for students
6. Format your response with clear headings and structure
7. If it's not a science question, politely redirect to science topics`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return res.status(500).json({ error: 'Failed to get response from AI' });
    }

    const data = await response.json();
    
    // Return the response
    res.status(200).json({
      success: true,
      response: data.content[0].text
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
