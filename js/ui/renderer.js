class Renderer{
  constructor(root,onSquare){
    this.cells=[];
    for(let i=0;i<64;i++){
      const d=document.createElement('div');
      d.dataset.i=i;
      root.appendChild(d);
      this.cells.push(d);
    }
    root.addEventListener('click',e=>{
      const t=e.target.closest('.sq');
      if(t)onSquare(+t.dataset.i);
    });
  }

  draw({state,last,sel,targets,checkSq,flip}){
    for(let i=0;i<64;i++){
      const d=this.cells[i],p=state.b[i];
      const cls=['sq',((i>>3)+(i&7))%2?'dark':'light'];
      if(p)cls.push(colorOf(p));
      if(i===sel)cls.push('sel');
      else if(i===checkSq)cls.push('check');
      else if(targets.has(i))cls.push(p?'cap':'tgt');
      else if(last&&(i===last.from||i===last.to))cls.push('last');
      d.className=cls.join(' ');
      d.style.gridRow=(flip?7-(i>>3):i>>3)+1;
      d.style.gridColumn=(flip?7-(i&7):i&7)+1;
      d.textContent=p?GLYPH[p.toLowerCase()]:'';
    }
  }
}
