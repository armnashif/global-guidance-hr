const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 8000;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // Serve template.html for all routes
  const templatePath = path.join(__dirname, 'src', 'template.html');
  
  if (req.url.startsWith('/api/')) {
    // Basic API stubs
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({success: true, data: []}));
    return;
  }

  fs.readFile(templatePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading app');
      return;
    }
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Global Guidance HR System running on port ' + PORT);
});
