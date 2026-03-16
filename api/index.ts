import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

const sanitizeKey = (key: string | null) => {
  if (!key) return '';
  let sanitized = key.replace(/[^\x20-\x7E]/g, '').trim();
  if (sanitized.toLowerCase().startsWith('bearer ')) {
    sanitized = sanitized.slice(7).trim();
  }
  return sanitized;
};

// API route to proxy requests to Suno API
app.post(['/api/suno/generate', '/suno/generate'], async (req, res) => {
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
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('Suno API Error:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to generate music';
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      } else {
        errorMessage = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(error.response?.status || 500).json({
      error: errorMessage,
      details: error.response?.data
    });
  }
});

app.post(['/api/suno/wav/generate', '/suno/wav/generate'], async (req, res) => {
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
      callBackUrl: callBackUrl || ''
    };

    const response = await axios.post(
      `${apiUrl}/wav/generate`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('Suno WAV API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to generate WAV',
      details: error.response?.data
    });
  }
});

app.get(['/api/suno/status/:id', '/suno/status/:id'], async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    const apiKey = sanitizeKey(authHeader?.split(' ')[1] || null);
    let apiUrl = (req.query.baseUrl as string) || 'https://api.sunoapi.org/api/v1';
    
    if (!apiKey) {
      return res.status(401).json({ error: 'Authorization header is required' });
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

    const statusUrl = `${apiUrl}/generate/record-info?taskId=${id}`;
    
    try {
      const response = await axios.get(statusUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        timeout: 15000
      });
      return res.json(response.data);
    } catch (innerError: any) {
      if (innerError.response?.status === 404 || innerError.response?.status === 405) {
        const fallbackUrl = `${apiUrl}/status/${id}`;
        const fallbackResponse = await axios.get(fallbackUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: 15000
        });
        return res.json(fallbackResponse.data);
      }
      throw innerError;
    }
  } catch (error: any) {
    console.error('Suno Status API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to check status',
      details: error.response?.data
    });
  }
});

export default app;
