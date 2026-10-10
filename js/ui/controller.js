class Controller{
  constructor(game,root,els){
    this.g=game;
    this.els=els;
    this.mode='ai';
    this.sel=-1;
    this.flip=false;
    this.pending=null;
    this.human='w';
    this.busy=false;
    this.job=0;
    this.net=null;
    this.online={};
    this.note='';
    this.r=new Renderer(root,i=>this.click(i));
    els.mode.onchange=()=>this.setMode(els.mode.value);
    els.new.onclick=()=>this.fresh();
    els.side.onchange=()=>{this.human=els.side.value;this.flip=this.human==='b';this.restart();};
    els.elo.oninput=()=>{els.eloVal.textContent=els.elo.value;};
    els.undo.onclick=()=>this.undo();
    els.flip.onclick=()=>{this.flip=!this.flip;this.render();};
    els.join.onclick=()=>this.join();
    els.promo.onclick=e=>{
      const b=e.target.closest('button');
      if(b)this.finish(b.dataset.p);
      else{els.promo.hidden=true;this.pending=null;}
    };
    this.render();
    this.next();
  }

  setMode(m){
    const els=this.els;
    this.mode=m;
    els.aiBox.hidden=m!=='ai';
    els.netBox.hidden=m!=='net';
    this.job++;
    this.busy=false;
    this.sel=-1;
    this.note='';
    if(this.net){this.net.close();this.net=null;}
    this.g.reset();
    if(m==='ai'){
      this.human=els.side.value;
      this.flip=this.human==='b';
    }else{
      this.human=null;
      this.online={};
    }
    this.render();
    this.next();
  }

  async join(){
    const room=this.els.room.value.trim().toLowerCase();
    if(!room)return;
    if(location.protocol==='file:'){
      this.note='Mode online harus dibuka lewat alamat server, bukan file.';
      this.render();
      return;
    }
    if(this.net)this.net.close();
    this.net=new Net(d=>this.sync(d),m=>{this.note=m;this.render();});
    try{
      await this.net.join(room);
      this.note='';
    }catch(e){
      this.net=null;
      this.note=e.message;
      this.render();
    }
  }

  sync(d){
    const g=this.g,mv=d.moves;
    if(this.human!==d.color)this.flip=d.color==='b';
    this.human=d.color;
    this.online=d.online;
    if(!(g.history.length<=mv.length&&g.history.every((x,i)=>x===mv[i])))g.reset();
    for(let i=g.history.length;i<mv.length;i++){
      const s=mv[i];
      g.play(sqIndex(s.slice(0,2)),sqIndex(s.slice(2,4)),s[4]);
    }
    this.busy=false;
    this.sel=-1;
    this.render();
  }

  fresh(){
    if(this.mode==='ai')return this.restart();
    if(this.net)this.net.reset().catch(e=>{this.note=e.message;this.render();});
  }

  restart(){
    this.job++;
    this.busy=false;
    this.sel=-1;
    this.g.reset();
    this.render();
    this.next();
  }

  undo(){
    const g=this.g;
    this.job++;
    this.busy=false;
    this.sel=-1;
    g.undo();
    if(g.state.turn!==this.human&&g.history.length)g.undo();
    this.render();
    this.next();
  }

  next(){
    const g=this.g;
    if(this.mode!=='ai'||g.over||g.state.turn===this.human)return;
    const id=++this.job;
    this.busy=true;
    this.render();
    setTimeout(()=>{
      if(id!==this.job)return;
      const m=pickMove(g,+this.els.elo.value);
      this.busy=false;
      if(m)g.play(m.from,m.to,m.promo&&m.promo.toLowerCase());
      this.render();
    },50);
  }

  submit(from,to,promo){
    this.sel=-1;
    if(this.mode==='ai'){
      this.g.play(from,to,promo);
      this.render();
      this.next();
      return;
    }
    this.busy=true;
    this.render();
    this.net.move(from,to,promo).catch(e=>{
      this.busy=false;
      this.note=e.message;
      this.render();
    });
  }

  click(i){
    const g=this.g;
    if(g.over||this.busy||!this.human||g.state.turn!==this.human)return;
    if(this.sel>=0){
      const ms=g.movesFrom(this.sel).filter(m=>m.to===i);
      if(ms.length){
        if(ms[0].promo){
          this.pending={from:this.sel,to:i};
          this.showPromo();
          return;
        }
        this.submit(this.sel,i);
        return;
      }
    }
    const p=g.state.b[i];
    const ok=p&&colorOf(p)===g.state.turn&&g.movesFrom(i).length&&i!==this.sel;
    this.sel=ok?i:-1;
    this.render();
  }

  showPromo(){
    const c=this.g.state.turn;
    this.els.promo.innerHTML=[...'qrbn'].map(t=>`<button data-p="${t}" class="${c}">${GLYPH[t]}</button>`).join('');
    this.els.promo.hidden=false;
  }

  finish(t){
    const{from,to}=this.pending;
    this.els.promo.hidden=true;
    this.pending=null;
    this.submit(from,to,t);
  }

  base(){
    const g=this.g,w=g.state.turn==='w',me=w?'putih':'hitam',op=w?'hitam':'putih';
    if(g.status==='mate')return`Skakmat, ${op} menang.`;
    if(g.status==='stalemate')return'Remis karena stalemate.';
    if(g.status==='material')return'Remis karena material tidak cukup.';
    if(g.status==='fifty')return'Remis karena aturan 50 langkah.';
    if(g.status==='repeat')return'Remis karena posisi berulang tiga kali.';
    if(this.busy)return this.mode==='ai'?'Komputer sedang berpikir.':'Mengirim langkah.';
    return g.status==='check'?`Giliran ${me}, sedang skak.`:`Giliran ${me}.`;
  }

  text(){
    if(this.mode==='ai')return this.base();
    if(!this.human)return this.note||'Isi kode ruangan yang sama di kedua HP, lalu tekan Gabung.';
    const opp=this.human==='w'?'b':'w';
    let t=`Kamu main ${this.human==='w'?'putih':'hitam'}. ${this.base()}`;
    if(!this.online[opp])t+=' Lawan belum terhubung.';
    if(this.note)t+=' '+this.note;
    return t;
  }

  render(){
    const g=this.g,s=g.state,h=g.history,rows=[];
    const targets=new Set(this.sel>=0?g.movesFrom(this.sel).map(m=>m.to):[]);
    const chk=g.status==='check'||g.status==='mate';
    this.r.draw({state:s,last:g.last,sel:this.sel,targets,checkSq:chk?s.b.indexOf(s.turn==='w'?'K':'k'):-1,flip:this.flip});
    this.els.status.textContent=this.text();
    for(let i=0;i<h.length;i+=2)rows.push(`<li>${h[i]} ${h[i+1]||''}</li>`);
    this.els.moves.innerHTML=rows.join('');
    this.els.moves.scrollTop=this.els.moves.scrollHeight;
  }
}
