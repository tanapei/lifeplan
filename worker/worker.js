const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);

    if (request.method !== 'POST' || url.pathname !== '/api/chat') {
      return new Response('Not Found', { status: 404, headers: CORS });
    }

    if (!env.CLAUDE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'CLAUDE_API_KEY is not configured. Run: wrangler secret put CLAUDE_API_KEY' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    // Forward to Claude API
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    return new Response(claudeRes.body, {
      status: claudeRes.status,
      headers: {
        'Content-Type': claudeRes.headers.get('Content-Type') ?? 'application/json',
        ...CORS,
      },
    });
  },
};
