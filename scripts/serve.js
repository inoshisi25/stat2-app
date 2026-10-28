// 簡易ローカルサーバー: node scripts/serve.js [port]
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),port=+process.argv[2]||8000;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';
  const f=path.join(root,path.normalize(p));
  if(!f.startsWith(root))return res.writeHead(403).end();
  fs.readFile(f,(e,b)=>{if(e)return res.writeHead(404).end('Not found');res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});res.end(b)});
}).listen(port,()=>console.log(`http://localhost:${port}/`));
