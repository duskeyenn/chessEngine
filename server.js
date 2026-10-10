const http=require('http'),fs=require('fs'),path=require('path'),vm=require('vm'),os=require('os'),crypto=require('crypto');
const root=__dirname,port=+process.env.PORT||+process.argv[2]||3000;
const src=['constants','board','moves','game'].map(f=>fs.readFileSync(path.join(root,'js/engine',f+'.js'),'utf8')).join('\n');
const Game=vm.runInNewContext(src+'\nGame;');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const rooms=new Map();

const seat=(r,t)=>t&&(r.tokens.w===t?'w':r.tokens.b===t?'b':null);

function room(code){
  let r=rooms.get(code);
  if(!r){
    r={game:new Game(),tokens:{},clients:new Set(),seen:Date.now()};
    rooms.set(code,r);
  }
  return r;
}

function push(r){
  const online={w:false,b:false};
  for(const c of r.clients){
    const k=seat(r,c.token);
    if(k)online[k]=true;
  }
  for(const c of r.clients)
    c.res.write('data: '+JSON.stringify({color:seat(r,c.token),moves:r.game.history,online})+'\n\n');
  r.seen=Date.now();
}

function send(res,code,obj){
  res.writeHead(code,{'Content-Type':'application/json'});
  res.end(JSON.stringify(obj));
}

function body(req,cb){
  let d='';
  req.on('data',c=>{d+=c;if(d.length>1024)req.destroy();});
  req.on('end',()=>{
    try{cb(JSON.parse(d||'{}'));}
    catch{cb(null);}
  });
}

function api(name,b,res){
  const code=String(b.room||'').toLowerCase();
  if(!/^[a-z0-9]{1,12}$/.test(code))return send(res,400,{error:'Kode ruangan hanya huruf dan angka, maksimal 12 karakter.'});
  const r=room(code);
  if(name==='/api/join'){
    let c=seat(r,b.token),t=b.token;
    if(!c){
      c=!r.tokens.w?'w':!r.tokens.b?'b':null;
      if(!c)return send(res,409,{error:'Ruangan sudah penuh.'});
      t=crypto.randomBytes(8).toString('hex');
      r.tokens[c]=t;
    }
    return send(res,200,{token:t,color:c});
  }
  const c=seat(r,b.token);
  if(!c)return send(res,403,{error:'Belum bergabung.'});
  if(name==='/api/move'){
    if(r.game.over)return send(res,400,{error:'Game sudah selesai.'});
    if(r.game.state.turn!==c)return send(res,400,{error:'Bukan giliranmu.'});
    if(!r.game.play(+b.from,+b.to,typeof b.promo==='string'?b.promo:undefined))return send(res,400,{error:'Langkah tidak sah.'});
    push(r);
    return send(res,200,{ok:true});
  }
  if(name==='/api/reset'){
    r.game.reset();
    [r.tokens.w,r.tokens.b]=[r.tokens.b,r.tokens.w];
    push(r);
    return send(res,200,{ok:true});
  }
  send(res,404,{error:'Tidak ditemukan.'});
}

function events(u,req,res){
  const r=rooms.get((u.searchParams.get('room')||'').toLowerCase()),token=u.searchParams.get('token');
  if(!r||!seat(r,token)){res.writeHead(403);return res.end();}
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache',Connection:'keep-alive'});
  const c={res,token};
  r.clients.add(c);
  push(r);
  const hb=setInterval(()=>res.write(':\n\n'),20000);
  req.on('close',()=>{
    clearInterval(hb);
    r.clients.delete(c);
    push(r);
  });
}

function serve(req,res){
  let p=req.url.split('?')[0];
  if(p==='/')p='/index.html';
  const ok=p==='/index.html'||(/^\/(js|css)\/[\w/.-]+\.(js|css)$/.test(p)&&!p.includes('..'));
  const f=path.join(root,p);
  if(!ok||!fs.existsSync(f)){res.writeHead(404);return res.end('404');}
  res.writeHead(200,{'Content-Type':types[path.extname(f)],'Cache-Control':'no-store'});
  fs.createReadStream(f).pipe(res);
}

http.createServer((req,res)=>{
  const u=new URL(req.url,'http://x');
  if(req.method==='GET'&&u.pathname==='/api/events')return events(u,req,res);
  if(req.method==='POST'&&u.pathname.startsWith('/api/'))return body(req,b=>b?api(u.pathname,b,res):send(res,400,{error:'Data rusak.'}));
  serve(req,res);
}).listen(port,'0.0.0.0',()=>{
  const ips=Object.values(os.networkInterfaces()).flat().filter(i=>i&&(i.family==='IPv4'||i.family===4)&&!i.internal).map(i=>i.address);
  console.log('Server jalan. Buka salah satu alamat ini di kedua HP:');
  console.log('  http://localhost:'+port+'  (HP yang menjalankan server)');
  for(const ip of ips)console.log('  http://'+ip+':'+port);
});

setInterval(()=>{
  for(const[k,r]of rooms)if(!r.clients.size&&Date.now()-r.seen>36e5)rooms.delete(k);
},6e5);
