export const onRequest = async (context: any) => {
  const { request } = context;
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const body: any = await request.json();
    const { apiKey: rawApiKey, baseUrl, taskId, audioId, callBackUrl } = body;

    const sanitizeKey = (key: string | null) => {
      if (!key) return '';
      let sanitized = key.replace(/[^\x20-\x7E]/g, '').trim();
      if (sanitized.toLowerCase().startsWith('bearer ')) {
        sanitized = sanitized.slice(7).trim();
      }
      return sanitized;
    };

    const apiKey = sanitizeKey(rawApiKey);

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API Key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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

    const performRequest = async (url: string) => {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    };

    let response = await performRequest(`${apiUrl}/wav/generate`);
    
    if (response.status === 405) {
      response = await performRequest(`${apiUrl}/wav/generate/`);
    }

    const data = await response.text();
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      jsonData = { message: data };
    }

    return new Response(JSON.stringify(jsonData), {
      status: response.status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate WAV' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
