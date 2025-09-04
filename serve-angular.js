const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4200;

// Serve static files from src directory
app.use('/src', express.static(path.join(__dirname, 'src')));

// Serve form metadata
app.get('/form-metadata.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'form-metadata.json'));
});

// API proxy to backend
app.use('/api', (req, res) => {
  const targetUrl = `http://localhost:3001${req.url}`;
  
  // Simple proxy implementation
  const http = require('http');
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxyReq, { end: true });
});

// Serve index.html for all other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Angular Dev Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'src')}`);
  console.log(`🔗 Proxying API calls to: http://localhost:3001`);
});