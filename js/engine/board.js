const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
const at=(b,r,c)=>inside(r,c)?b[r*8+c]:undefined;
const colorOf=p=>p<'a'?'w':'b';
const sqName=i=>FILES[i&7]+(8-(i>>3));
const sqIndex=s=>(8-+s[1])*8+FILES.indexOf(s[0]);
const keyOf=s=>s.b.map(p=>p||'1').join('')+s.turn+s.castle+s.ep;

function parseFen(fen){
  const[pos,turn,castle,ep,half]=fen.split(' ');
  const b=[];
  for(const ch of pos.replace(/\//g,''))
    if(ch>='1'&&ch<='8')b.push(...Array(+ch).fill(null));
    else b.push(ch);
  return{b,turn,castle,ep:ep==='-'?-1:sqIndex(ep),half:+half||0};
}

function apply(s,m){
  const b=s.b.slice(),w=s.turn==='w',rook=w?'R':'r';
  const reset=b[m.to]||m.f==='ep'||m.p.toLowerCase()==='p';
  b[m.from]=null;
  b[m.to]=m.promo||m.p;
  if(m.f==='ep')b[m.to+(w?8:-8)]=null;
  if(m.f==='ck'){b[m.to+1]=null;b[m.to-1]=rook;}
  if(m.f==='cq'){b[m.to-2]=null;b[m.to+1]=rook;}
  const lost=(RIGHTS[m.from]||'')+(RIGHTS[m.to]||'');
  const castle=[...s.castle].filter(x=>!lost.includes(x)).join('')||'-';
  return{b,turn:w?'b':'w',castle,ep:m.f==='dp'?(m.from+m.to)>>1:-1,half:reset?0:s.half+1};
}
