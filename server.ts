import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const sanitizeKey = (key: string | null) => key ? key.replace(/[^\x20-\x7E]/g, '').trim() : '';

  // API route to proxy requests to Suno API
  app.post('/api/suno/generate', async (req, res) => {
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

      const response = await axios.post(
        `${apiUrl}/generate`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error('Suno API Error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Failed to generate music',
        details: error.response?.data
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
        taskId,
        audioId,
        callBackUrl: callBackUrl || 'https://example.com/callback'
      };

      const response = await axios.post(
        `${apiUrl}/wav/generate`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error('Suno API WAV Error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Failed to generate WAV',
        details: error.response?.data
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

      const response = await axios.get(
        `${apiUrl}/generate/record-info?taskId=${id}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error('Suno API Error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        error: error.response?.data?.message || 'Failed to check status',
        details: error.response?.data
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
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
