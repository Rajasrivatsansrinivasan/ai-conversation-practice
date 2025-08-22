// /api/chat.js — Vercel Serverless Function (keeps your GROQ_API_KEY private)
export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic guardrails
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'Server not configured: GROQ_API_KEY missing' });
  }

  try {
    const {
      messages,
      model = 'llama3-70b-8192',
      max_tokens = 200,
      temperature = 0.8,
      top_p = 0.9,
      stream = false
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Optional: very light payload sanity limits
    if (messages.length > 30) {
      return res.status(400).json({ error: 'too many messages in a single request' });
    }

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
        top_p,
        stream
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text);
    }

    // No caching of responses
    res.setHeader('Cache-Control', 'no-store');

    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
