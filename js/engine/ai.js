const MATE=10000000000000;

function levelOf(elo){
  return{
    depth:elo<600?1:elo<1000?2:elo<1400?3:elo<1800?4:5,
    noise:Math.max(0,Math.round((1500-elo)*.3)),
    blunder:Math.max(0,Math.min(.5,(1000-elo)/1500)),
    time:elo<1400?800:2000,
    quiet:elo>=1000
  };
}

function order(s,ms){
  for(const m of ms){
    const t=s.b[m.to];
    m.k=(t?10*VALUE[t.toLowerCase()]-VALUE[m.p.toLowerCase()]:0)+(m.promo?800:0);
  } 
  return ms.sort((a,b)=>b.k-a.k);
}

function tick(ctx){
  if((++ctx.n&2047)===0&&Date.now()>ctx.end)ctx.stop=true;
  return ctx.stop;
}

function quiesce(s,a,b,ctx){
  if(tick(ctx))return 0;
  const stand=evaluate(s);
  if(stand>=b)return b;
  if(stand>a)a=stand;
  const w=s.turn==='w',king=w?'K':'k',en=w?'b':'w';
  const ms=order(s,pseudo(s).filter(m=>s.b[m.to]||m.f==='ep'||m.promo));
  for(const m of ms){
    const n=apply(s,m);
    if(attacked(n,n.b.indexOf(king),en))continue;
    const v=-quiesce(n,-b,-a,ctx);
    if(v>=b)return b;
    if(v>a)a=v;
  }
  return a;
}

function search(s,d,a,b,ply,ctx){
  if(tick(ctx))return 0;
  if(d===0)return ctx.quiet?quiesce(s,a,b,ctx):evaluate(s);
  const ms=order(s,legal(s));
  if(!ms.length)return inCheck(s)?-MATE+ply:0;
  for(const m of ms){
    const v=-search(apply(s,m),d-1,-b,-a,ply+1,ctx);
    if(v>=b)return b;
    if(v>a)a=v;
  }
  return a;
}

function pickMove(game,elo){
  const L=levelOf(elo),s=game.state,all=game.moves;
  if(Math.random()<L.blunder)return all[Math.random()*all.length|0];
  const ctx={n:0,stop:false,end:Date.now()+L.time,quiet:L.quiet};
  const ms=order(s,all.slice());
  let result=ms[0];
  for(let d=1;d<=L.depth;d++){
    let a=-Infinity,top=null,topV=-Infinity;
    for(const m of ms){
      let v=-search(apply(s,m),d-1,-Infinity,L.noise?Infinity:-a,1,ctx);
      if(ctx.stop)break;
      if(L.noise)v+=(Math.random()*2-1)*L.noise;
      else if(v>a)a=v;
      if(v>topV){topV=v;top=m;}
    }
    if(ctx.stop)break;
    result=top;
    ms.splice(ms.indexOf(top),1);
    ms.unshift(top);
    if(topV>MATE-100)break;
  }
  return result;
}
