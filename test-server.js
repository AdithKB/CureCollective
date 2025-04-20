const express = require('express');
const app = express();

// Basic route
app.get('/', (req, res) => {
  res.send('Test server is running!');
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
  console.log(`Test server available at http://localhost:${PORT}`);
}); 