function attacked(s,sq,by){
  const b=s.b,r=sq>>3,c=sq&7,w=by==='w';
  const pr=r+(w?1:-1),pawn=w?'P':'p';
  const own=ch=>w?ch.toUpperCase():ch;
  for(const dc of[-1,1])if(at(b,pr,c+dc)===pawn)return true;
  for(const[dr,dc]of DIRS.n)if(at(b,r+dr,c+dc)===own('n'))return true;
  for(const[dr,dc]of DIRS.k)if(at(b,r+dr,c+dc)===own('k'))return true;
  for(const[dr,dc]of DIRS.q){
    let rr=r+dr,cc=c+dc;
    while(inside(rr,cc)){
      const p=b[rr*8+cc];
      if(p){
        if(colorOf(p)===by){
          const t=p.toLowerCase();
          if(t==='q'||t===(dr&&dc?'b':'r'))return true;
        }
        break;
      }
      rr+=dr;cc+=dc;
    }
  }
  return false;
}

function castles(s,i,out){
  const w=s.turn==='w',home=w?60:4,en=w?'b':'w',b=s.b;
  if(i!==home||attacked(s,home,en))return;
  const rook=w?'R':'r',[k,q]=w?['K','Q']:['k','q'];
  if(s.castle.includes(k)&&b[home+3]===rook&&!b[home+1]&&!b[home+2]&&!attacked(s,home+1,en)&&!attacked(s,home+2,en))
    out.push({from:i,to:home+2,p:b[i],f:'ck'});
  if(s.castle.includes(q)&&b[home-4]===rook&&!b[home-1]&&!b[home-2]&&!b[home-3]&&!attacked(s,home-1,en)&&!attacked(s,home-2,en))
    out.push({from:i,to:home-2,p:b[i],f:'cq'});
}

function pseudo(s){
  const out=[],b=s.b,turn=s.turn,w=turn==='w';
  for(let i=0;i<64;i++){
    const p=b[i];
    if(!p||colorOf(p)!==turn)continue;
    const t=p.toLowerCase(),r=i>>3,c=i&7;
    if(t==='p'){
      const d=w?-1:1,nr=r+d,last=w?0:7;
      const push=(to,f)=>{
        if(to>>3===last)for(const q of'qrbn')out.push({from:i,to,p,promo:w?q.toUpperCase():q,f});
        else out.push({from:i,to,p,f});
      };
      if(inside(nr,c)&&!b[nr*8+c]){
        push(nr*8+c);
        if(r===(w?6:1)&&!b[(nr+d)*8+c])out.push({from:i,to:(nr+d)*8+c,p,f:'dp'});
      }
      for(const dc of[-1,1]){
        if(!inside(nr,c+dc))continue;
        const to=nr*8+c+dc,tp=b[to];
        if(tp&&colorOf(tp)!==turn)push(to);
        else if(to===s.ep)out.push({from:i,to,p,f:'ep'});
      }
    }else if(t==='n'||t==='k'){
      for(const[dr,dc]of DIRS[t]){
        if(!inside(r+dr,c+dc))continue;
        const to=(r+dr)*8+c+dc,tp=b[to];
        if(!tp||colorOf(tp)!==turn)out.push({from:i,to,p});
      }
      if(t==='k')castles(s,i,out);
    }else{
      for(const[dr,dc]of DIRS[t]){
        let rr=r+dr,cc=c+dc;
        while(inside(rr,cc)){
          const to=rr*8+cc,tp=b[to];
          if(!tp||colorOf(tp)!==turn)out.push({from:i,to,p});
          if(tp)break;
          rr+=dr;cc+=dc;
        }
      }
    }
  }
  return out;
}

function inCheck(s){
  const w=s.turn==='w';
  return attacked(s,s.b.indexOf(w?'K':'k'),w?'b':'w');
}

function legal(s){
  const w=s.turn==='w',king=w?'K':'k',en=w?'b':'w';
  return pseudo(s).filter(m=>{
    const n=apply(s,m);
    return!attacked(n,n.b.indexOf(king),en);
  });
}
