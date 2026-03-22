import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';

const app = new Hono();

app.onError((err, c) => {
  console.error('Hono Error:', err);
  return c.text(`Internal Server Error: ${err.message}`, 500);
});

// Enable CORS
app.use('/api/*', cors());

const sanitizeKey = (key: any) => {
  if (!key || typeof key !== 'string') return '';
  let sanitized = key.trim();
  return sanitized.replace(/^Bearer\s+/i, '');
};

const getApiKey = (c: any) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader) return sanitizeKey(authHeader);
  
  const queryKey = c.req.query('apiKey');
  if (queryKey) return sanitizeKey(queryKey);
  
  const env = c.env as any;
  return env?.SUNO_API_KEY || env?.API_KEY || '';
};

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', environment: 'cloudflare-worker' }));

// Suno API Proxy logic
app.post('/api/suno/generate', async (c) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const body = await c.req.json();
    const { apiKey: rawApiKey, baseUrl, ...payload } = body;
    
    let apiKey = sanitizeKey(rawApiKey);
    if (!apiKey) {
      apiKey = getApiKey(c);
    }

    if (!apiKey) {
      return c.json({ error: 'API Key is required' }, 400);
    }

    let apiUrl = baseUrl || 'https://api.sunoapi.org/api/v1';
    
    if (apiUrl.includes('sunoapi.org') && !apiUrl.includes('api.sunoapi.org')) {
      apiUrl = apiUrl.replace('sunoapi.org', 'api.sunoapi.org');
    }
    if (apiUrl === 'https://api.sunoapi.org' || apiUrl === 'https://api.sunoapi.org/') {
      apiUrl = 'https://api.sunoapi.org/api/v1';
    }
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }
    
    const sunoPayload = {
      customMode: true,
      instrumental: !!payload.make_instrumental,
      model: payload.model || "V4_5ALL",
      prompt: payload.prompt || "",
      style: payload.tags || "",
      title: payload.title || "",
      negativeTags: payload.negativeTags || "",
      vocalGender: payload.vocalGender || "",
      styleWeight: payload.styleWeight ?? 0.65,
      weirdnessConstraint: payload.weirdnessConstraint ?? 0.65,
      audioWeight: payload.audioWeight ?? 0.65,
      callBackUrl: payload.callBackUrl || "https://example.com/callback"
    };

    const response = await fetch(`${apiUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify(sunoPayload),
      signal: controller.signal
    });

    const data = await response.json();
    
    if (response.status === 401 || response.status === 403) {
      const retryResponse = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify(sunoPayload),
        signal: controller.signal
      });
      if (retryResponse.ok) {
        clearTimeout(timeoutId);
        return c.json(await retryResponse.json());
      }
    }

    clearTimeout(timeoutId);
    return c.json(data, response.status as any);
  } catch (error: any) {
    clearTimeout(timeoutId);
    return c.json({ error: error.message || 'Failed to generate music' }, 500);
  }
});

// WAV Generate
app.post('/api/suno/wav/generate', async (c) => {
  try {
    const body = await c.req.json();
    const { apiKey: rawApiKey, baseUrl, taskId, audioId, callBackUrl } = body;
    let apiKey = sanitizeKey(rawApiKey) || getApiKey(c);

    if (!apiKey) return c.json({ error: 'API Key is required' }, 400);

    let apiUrl = baseUrl || 'https://api.sunoapi.org/api/v1';
    const response = await fetch(`${apiUrl}/wav/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taskId, audioId, callBackUrl: callBackUrl || 'https://example.com/callback' })
    });

    return c.json(await response.json(), response.status as any);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to generate WAV' }, 500);
  }
});

// Status Test
app.get('/api/suno/status/test', async (c) => {
  try {
    const rawApiKey = c.req.header('Authorization') || null;
    let apiKey = sanitizeKey(rawApiKey) || getApiKey(c);
    let apiUrl = c.req.query('baseUrl') || 'https://api.sunoapi.org/api/v1';

    if (!apiKey) return c.json({ error: 'API Key is required' }, 400);

    if (apiUrl.includes('sunoapi.org') && !apiUrl.includes('api.sunoapi.org')) {
      apiUrl = apiUrl.replace('sunoapi.org', 'api.sunoapi.org');
    }
    if (apiUrl === 'https://api.sunoapi.org' || apiUrl === 'https://api.sunoapi.org/') {
      apiUrl = 'https://api.sunoapi.org/api/v1';
    }
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }

    const testUrls = [`${apiUrl}/limit`, `${apiUrl}/feed`, `${apiUrl}/generate/record-info?taskId=test`];
    
    for (const testUrl of testUrls) {
      const response = await fetch(testUrl, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });

      if (response.ok) {
        return c.json({ success: true, data: await response.json() });
      }
      
      if (response.status === 401 || response.status === 403) {
        // Try without Bearer
        const retryResponse = await fetch(testUrl, {
          headers: { 
            'Authorization': apiKey,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0'
          }
        });
        if (retryResponse.ok) {
          return c.json({ success: true, data: await retryResponse.json() });
        }
      }
    }

    return c.json({ success: false, error: 'Failed to reach API or invalid key' }, 401);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Status Check
app.get('/api/suno/status/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const rawApiKey = c.req.header('Authorization') || null;
    let apiKey = sanitizeKey(rawApiKey) || getApiKey(c);
    let apiUrl = c.req.query('baseUrl') || 'https://api.sunoapi.org/api/v1';

    const response = await fetch(`${apiUrl}/generate/record-info?taskId=${id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    return c.json(await response.json(), response.status as any);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Audio Proxy
app.get('/api/proxy/audio', async (c) => {
  try {
    const audioUrl = c.req.query('url');
    if (!audioUrl) return c.text('URL required', 400);

    const response = await fetch(audioUrl);
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, { status: response.status, headers });
  } catch (error: any) {
    return c.text('Proxy failed', 500);
  }
});

// @ts-ignore
import manifest from '__STATIC_CONTENT_MANIFEST';

// Serve static files from the bucket
app.get('/assets/*', async (c, next) => {
  const env = c.env as any;
  if (env && env.ASSETS) {
    return env.ASSETS.fetch(c.req.raw);
  }
  const serve = serveStatic({ root: './', manifest });
  return serve(c, next);
});

app.get('/*', async (c, next) => {
  const env = c.env as any;
  if (env && env.ASSETS) {
    const response = await env.ASSETS.fetch(c.req.raw);
    if (response.status < 400) {
      return response;
    }
    return next();
  }
  
  const serve = serveStatic({ root: './', manifest });
  return serve(c, next);
});

// Fallback to index.html for SPA routing
app.get('*', async (c, next) => {
  const env = c.env as any;
  if (env && env.ASSETS) {
    const url = new URL(c.req.url);
    url.pathname = '/index.html';
    return env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
  }
  
  const serve = serveStatic({ path: 'index.html', manifest });
  return serve(c, next);
});

export default app;
