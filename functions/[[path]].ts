export const onRequest = async (context: any) => {
  const { request, next, env } = context;
  
  // Try to serve the static asset first
  const response = await next();
  
  // If the asset is not found (404), and it's not an API request,
  // serve the index.html as a fallback for SPA routing.
  const url = new URL(request.url);
  if (response.status === 404 && !url.pathname.startsWith('/api/')) {
    const indexUrl = new URL('/index.html', request.url);
    return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
  }
  
  return response;
};
