class Net{
  constructor(onSync,onNote){
    this.onSync=onSync;
    this.onNote=onNote;
    this.es=null;
  }

  async post(url,body){
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await res.json();
    if(!res.ok)throw new Error(j.error);
    return j;
  }

  async join(room){
    const key='catur:'+room;
    const r=await this.post('/api/join',{room,token:sessionStorage.getItem(key)});
    sessionStorage.setItem(key,r.token);
    this.room=room;
    this.token=r.token;
    this.es=new EventSource(`/api/events?room=${encodeURIComponent(room)}&token=${r.token}`);
    this.es.onopen=()=>this.onNote('');
    this.es.onmessage=e=>this.onSync(JSON.parse(e.data));
    this.es.onerror=()=>this.onNote('Koneksi terputus, mencoba menyambung lagi.');
  }

  move(from,to,promo){return this.post('/api/move',{room:this.room,token:this.token,from,to,promo});}

  reset(){return this.post('/api/reset',{room:this.room,token:this.token});}

  close(){
    if(this.es)this.es.close();
    this.es=null;
  }
}
