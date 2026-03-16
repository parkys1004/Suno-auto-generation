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
    // Remove surrounding quotes if present
    if ((sanitized.startsWith('"') && sanitized.endsWith('"')) || 
        (sanitized.startsWith("'") && sanitized.endsWith("'"))) {
      sanitized = sanitized.slice(1, -1).trim();
    }
    if (sanitized.toLowerCase().startsWith('bearer ')) {
      sanitized = sanitized.slice(7).trim();
    }
    return sanitized;
  };

  // API route to proxy requests to Suno API
  app.post(/.*\/suno\/generate\/?$/, async (req, res) => {
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
        if (response.status === 401) {
          return res.status(401).json({
            error: 'API 인증 실패 (401 Unauthorized)',
            message: 'API 키가 올바르지 않거나, 선택한 Base URL(Endpoint)과 일치하지 않습니다. 설정에서 API 키와 Base URL을 다시 확인해주세요. (예: Vessel 사용 시 Base URL을 https://api.vessel.ai/v1 으로 설정)',
            details: response.data
          });
        }
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

  app.post(/.*\/suno\/wav\/generate\/?$/, async (req, res) => {
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
        if (response.status === 401) {
          return res.status(401).json({
            error: 'API 인증 실패 (401 Unauthorized)',
            message: 'API 키가 올바르지 않거나, 선택한 Base URL(Endpoint)과 일치하지 않습니다. 설정에서 API 키와 Base URL을 다시 확인해주세요.',
            details: response.data
          });
        }
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

  app.get(/.*\/suno\/status\/[^\/]+\/?$/, async (req, res) => {
    try {
      const pathParts = req.path.split('/');
      const id = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
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
        if (innerError.response?.status === 401) {
          return res.status(401).json({
            error: 'API 인증 실패 (401 Unauthorized)',
            message: '상태 확인 중 인증 오류가 발생했습니다. API 키와 Base URL이 일치하는지 확인해주세요.',
            details: innerError.response.data
          });
        }
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
