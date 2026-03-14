const axios = require('axios');
axios.options('https://api.sunoapi.org/api/v1/generate', {
  headers: {
    'Origin': 'https://example.com',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Authorization, Content-Type'
  }
}).then(res => {
  console.log('CORS headers:', res.headers);
}).catch(err => {
  console.error('CORS error:', err.message);
});
