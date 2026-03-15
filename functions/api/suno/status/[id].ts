export const onRequest = async (context: any) => {
  const { request, params } = context;
  const id = params.id;
  const method = request.method.toUpperCase();
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  if (method !== 'GET') {
    return new Response(JSON.stringify({ error: `Method ${method} Not Allowed` }), {
      status: 405,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });
  }
  
  const url = new URL(request.url);
  const baseUrl = url.searchParams.get('baseUrl');
  const authHeader = request.headers.get('Authorization');

  const sanitizeKey = (key: string | null) => {
    if (!key) return '';
    let sanitized = key.replace(/[^\x20-\x7E]/g, '').trim();
    if (sanitized.toLowerCase().startsWith('bearer ')) {
      sanitized = sanitized.slice(7).trim();
    }
    return sanitized;
  };

  const apiKey = sanitizeKey(authHeader?.split(' ')[1] || null);

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Authorization header is required' }), {
      status: 401,
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

  const statusUrl = `${apiUrl}/generate/record-info?taskId=${id}`;
  
  try {
    const performRequest = async (url: string) => {
      return await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
    };

    let response = await performRequest(statusUrl);

    if (response.status === 404 || response.status === 405) {
      const fallbackUrl = `${apiUrl}/status/${id}`;
      response = await performRequest(fallbackUrl);
    }
    
    // One more try with trailing slash if still 405
    if (response.status === 405) {
      response = await performRequest(`${apiUrl}/generate/record-info/?taskId=${id}`);
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
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Failed to check status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
