
const axios = require('axios');

async function checkService() {
  const apiUrl = 'https://smmbirla.com/api/v2';
  const apiKey = '8fcc0d96dee858de74244a4ebf528865';
  
  try {
    const response = await axios.post(apiUrl, new URLSearchParams({
      key: apiKey,
      action: 'services'
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const services = response.data;
    if (!Array.isArray(services)) {
      console.log('Error fetching services:', services);
      return;
    }

    const service201 = services.find(s => String(s.service) === '201');
    const service451 = services.find(s => String(s.service) === '451');

    console.log('--- Service 201 (Likes) ---');
    console.log(JSON.stringify(service201, null, 2));

    console.log('--- Service 451 (Views) ---');
    console.log(JSON.stringify(service451, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkService();
