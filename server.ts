import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  const sanitizeKey = (key: string | null) => {
    if (!key) return '';
    // Be less restrictive with characters, just trim and remove potential "Bearer " prefix
    let sanitized = key.trim();
    if (sanitized.toLowerCase().startsWith('bearer ')) {
      sanitized = sanitized.slice(7).trim();
    }
    return sanitized;
  };

  // API route to proxy requests to Suno API
  app.post('/api/suno/generate', async (req, res) => {
    try {
      const { 
        apiKey: rawApiKey, 
        prompt, 
        make_instrumental, 
        tags, 
        title, 
        baseUrl, 
        model, 
        negativeTags, 
        vocalGender,
        personaId,
        personaModel,
        styleWeight,
        weirdnessConstraint,
        audioWeight,
        callBackUrl
      } = req.body;
      const apiKey = sanitizeKey(rawApiKey);

      if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required' });
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
      
      const payload = {
        customMode: true,
        instrumental: !!make_instrumental,
        model: model || "V4_5ALL",
        prompt: prompt || "",
        style: tags || "",
        title: title || "",
        negativeTags: negativeTags || "",
        vocalGender: vocalGender || "",
        personaId: personaId || undefined,
        personaModel: personaModel || undefined,
        styleWeight: styleWeight !== undefined ? styleWeight : 0.65,
        weirdnessConstraint: weirdnessConstraint !== undefined ? weirdnessConstraint : 0.65,
        audioWeight: audioWeight !== undefined ? audioWeight : 0.65,
        callBackUrl: callBackUrl || "https://example.com/callback"
      };

      console.log(`Proxying generate to: ${apiUrl}/generate`);
      console.log(`Payload:`, JSON.stringify({ ...payload, prompt: payload.prompt?.substring(0, 20) + '...' }));

      const response = await axios.post(
        `${apiUrl}/generate`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 45000 // Increase timeout slightly
        }
      );

      console.log(`Suno API Success:`, response.data);
      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const data = error.response?.data;
      console.error(`Suno API Error (${status}):`, JSON.stringify(data) || error.message);
      
      // If it's a 401, maybe the provider doesn't want the "Bearer " prefix?
      // Some providers just want the key in the Authorization header.
      if (status === 401 && !req.query.retry) {
        console.log('Retrying without Bearer prefix...');
        try {
          const { apiKey: rawApiKey, ...rest } = req.body;
          const apiKey = sanitizeKey(rawApiKey);
          const apiUrl = req.body.baseUrl || 'https://api.sunoapi.org/api/v1';
          const response = await axios.post(
            `${apiUrl}/generate`,
            req.body, // Use original body
            {
              headers: {
                'Authorization': apiKey, // Try without Bearer
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              },
              timeout: 45000
            }
          );
          return res.json(response.data);
        } catch (retryError: any) {
          console.error('Retry failed:', retryError.message);
        }
      }

      res.status(status).json({
        error: data?.message || data?.error || error.message || 'Failed to generate music',
        details: data,
        code: data?.code || status
      });
    }
  });

  app.post('/api/suno/wav/generate', async (req, res) => {
    try {
      const { apiKey: rawApiKey, baseUrl, taskId, audioId, callBackUrl } = req.body;
      const apiKey = sanitizeKey(rawApiKey);

      if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required' });
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

      console.log(`Proxying WAV generate to: ${apiUrl}/wav/generate`);
      const response = await axios.post(
        `${apiUrl}/wav/generate`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 30000
        }
      );

      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const data = error.response?.data;
      console.error(`Suno WAV API Error (${status}):`, JSON.stringify(data) || error.message);
      res.status(status).json({
        error: data?.message || data?.error || error.message || 'Failed to generate WAV',
        details: data,
        code: data?.code || status
      });
    }
  });

  app.get('/api/suno/status/test', async (req, res) => {
    try {
      const apiKey = sanitizeKey(req.headers.authorization?.split(' ')[1] || null);
      let apiUrl = req.query.baseUrl as string || 'https://api.sunoapi.org/api/v1';

      if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required' });
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

      // Use a simple endpoint to test the key
      let testUrl = `${apiUrl}/limit`;
      console.log(`Testing Suno API key at: ${testUrl}`);
      
      let response;
      try {
        response = await axios.get(testUrl, {
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 10000
        });
      } catch (error: any) {
        // If /limit is not found, try /feed as a fallback
        if (error.response?.status === 404) {
          console.log('/limit not found, trying /feed...');
          testUrl = `${apiUrl}/feed`;
          try {
            response = await axios.get(testUrl, {
              headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              },
              timeout: 10000
            });
          } catch (feedError: any) {
            // If /feed is also not found, try a generic status check as last resort
            if (feedError.response?.status === 404) {
              console.log('/feed not found, trying /generate/record-info...');
              testUrl = `${apiUrl}/generate/record-info?taskId=test`;
              try {
                response = await axios.get(testUrl, {
                  headers: { 
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                  },
                  timeout: 10000
                });
              } catch (lastError: any) {
                // If we get a 401/403, it means the key is invalid
                // If we get a 400 or 404 (but with a valid API response structure), the key might be valid
                if (lastError.response?.status === 401 || lastError.response?.status === 403) {
                  throw lastError;
                }
                // If it's a 404, it might be that the test endpoint is missing but the API is there
                if (lastError.response?.status === 404 || lastError.response?.data?.code === 404 || lastError.response?.data?.msg?.includes('not found')) {
                   return res.json({ success: true, message: 'API reached, but test endpoint not found. Key might be valid.' });
                }
                throw lastError;
              }
            } else {
              throw feedError;
            }
          }
        } else {
          throw error;
        }
      }
      
      res.json({ success: true, data: response.data });
    } catch (error: any) {
      const status = error.response?.status || 500;
      const data = error.response?.data;
      console.error(`Suno Test API Error (${status}):`, JSON.stringify(data) || error.message);
      
      // If 401, try without Bearer
      if (status === 401) {
        try {
          const apiKey = sanitizeKey(req.headers.authorization?.split(' ')[1] || null);
          let apiUrl = req.query.baseUrl as string || 'https://api.sunoapi.org/api/v1';
          let retryUrl = `${apiUrl}/limit`;
          let retryResponse;
          try {
            retryResponse = await axios.get(retryUrl, {
              headers: { 
                'Authorization': apiKey,
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              },
              timeout: 10000
            });
          } catch (retryError: any) {
            if (retryError.response?.status === 404) {
              retryUrl = `${apiUrl}/feed`;
              try {
                retryResponse = await axios.get(retryUrl, {
                  headers: { 
                    'Authorization': apiKey,
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                  },
                  timeout: 10000
                });
              } catch (retryFeedError: any) {
                if (retryFeedError.response?.status === 404) {
                  retryUrl = `${apiUrl}/generate/record-info?taskId=test`;
                  try {
                    retryResponse = await axios.get(retryUrl, {
                      headers: { 
                        'Authorization': apiKey,
                        'Accept': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                      },
                      timeout: 10000
                    });
                  } catch (retryLastError: any) {
                    if (retryLastError.response?.status === 401 || retryLastError.response?.status === 403) {
                      throw retryLastError;
                    }
                    if (retryLastError.response?.status === 404 || retryLastError.response?.data?.code === 404 || retryLastError.response?.data?.msg?.includes('not found')) {
                       return res.json({ success: true, message: 'API reached, but test endpoint not found. Key might be valid.' });
                    }
                    throw retryLastError;
                  }
                } else {
                  throw retryFeedError;
                }
              }
            } else {
              throw retryError;
            }
          }
          return res.json({ success: true, data: retryResponse.data });
        } catch (retryError) {
          // Ignore retry error
        }
      }

      res.status(status).json({
        success: false,
        error: data?.message || data?.error || error.message || 'Invalid API Key',
        details: data,
        code: data?.code || status
      });
    }
  });

  app.get('/api/suno/status/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const apiKey = sanitizeKey(req.headers.authorization?.split(' ')[1] || null);
      let apiUrl = req.query.baseUrl as string || 'https://api.sunoapi.org/api/v1';

      if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required' });
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

      // Try the most common status endpoint first
      const statusUrl = `${apiUrl}/generate/record-info?taskId=${id}`;
      console.log(`Proxying status check to: ${statusUrl}`);
      
      try {
        const response = await axios.get(statusUrl, {
          headers: { 
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          timeout: 15000
        });
        return res.json(response.data);
      } catch (innerError: any) {
        // If it's a 404 or 405, try the other common endpoint
        if (innerError.response?.status === 404 || innerError.response?.status === 405) {
          const fallbackUrl = `${apiUrl}/status/${id}`;
          console.log(`Retrying status check with fallback: ${fallbackUrl}`);
          const fallbackResponse = await axios.get(fallbackUrl, {
            headers: { 
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 15000
          });
          return res.json(fallbackResponse.data);
        }
        throw innerError;
      }
    } catch (error: any) {
      const status = error.response?.status || 500;
      const data = error.response?.data;
      console.error(`Suno Status API Error (${status}):`, JSON.stringify(data) || error.message);
      res.status(status).json({
        error: data?.message || data?.error || error.message || 'Failed to check status',
        details: data,
        code: data?.code || status
      });
    }
  });

  // Proxy audio to avoid CORS issues
  app.get('/api/proxy/audio', async (req, res) => {
    try {
      const audioUrl = req.query.url as string;
      if (!audioUrl || audioUrl === 'undefined' || audioUrl === 'null' || audioUrl === '') {
        return res.status(400).send('Valid URL is required');
      }

      // Basic URL validation
      if (!audioUrl.startsWith('http')) {
        return res.status(400).send('Invalid URL format');
      }

      console.log(`Proxying audio request: ${audioUrl}`);
      const response = await axios({
        method: 'get',
        url: audioUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://suno.com/',
          'Accept': '*/*'
        },
        timeout: 20000,
        maxRedirects: 5
      });

      // Set appropriate headers
      const contentType = response.headers['content-type'] || 'audio/mpeg';
      res.setHeader('Content-Type', contentType);
      
      if (response.headers['content-length']) {
        res.setHeader('Content-Length', response.headers['content-length']);
      }
      
      // Enable range requests if possible
      if (response.headers['accept-ranges']) {
        res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
      }

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      response.data.pipe(res);

      // Handle stream errors
      response.data.on('error', (err: any) => {
        console.error('Stream error:', err.message);
        if (!res.headersSent) {
          res.status(500).send('Stream error');
        }
        res.end();
      });

    } catch (error: any) {
      console.error('Audio proxy error:', error.message);
      if (error.response) {
        console.error('Target API responded with:', error.response.status);
        return res.status(error.response.status).send(`Proxy target error: ${error.response.status}`);
      }
      res.status(500).send('Failed to proxy audio');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((req, res) => {
    if (req.url.startsWith('/api')) {
      console.warn(`404 - API Route not found: ${req.method} ${req.url}`);
      res.status(404).json({ error: 'API Route not found' });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
