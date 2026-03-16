import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

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
    
    // Remove trailing slash
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }

    // If the user provided a full endpoint URL, strip the /generate part because we append it
    if (apiUrl.endsWith('/generate')) {
      apiUrl = apiUrl.slice(0, -9);
    }
    if (apiUrl.endsWith('/suno/generate')) {
      apiUrl = apiUrl.slice(0, -14);
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
      console.log(`Proxying request to: ${url}`);
      return await axios.post(
        url,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          validateStatus: (status) => status < 500
        }
      );
    };

    let response = await performRequest(`${apiUrl}/generate`);
    
    // Fallback for some APIs that might use a different structure
    if (response.status === 404 || response.status === 405) {
      console.log(`Retrying with alternative path for: ${apiUrl}`);
      // Try without /v1 if it was included, or with /suno if it's Vessel
      if (apiUrl.includes('vessel.ai') && !apiUrl.endsWith('/suno')) {
        response = await performRequest(`${apiUrl}/suno/generate`);
      } else {
        response = await performRequest(`${apiUrl}/generate/`);
      }
    }

    if (response.status >= 400 || (response.data && response.data.code && response.data.code >= 400)) {
      const status = response.status >= 400 ? response.status : response.data.code;
      if (status === 401) {
        return res.status(401).json({
          error: 'API 인증 실패 (401 Unauthorized)',
          message: 'API 키가 올바르지 않거나, 선택한 Base URL(Endpoint)과 일치하지 않습니다. 설정에서 API 키와 Base URL을 다시 확인해주세요. (예: Vessel 사용 시 Base URL을 https://api.vessel.ai/v1/suno 로 설정)',
          details: response.data
        });
      }
      return res.status(status).json(response.data);
    }

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
      callBackUrl: callBackUrl || ''
    };

    const performRequest = async (url: string) => {
      return await axios.post(
        url,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          validateStatus: (status) => status < 500
        }
      );
    };

    let response = await performRequest(`${apiUrl}/wav/generate`);
    
    if (response.status === 405) {
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
    console.error('Suno WAV API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || 'Failed to generate WAV',
      details: error.response?.data
    });
  }
});

app.get(/.*\/suno\/status\/[^\/]+\/?$/, async (req, res) => {
  try {
    const pathParts = req.path.split('/');
    const id = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
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
      if (innerError.response?.status === 401) {
        return res.status(401).json({
          error: 'API 인증 실패 (401 Unauthorized)',
          message: '상태 확인 중 인증 오류가 발생했습니다. API 키와 Base URL이 일치하는지 확인해주세요.',
          details: innerError.response.data
        });
      }
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
