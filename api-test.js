const http = require('http');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  userType: 'patient'
};

// Helper function to make HTTP requests
const makeRequest = (options, data = null) => {
  return new Promise((resolve, reject) => {
    console.log(`Making ${options.method} request to ${options.path}`);
    if (data) {
      console.log('Request data:', data);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
};

// Test registration
const testRegistration = async () => {
  console.log('\nTesting Registration...');
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify(testUser).length
    }
  };

  try {
    const response = await makeRequest(options, JSON.stringify(testUser));
    console.log('Status Code:', response.statusCode);
    console.log('Response:', response.data);
    if (response.data.token) {
      authToken = response.data.token;
      console.log('Auth token received:', authToken.substring(0, 20) + '...');
    }
  } catch (error) {
    console.error('Registration Error:', error.message);
  }
};

// Test login
const testLogin = async () => {
  console.log('\nTesting Login...');
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify(loginData).length
    }
  };

  try {
    const response = await makeRequest(options, JSON.stringify(loginData));
    console.log('Status Code:', response.statusCode);
    console.log('Response:', response.data);
    if (response.data.token) {
      authToken = response.data.token;
      console.log('Auth token received:', authToken.substring(0, 20) + '...');
    }
  } catch (error) {
    console.error('Login Error:', error.message);
  }
};

// Test profile
const testProfile = async () => {
  console.log('\nTesting Profile...');
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/users/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    console.log('Status Code:', response.statusCode);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Profile Error:', error.message);
  }
};

// Run all tests
const runTests = async () => {
  console.log('Starting API Tests...');
  console.log('Server URL:', BASE_URL);
  
  // Test registration
  await testRegistration();
  
  // Test login
  await testLogin();
  
  // Test profile (requires authentication)
  if (authToken) {
    await testProfile();
  } else {
    console.log('\nSkipping Profile Test - No auth token available');
  }
  
  console.log('\nAPI Tests Completed!');
};

// Run the tests
runTests(); 