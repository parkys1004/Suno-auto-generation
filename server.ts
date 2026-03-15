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
    let sanitized = key.replace(/[^\x20-\x7E]/g, '').trim();
    if (sanitized.toLowerCase().startsWith('bearer ')) {
      sanitized = sanitized.slice(7).trim();
    }
    return sanitized;
  };

  // API route to proxy requests to Suno API
  app.post(['/api/suno/generate', '/api/suno/generate/'], async (req, res) => {
    try {
      const { apiKey: rawApiKey, prompt, make_instrumental, tags, title, baseUrl, model, negativeTags, vocalGender } = req.body;
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
        styleWeight: 0.65,
        weirdnessConstraint: 0.65,
        audioWeight: 0.65,
        callBackUrl: "https://example.com/callback"
      };

      const performRequest = async (url: string) => {
        console.log(`Proxying generate to: ${url}`);
        return await axios.post(
          url,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
            validateStatus: (status) => status < 500 // Don't throw on 4xx
          }
        );
      };

      let response = await performRequest(`${apiUrl}/generate`);
      
      // If 405 Method Not Allowed, try with trailing slash
      if (response.status === 405) {
        console.log('Received 405, retrying with trailing slash...');
        response = await performRequest(`${apiUrl}/generate/`);
      }

      // If still error, return it
      if (response.status >= 400) {
        return res.status(response.status).json(response.data);
      }

      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const data = error.response?.data;
      console.error(`Suno API Error (${status}):`, data || error.message);
      res.status(status).json({
        error: data?.message || data?.error || error.message || 'Failed to generate music',
        details: data
      });
    }
  });

  app.post(['/api/suno/wav/generate', '/api/suno/wav/generate/'], async (req, res) => {
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

      const performRequest = async (url: string) => {
        console.log(`Proxying WAV generate to: ${url}`);
        return await axios.post(
          url,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
            validateStatus: (status) => status < 500
          }
        );
      };

      let response = await performRequest(`${apiUrl}/wav/generate`);
      
      if (response.status === 405) {
        console.log('Received 405, retrying with trailing slash...');
        response = await performRequest(`${apiUrl}/wav/generate/`);
      }

      if (response.status >= 400) {
        return res.status(response.status).json(response.data);
      }

      res.json(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const data = error.response?.data;
      console.error(`Suno WAV API Error (${status}):`, data || error.message);
      res.status(status).json({
        error: data?.message || data?.error || error.message || 'Failed to generate WAV',
        details: data
      });
    }
  });

  app.get(['/api/suno/status/:id', '/api/suno/status/:id/'], async (req, res) => {
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
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: 15000
        });
        return res.json(response.data);
      } catch (innerError: any) {
        // If it's a 404 or 405, try the other common endpoint
        if (innerError.response?.status === 404 || innerError.response?.status === 405) {
          const fallbackUrl = `${apiUrl}/status/${id}`;
          console.log(`Retrying status check with fallback: ${fallbackUrl}`);
          const fallbackResponse = await axios.get(fallbackUrl, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: 15000
          });
          return res.json(fallbackResponse.data);
        }
        throw innerError;
      }
    } catch (error: any) {
      const status = error.response?.status || 500;
      const data = error.response?.data;
      console.error(`Suno Status API Error (${status}):`, data || error.message);
      res.status(status).json({
        error: data?.message || data?.error || error.message || 'Failed to check status',
        details: data
      });
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
