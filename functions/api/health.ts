export const onRequest = async () => {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    environment: 'cloudflare',
    timestamp: new Date().toISOString()
  }), {
    headers: { 
      'Content-Type': 'application/json', 
      'Access-Control-Allow-Origin': '*' 
    }
  });
};
