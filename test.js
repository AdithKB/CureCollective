const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZjM0ZTdjZDRkODVlMDU0ZDQ0ZTUxMCIsImlhdCI6MTc0Mzk5ODYwMCwiZXhwIjoxNzQ0NjAzNDAwfQ.GnQkKvTnUPhIIV9J2VeDa5pwkMHpQItbBcr3iFCpDpA';

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/users/profile',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(responseData);
      console.log('Response:', parsedData);
    } catch (e) {
      console.log('Raw Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end(); 