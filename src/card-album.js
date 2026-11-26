export function mountAlbum(markup) {
  const grid = document.querySelector('#grid');
  const single = matchMedia('(max-width:700px)');
  const sheets = [];
  for (let i=0; i<markup.length; i+=4) {
    const sheet=document.createElement('section');
    sheet.className='album-sheet';
    sheet.setAttribute('aria-label',`앨범 ${sheets.length+1}쪽`);
    for(let j=0;j<4;j++){
      const pocket=document.createElement('div');
      pocket.className='pocket';
      pocket.innerHTML=markup[i+j] || '';
      sheet.append(pocket);
    }
    sheets.push(sheet);
  }
  grid.replaceChildren(...sheets);
  const prev=document.querySelector('#prevPage'), next=document.querySelector('#nextPage');
  let start=0;
  function show(direction=0){
    const stride=single.matches?1:2;
    start=Math.min(Math.floor((sheets.length-1)/stride)*stride, Math.max(0,Math.floor(start/stride)*stride + direction*stride));
    sheets.forEach((sheet,i)=>{sheet.hidden=i<start||i>=start+stride;});
    if(direction && !matchMedia('(prefers-reduced-motion:reduce)').matches){
      const leaf=sheets[direction>0?start:Math.min(start+stride-1,sheets.length-1)];
      leaf.animate([{transform:'perspective(1200px) rotateY('+ (direction>0?-86:86)+'deg)',filter:'brightness(.65)'},{transform:'perspective(1200px) rotateY(0deg)',filter:'brightness(1)'}],{duration:420,easing:'ease-out'});
    }
    prev.disabled=start===0;next.disabled=start+stride>=sheets.length;
    document.querySelector('#pageNumber').textContent=(stride===2 && start+1<sheets.length?`${start+1}–${start+2}`:start+1)+' / '+sheets.length+'쪽';
  }
  prev.onclick=()=>show(-1);next.onclick=()=>show(1);
  single.addEventListener('change',()=>show());
  document.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||document.querySelector('#mfx-detail-screen:not([hidden]),#detail:not([hidden])'))return;
    const button=e.key==='ArrowLeft'?prev:e.key==='ArrowRight'?next:null;
    if(button&&!button.disabled){e.preventDefault();button.click();button.focus();}
  });
  show();
}
