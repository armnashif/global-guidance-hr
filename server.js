const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 8000;

let compiledHTML = null;

function compileAndServe() {
  const templatePath = path.join(__dirname, 'src', 'template.html');
  const html = fs.readFileSync(templatePath, 'utf8');

  if (!html.includes('type="text/babel"')) {
    compiledHTML = html;
    console.log('Template already pre-compiled, serving directly.');
    startServer();
    return;
  }

  console.log('Compiling JSX at startup (one-time, ~5 seconds)...');
  const t0 = Date.now();

  try {
    const babelTag = '<script type="text/babel">';
    const babelStart = html.indexOf(babelTag) + babelTag.length;
    const babelEnd = html.indexOf('<\/script>', babelStart);
    const jsxCode = html.slice(babelStart, babelEnd);

    let Babel;
    try {
      Babel = require('@babel/standalone');
    } catch(e) {
      console.log('Babel not available, serving original template');
      compiledHTML = html;
      startServer();
      return;
    }

    const result = Babel.transform(jsxCode, {
      presets: [['react', { runtime: 'classic' }], 'env'],
      filename: 'app.jsx'
    });

    let newHTML = html
      .replace('<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>\n', '')
      .replace(babelTag + jsxCode + '<\/script>', '<script>\n' + result.code + '\n<\/script>');

    compiledHTML = newHTML;
    console.log('Compiled in ' + (Date.now() - t0) + 'ms - serving pre-compiled app!');
  } catch (err) {
    console.error('Compile error:', err.message.slice(0,200));
    compiledHTML = html;
  }

  startServer();
}

function startServer() {
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/api/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: [] }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(compiledHTML);
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log('Global Guidance HR System running on port ' + PORT);
  });
}

compileAndServe();