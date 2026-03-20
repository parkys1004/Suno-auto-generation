import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

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

    console.log(`Proxying generate to: ${apiUrl}/generate`);
    
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
        timeout: 45000
      }
    );

    res.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data;
    console.error(`Suno API Error (${status}):`, JSON.stringify(data) || error.message);
    
    // If it's a 401, maybe the provider doesn't want the "Bearer " prefix?
    if (status === 401 && !req.query.retry) {
      try {
        const { apiKey: rawApiKey } = req.body;
        const apiKey = sanitizeKey(rawApiKey);
        const apiUrl = req.body.baseUrl || 'https://api.sunoapi.org/api/v1';
        const response = await axios.post(
          `${apiUrl}/generate`,
          req.body,
          {
            headers: {
              'Authorization': apiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 45000
          }
        );
        return res.json(response.data);
      } catch (retryError) {
        // Ignore retry error
      }
    }

    res.status(status).json({
      error: data?.message || data?.error || error.message || 'Failed to generate music',
      details: data,
      code: data?.code || status
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

app.get(['/api/suno/status/test', '/suno/status/test'], async (req, res) => {
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

    let testUrl = `${apiUrl}/limit`;
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
              if (lastError.response?.status === 401 || lastError.response?.status === 403) {
                throw lastError;
              }
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
        // Ignore
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
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 15000
      });
      return res.json(response.data);
    } catch (innerError: any) {
      if (innerError.response?.status === 404 || innerError.response?.status === 405) {
        const fallbackUrl = `${apiUrl}/status/${id}`;
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

export default app;
