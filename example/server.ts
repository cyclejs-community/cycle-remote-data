import * as http from 'http';
import * as fs from 'fs';
import * as browserify from 'browserify';

const results = [
  {
    name: 'test',
    value: 'foo1'
  },
  {
    name: 'zest',
    value: 'foo2'
  },
  {
    name: 'best',
    value: 'foo3'
  },
  {
    name: 'mest',
    value: 'foo4'
  },
]

const server = http.createServer((req, res) => {
  console.log(req.url);

  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Context-Type': 'text/html' });
    res.end(fs.readFileSync(__dirname + '/index.html'));
    return;
  }

  if (req.url === '/bundle.js') {
    const b = browserify('./example/client.ts', {plugin: 'tsify'});
    res.writeHead(200, { 'Context-Type': 'application/javascript' });
    b.bundle().pipe(res);
    return;
  }

  const q = (req as any).url.slice(2);

  setTimeout(() => {
    if (Math.random() > 0.80) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([]));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(results.filter(r => r.name.indexOf(q) !== -1)));
  }, Math.random() * 3000);
});

server.listen(8080);
