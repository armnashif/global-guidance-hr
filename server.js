const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

const PORT = process.env.PORT || 8000;
let compiledHTML = null;

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function init() {
  const templatePath = path.join(__dirname, 'src', 'template.html');
  const html = fs.readFileSync(templatePath, 'utf8');

  if (!html.includes('type="text/babel"')) {
    compiledHTML = html;
    console.log('Pre-compiled template - serving directly');
    return;
  }

  console.log('Downloading Babel for server-side JSX compilation...');
  try {
    const babelSrc = await download('https://unpkg.com/@babel/standalone/babel.min.js');
    console.log('Babel downloaded (' + Math.round(babelSrc.length/1024) + 'KB). Compiling JSX...');

    const sandbox = { console, process };
    vm.runInNewContext(babelSrc, sandbox);
    const Babel = sandbox.Babel;

    const babelTag = '<script type="text/babel">';
    const babelStart = html.indexOf(babelTag) + babelTag.length;
    const babelEnd = html.indexOf('<' + '/script>', babelStart);
    const jsxCode = html.slice(babelStart, babelEnd);

    const t0 = Date.now();
    const result = Babel.transform(jsxCode, {
      presets: [['react', { runtime: 'classic' }], 'env'],
      filename: 'app.jsx'
    });
    console.log('JSX compiled in ' + (Date.now()-t0) + 'ms! Serving pre-compiled app.');

    compiledHTML = html
      .replace('<script src="https://unpkg.com/@babel/standalone/babel.min.js"><' + '/script>\n', '')
      .replace(babelTag + jsxCode + '<' + '/script>', '<script>\n' + result.code + '\n<' + '/script>');
  } catch(e) {
    console.error('Compile failed:', e.message.slice(0,200));
    compiledHTML = html;
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({success:true,data:[]}));
    return;
  }
  if (!compiledHTML) {
    res.writeHead(503, {'Content-Type':'text/html'});
    res.end('<html><body style="font-family:system-ui;text-align:center;padding:60px"><h2>Starting up...</h2><p>Please wait 30 seconds and refresh the page.</p></body></html>');
    return;
  }
  res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
  res.end(compiledHTML);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Server started on port ' + PORT);
  init().catch(e => {
    console.error('Init error:', e.message);
    const templatePath = path.join(__dirname, 'src', 'template.html');
    compiledHTML = fs.readFileSync(templatePath, 'utf8');
  });
});