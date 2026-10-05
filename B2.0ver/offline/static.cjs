const fs = require('node:fs');
const path = require('node:path');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg','.mp4':'video/mp4','.woff2':'font/woff2','.glb':'model/gltf-binary'};
exports.serve = (root, req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(path.resolve(root) + path.sep)) { res.writeHead(403).end(); return; }
  let stat;
  try { stat = fs.statSync(file); } catch { res.writeHead(404).end(); return; }
  if (!stat.isFile()) { res.writeHead(404).end(); return; }
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  const headers = {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
  let start = 0, end = stat.size - 1, code = 200;
  if (req.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!match || (!match[1] && !match[2])) { res.writeHead(416, {'Content-Range':`bytes */${stat.size}`}).end(); return; }
    start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
    if (start > end || start >= stat.size) { res.writeHead(416, {'Content-Range':`bytes */${stat.size}`}).end(); return; }
    headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`; code = 206;
  }
  headers['Content-Length'] = Math.max(0, end-start+1);
  res.writeHead(code, headers);
  if (req.method === 'HEAD' || !stat.size) { res.end(); return; }
  const stream = fs.createReadStream(file, {start,end});
  stream.on('error', () => res.destroy()); res.on('close', () => stream.destroy()); stream.pipe(res);
};
