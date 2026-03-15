export const onRequest = async (context: any) => {
  const { request, params } = context;
  const id = params.id;
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const url = new URL(request.url);
  const baseUrl = url.searchParams.get('baseUrl');
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
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
    let response = await fetch(statusUrl, {
      method: 'GET',
      headers: { 'Authorization': authHeader }
    });

    if (response.status === 404 || response.status === 405) {
      const fallbackUrl = `${apiUrl}/status/${id}`;
      response = await fetch(fallbackUrl, {
        method: 'GET',
        headers: { 'Authorization': authHeader }
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Failed to check status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
