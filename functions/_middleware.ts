export const onRequest = async (context: any) => {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // If it's an API request, let the specific function handle it
  if (url.pathname.startsWith('/api/')) {
    return next();
  }

  // Try to serve the static asset
  const response = await next();

  // If asset not found (404), serve index.html for SPA routing
  if (response.status === 404) {
    const indexUrl = new URL('/index.html', request.url);
    return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
  }

  return response;
};
