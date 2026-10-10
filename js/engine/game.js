class Game{
  constructor(){this.reset();}

  reset(){
    this.state=parseFen(START);
    this.last=null;
    this.history=[];
    this.stack=[];
    this.keys=[keyOf(this.state)];
    this.refresh();
  }

  refresh(){
    this.moves=legal(this.state);
    const chk=inCheck(this.state);
    this.status=this.moves.length?(chk?'check':this.drawReason()||'ok'):(chk?'mate':'stalemate');
    if(this.status==='check'&&this.drawReason())this.status=this.drawReason();
  }

  drawReason(){
    const s=this.state;
    if(s.half>=100)return'fifty';
    const k=keyOf(s);
    if(this.keys.filter(x=>x===k).length>=3)return'repeat';
    const rest=s.b.filter(p=>p&&p.toLowerCase()!=='k').map(p=>p.toLowerCase());
    if(!rest.length||(rest.length===1&&(rest[0]==='b'||rest[0]==='n')))return'material';
    return null;
  }

  get over(){return this.status!=='ok'&&this.status!=='check';}

  movesFrom(i){return this.moves.filter(m=>m.from===i);}

  play(from,to,promo){
    const m=this.moves.find(x=>x.from===from&&x.to===to&&(!x.promo||x.promo.toLowerCase()===promo));
    if(!m)return null;
    this.stack.push({state:this.state,last:this.last});
    this.state=apply(this.state,m);
    this.keys.push(keyOf(this.state));
    this.last=m;
    this.history.push(sqName(from)+sqName(to)+(m.promo?m.promo.toLowerCase():''));
    this.refresh();
    return m;
  }

  undo(){
    const u=this.stack.pop();
    if(!u)return;
    this.state=u.state;
    this.keys.pop();
    this.last=u.last;
    this.history.pop();
    this.refresh();
  }
}
