import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';

const app = new Hono().basePath('/api');

// Enable CORS
app.use('*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'ok', environment: 'cloudflare-pages' }));

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

// Suno API Proxy logic
app.post('/suno/generate', async (c) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const body = await c.req.json();
    const { 
      apiKey: rawApiKey, 
      baseUrl, 
      ...payload 
    } = body;
    
    // Try to get API key from request, then from environment
    let apiKey = sanitizeKey(rawApiKey);
    if (!apiKey) {
      apiKey = getApiKey(c);
    }

    if (!apiKey) {
      return c.json({ error: 'API Key is required' }, 400);
    }

    let apiUrl = baseUrl || 'https://api.sunoapi.org/api/v1';
    
    // Fix common user mistakes with baseUrl
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
      personaId: payload.personaId || undefined,
      personaModel: payload.personaModel || undefined,
      styleWeight: payload.styleWeight !== undefined ? payload.styleWeight : 0.65,
      weirdnessConstraint: payload.weirdnessConstraint !== undefined ? payload.weirdnessConstraint : 0.65,
      audioWeight: payload.audioWeight !== undefined ? payload.audioWeight : 0.65,
      callBackUrl: payload.callBackUrl || "https://example.com/callback"
    };

    const response = await fetch(`${apiUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(sunoPayload),
      signal: controller.signal
    });

    const data = await response.json();
    
    // Retry logic if 401 or 403
    if (response.status === 401 || response.status === 403) {
      const retryResponse = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey, // Try without Bearer
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
    if (error.name === 'AbortError') {
      return c.json({ error: 'Request timeout' }, 504);
    }
    return c.json({ error: error.message || 'Failed to generate music' }, 500);
  }
});

app.post('/suno/wav/generate', async (c) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const body = await c.req.json();
    const { apiKey: rawApiKey, baseUrl, taskId, audioId, callBackUrl } = body;
    
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
    
    const payload = {
      taskId,
      audioId,
      callBackUrl: callBackUrl || 'https://example.com/callback'
    };

    const response = await fetch(`${apiUrl}/wav/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return c.json(await response.json(), response.status as any);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return c.json({ error: 'Request timeout' }, 504);
    }
    return c.json({ error: error.message || 'Failed to generate WAV' }, 500);
  }
});

app.get('/suno/status/test', async (c) => {
  try {
    const rawApiKey = c.req.header('Authorization')?.split(' ')[1] || null;
    let apiKey = sanitizeKey(rawApiKey);
    if (!apiKey) {
      apiKey = getApiKey(c);
    }

    let apiUrl = c.req.query('baseUrl') || 'https://api.sunoapi.org/api/v1';

    if (!apiKey) {
      return c.json({ error: 'API Key is required' }, 400);
    }

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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (retryResponse.ok) {
          return c.json({ success: true, data: await retryResponse.json() });
        }
      }
    }
    
    return c.json({ success: false, error: 'Failed to reach API or invalid key' }, 401);
  } catch (error: any) {
    return c.json({ error: error.message || 'Invalid API Key' }, 500);
  }
});

app.get('/suno/status/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const rawApiKey = c.req.header('Authorization')?.split(' ')[1] || null;
    let apiKey = sanitizeKey(rawApiKey);
    if (!apiKey) {
      apiKey = getApiKey(c);
    }

    let apiUrl = c.req.query('baseUrl') || 'https://api.sunoapi.org/api/v1';

    if (!apiKey) {
      return c.json({ error: 'API Key is required' }, 400);
    }

    if (apiUrl.includes('sunoapi.org') && !apiUrl.includes('api.sunoapi.org')) {
      apiUrl = apiUrl.replace('sunoapi.org', 'api.sunoapi.org');
    }
    if (apiUrl === 'https://api.sunoapi.org' || apiUrl === 'https://api.sunoapi.org/') {
      apiUrl = 'https://api.sunoapi.org/api/v1';
    }
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }

    const statusUrl = `${apiUrl}/generate/record-info?taskId=${id}`;
    const fallbackUrl = `${apiUrl}/status/${id}`;

    let response = await fetch(statusUrl, {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok && (response.status === 404 || response.status === 405)) {
      response = await fetch(fallbackUrl, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
    }

    return c.json(await response.json(), response.status as any);
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to check status' }, 500);
  }
});

app.get('/proxy/audio', async (c) => {
  try {
    const audioUrl = c.req.query('url');
    if (!audioUrl) {
      return c.text('Valid URL is required', 400);
    }

    const response = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://suno.com/',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      return c.text(`Proxy target error: ${response.status}`, response.status as any);
    }

    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=3600');

    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error: any) {
    return c.text('Failed to proxy audio', 500);
  }
});

export const onRequest = handle(app);

