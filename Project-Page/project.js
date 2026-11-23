(() => {
const prefersQuiet=matchMedia('(prefers-reduced-motion:reduce)');
function changeDrawing(img,file,alt,full='',onApply){
  const path='assets/'+file+'.webp';
  img.dataset.pending=path;
  const next=new Image();
  if(full){
    next.sizes='(max-width:700px) 69vw, (max-width:1530px) 69vw, 1040px';
    next.srcset=path+' 1600w, '+full+' 3368w';
  }
  next.src=path;
  const apply=()=>{
    if(img.dataset.pending!==path)return;
    if(full){img.sizes=next.sizes;img.srcset=next.srcset}
    img.src=path;img.alt=alt;onApply?.();
    if(!prefersQuiet.matches)img.animate([{opacity:.55},{opacity:1}],{duration:320,easing:'ease-out'});
  };
  next.decode().then(apply,apply);
}
function control(container,label,onClick){
  const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',onClick);container.append(button);return button;
}
const points=[
  ['A',39.67181,23.82683],
  ['B',56.97207,34.63457],
  ['C',56.48140,60.21713],
  ['1',30.89070,20.86913],
  ['2',48.28270,26.97135],
  ['3',7.13232,35.66554],
  ['4',81.33410,36.59557],
  ['5',62.07744,40.90347],
  ['6',8.70567,52.41544],
  ['7',64.78699,47.95557],
  ['8',30.87094,89.94254],
  ['9',35.54389,17.24661],
  ['10',42.00827,18.88820],
  ['11',52.03745,29.56687],
  ['12',50.51798,27.43372],
  ['13',67.67584,38.60071],
  ['14',21.43268,65.41060]
];
const map=document.getElementById('node-map');
function nodePalette(id){
  if('ABC'.includes(id))return 'heritage';
  if(Number(id)<=8)return 'identified';
  return Number(id)<=11?'stone':'forest';
}
const svgNS='http://www.w3.org/2000/svg';
const inkPositions=new Map();
function measureNodeLabels(){
  const ctx=document.createElement('canvas').getContext('2d');
  ctx.font='bold 100px Garamond';
  for(const [id] of points){
    const m=ctx.measureText(id);
    inkPositions.set(id,[(100+m.actualBoundingBoxLeft-m.actualBoundingBoxRight)/2,(100+m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2]);
  }
  for(const el of document.querySelectorAll('.node-label text'))positionLabel(el);
}
function positionLabel(text){
  const [x,y]=inkPositions.get(text.textContent);
  text.setAttribute('x',x);text.setAttribute('y',y);
}
function setBadge(el,id){
  const svg=document.createElementNS(svgNS,'svg'),text=document.createElementNS(svgNS,'text');
  svg.classList.add('node-label');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
  text.textContent=id;positionLabel(text);svg.append(text);el.replaceChildren(svg);
  el.dataset.kind=nodePalette(id);
}
measureNodeLabels();
document.fonts.load('bold 100px Garamond','ABC0123456789').then(measureNodeLabels);
for(const gallery of document.querySelectorAll('.field-gallery')){
  const heritage=gallery.dataset.gallery==='heritage';
  const locations=points.filter(([id])=>(nodePalette(id)==='heritage')===heritage);
  const photo=gallery.querySelector('.photo-window'), image=photo.querySelector('img');
  const badge=photo.querySelector('.photo-badge'), switches=gallery.querySelector('.node-switch');
  const controls=[];
  let current=0;
  const selectField=index=>{
    current=index;
    const id=locations[index][0];
    for(const button of controls)button.setAttribute('aria-pressed',String(button.dataset.node===id));
    changeDrawing(image,'node-'+id.toLowerCase(),'Field photograph at location '+id,'',()=>setBadge(badge,id));
  };
  const move=direction=>selectField((current+direction+locations.length)%locations.length);
  locations.forEach(([id,x,y],index)=>{
    const pin=control(map,'',()=>selectField(index));pin.className='pin';pin.style.left=x+'%';pin.style.top=y+'%';
    const chip=control(switches,'',()=>selectField(index));
    for(const button of [pin,chip]){
      setBadge(button,id);button.dataset.node=id;
      button.setAttribute('aria-label','Show '+(heritage?'heritage location ':'node ')+id+' field photograph');
      button.setAttribute('aria-pressed',String(index===0));
      controls.push(button);
    }
  });
  setBadge(badge,locations[0][0]);
  photo.querySelector('.photo-prev').onclick=()=>move(-1);
  photo.querySelector('.photo-next').onclick=()=>move(1);
  photo.onkeydown=e=>{
    if(e.key==='ArrowLeft' || e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1)}
  };
  let touchStart;
  photo.addEventListener('touchstart',e=>{touchStart=e.touches.length===1?e.touches[0]:null},{passive:true});
  photo.addEventListener('touchcancel',()=>{touchStart=null},{passive:true});
  photo.addEventListener('touchend',e=>{
    if(!touchStart)return;
    const dx=e.changedTouches[0].clientX-touchStart.clientX,dy=e.changedTouches[0].clientY-touchStart.clientY;
    touchStart=null;
    if(Math.abs(dx)>35 && Math.abs(dx)>Math.abs(dy)*1.3)move(dx<0?1:-1);
  },{passive:true});
}
const phases=[
  ['Read the Forest','Identify canopy openings, protected slopes and areas of regeneration before choosing a connection.'],
  ['Negotiate the Route','Move an approach to the edge of regenerating vegetation. Test an existing clearing as a detour.'],
  ['Monitor and Adapt','Track the expanding patch. Where the conflict persists, leave the proposed segment unbuilt.'],
  ['Coexist and Retreat','Keep, shift or retire sections as conditions change. Distinguish a retired trail from one that was never built.']
];
const forestOptions=document.getElementById('forest-options');
function phase(index){
  [...forestOptions.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  changeDrawing(document.getElementById('forest-map'),'forest-map-'+(index+1),phases[index][0]+' — routing diagram');
  document.getElementById('forest-reading').textContent=phases[index][1];
  document.getElementById('forest-full').href='assets/forest-'+(index+1)+'.webp';
}
phases.forEach(([name],i)=>control(forestOptions,name,()=>phase(i)));phase(0);
const views=['Glimpse','Recognise','Approach','Touch','Recede','Orient'];
const film=document.getElementById('filmstrip'),preview=document.querySelector('.perspective');
const img=document.getElementById('perspective-image'),sceneName=document.getElementById('scene-name');
const buttons=views.map((name,i)=>{
  const b=control(film,'',()=>choose(i));
  const thumb=new Image();thumb.src='assets/encounters/'+(i+1)+'-thumb.webp';thumb.alt='';thumb.loading='lazy';
  b.append(thumb);b.setAttribute('aria-label',name);return b;
});
let current=-1,target=null,settleTimer;
function select(i){
  if(i===current)return;
  current=i;
  const name=views[i];
  changeDrawing(img,'encounter-'+(i+1),name+' at the ancillary outpost','assets/encounters/'+(i+1)+'-full.webp');
  preview.setAttribute('aria-label','Enter '+name);
  sceneName.textContent=name;document.getElementById('counter').textContent=(i+1)+' / '+views.length;
  buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
}
const maxScroll=()=>Math.max(0,film.scrollHeight-film.clientHeight);
function choose(i,smooth=true){
  target=i;select(i);
  const top=maxScroll()*i/(views.length-1);
  if(Math.abs(top-film.scrollTop)<1){target=null;return}
  film.scrollTo({top,behavior:smooth&&!prefersQuiet.matches?'smooth':'instant'});
}
film.addEventListener('scroll',()=>{
  if(target===null && maxScroll())select(Math.round(film.scrollTop/maxScroll()*(views.length-1)));
  clearTimeout(settleTimer);settleTimer=setTimeout(()=>{target=null},150);
},{passive:true});
for(const type of ['wheel','touchstart','pointerdown'])film.addEventListener(type,()=>target=null,{passive:true});
film.addEventListener('keydown',e=>{
  if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
  e.preventDefault();
  const i=e.key==='Home'?0:e.key==='End'?views.length-1:Math.max(0,Math.min(views.length-1,current+(e.key==='ArrowUp'?-1:1)));
  buttons[i].focus({preventScroll:true});choose(i);
});
select(0);
new ResizeObserver(()=>{
  if(!preview.clientHeight)return;
  film.style.setProperty('--rail-height',preview.clientHeight+'px');
  choose(current,false);
}).observe(preview);

const dialog=document.getElementById('immersive'),viewport=document.getElementById('scene-viewport');
const surface=document.getElementById('scene-surface');
// Horizontal framing on narrow screens keeps the encounter marker in view.
const focalPoints=[.42,.70,.13,.765,.54,.51];
let drag=null, frame=0, lastTime=0, keyTimer=0;
const pitch={value:0,speed:0,target:0}, yaw={value:0,speed:0,target:0};
function rest(){
  pitch.target=yaw.target=0;
  scheduleLook();
}
function advance(axis,dt){
  const rate=drag?13:8;
  const offset=axis.value-axis.target;
  const initial=axis.speed+rate*offset;
  const decay=Math.exp(-rate*dt);
  axis.value=axis.target+(offset+initial*dt)*decay;
  axis.speed=(axis.speed-rate*initial*dt)*decay;
  if(Math.abs(axis.value-axis.target)<.0005 && Math.abs(axis.speed)<.003){
    axis.value=axis.target;axis.speed=0;
  }
}
function renderLook(time){
  frame=0;
  const dt=lastTime?Math.min(.05,(time-lastTime)/1000):1/60;
  lastTime=time;
  advance(yaw,dt);advance(pitch,dt);
  const x=yaw.value, y=pitch.value;
  const w=viewport.clientWidth, h=viewport.clientHeight;
  const dx=x*Math.min(43,w*.041), dy=y*Math.min(32,h*.039);
  surface.style.transform=prefersQuiet.matches?'none':
    'translate3d('+dx+'px,'+dy+'px,0) rotate('+(.16*x)+'deg)';
  // The finger touching the wall has less depth clearance than the overhanging canopy.
  const separation=[1,.84,.64,.55,.95,.74][current];
  surface.style.setProperty('--depth-x',x*separation*Math.min(17,w*.022)+'px');
  surface.style.setProperty('--depth-y',y*separation*Math.min(12,h*.019)+'px');
  if(yaw.speed || pitch.speed || yaw.value!==yaw.target || pitch.value!==pitch.target)scheduleLook();
  else lastTime=0;
}
function scheduleLook(){
  if(dialog.open && !frame)frame=requestAnimationFrame(renderLook);
}
function release(){
  drag=null;viewport.classList.remove('dragging');rest();
}
let enteredFullscreen=false,wantsFullscreen=false;
let sceneLoad=0;
function showArtwork(){
  const version=++sceneLoad;
  const prefix='assets/encounters/'+(current+1)+'-';
  surface.style.setProperty('--focus',(focalPoints[current]*100)+'%');
  const plate=(name,cls)=>{
    const im=new Image();im.alt='';im.draggable=false;im.className=cls;im.src=prefix+name+'.webp';return im;
  };
  if(prefersQuiet.matches){surface.replaceChildren(plate('immersive','still'));return}
  const far=plate('distance','far'), near=plate('foreground','near');
  Promise.all([far.decode(),near.decode()]).then(()=>{
    if(version===sceneLoad && dialog.open)surface.replaceChildren(far,near);
  }).catch(()=>{
    if(version===sceneLoad && dialog.open)surface.replaceChildren(plate('immersive','still'));
  });
}
prefersQuiet.addEventListener('change',()=>{if(dialog.open){release();showArtwork()}});
preview.onclick=()=>{
  showArtwork();
  document.getElementById('immersive-title').textContent=views[current];
  dialog.showModal();scheduleLook();
  if(!document.fullscreenElement && document.documentElement.requestFullscreen){
    wantsFullscreen=true;
    document.documentElement.requestFullscreen().then(()=>{
      if(!dialog.open && document.fullscreenElement)document.exitFullscreen().catch(()=>{});
    }).catch(()=>{wantsFullscreen=false});
  }
};
viewport.onpointerdown=e=>{
  if(e.button!==0 || drag || prefersQuiet.matches)return;
  clearTimeout(keyTimer);
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:yaw.value,startY:pitch.value};
  viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');
};
viewport.onpointermove=e=>{
  if(!drag || drag.id!==e.pointerId)return;
  const reachX=Math.max(90,Math.min(310,viewport.clientWidth*.32));
  const reachY=Math.max(85,Math.min(240,viewport.clientHeight*.32));
  yaw.target=Math.tanh((e.clientX-drag.x)/reachX+Math.atanh(Math.max(-.999,Math.min(.999,drag.startX))));
  pitch.target=Math.tanh((e.clientY-drag.y)/reachY+Math.atanh(Math.max(-.999,Math.min(.999,drag.startY))));
  scheduleLook();
};
viewport.onlostpointercapture=e=>{if(drag && e.pointerId===drag.id)release()};
dialog.onkeydown=e=>{
  const offsets={ArrowLeft:[-.55,0],ArrowRight:[.55,0],ArrowUp:[0,-.55],ArrowDown:[0,.55]};
  if(!offsets[e.key] || prefersQuiet.matches || drag)return;
  e.preventDefault();
  [yaw.target,pitch.target]=offsets[e.key];
  scheduleLook();clearTimeout(keyTimer);keyTimer=setTimeout(rest,320);
};
const closeScene = document.getElementById('close-scene');
closeScene.onclick = () => dialog.close();
// Some touch browsers suppress the next compatibility click after dragging.
closeScene.addEventListener('touchend', event => {
  if (event.touches.length || event.changedTouches.length !== 1) return;
  const touch = event.changedTouches[0];
  if (!closeScene.contains(document.elementFromPoint(touch.clientX, touch.clientY))) return;
  event.preventDefault();
  dialog.close();
}, {passive: false});
document.addEventListener('fullscreenchange',()=>{
  if(wantsFullscreen && document.fullscreenElement){enteredFullscreen=true;return}
  if(enteredFullscreen && !document.fullscreenElement){enteredFullscreen=false;wantsFullscreen=false;if(dialog.open)dialog.close()}
});
dialog.onclose=()=>{
  sceneLoad++;surface.replaceChildren();clearTimeout(keyTimer);
  wantsFullscreen=false;
  if(enteredFullscreen && document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  enteredFullscreen=false;
  cancelAnimationFrame(frame);frame=0;lastTime=0;drag=null;
  for(const axis of [yaw,pitch]){axis.target=axis.value=axis.speed=0}
  surface.style.transform="none";
  viewport.classList.remove('dragging');preview.focus({preventScroll:true});
};
const returnTop=document.getElementById('return-top');
const opening=document.getElementById('transect-track');
const stepNav=document.getElementById('steps-nav');
let lotusFrame=0;
function paintLotus(){
  lotusFrame=0;
  const range=document.documentElement.scrollHeight-document.documentElement.clientHeight;
  let progress=Math.min(1,Math.max(0,scrollY/Math.max(range,1)));
  if(!opening.hidden){
    const step=Array.from(stepNav.children).findIndex(b=>b.getAttribute('aria-current')==='true');
    progress=Math.max(0,step)*.012;
  }
  // Reveal from the central flower out to the taller side shoots.
  const growth=progress*117;
  returnTop.style.setProperty('--grown',Math.max(0,growth-13)+'%');
  returnTop.style.setProperty('--tip',Math.max(.01,growth)+'%');
  returnTop.style.setProperty('--bloom',Math.min(1,progress*9));
  returnTop.style.setProperty('--stem',Math.min(1,(1-progress)*8));
}
function queueLotus(){if(!lotusFrame)lotusFrame=requestAnimationFrame(paintLotus)}
returnTop.onclick=()=>{
  if(!opening.hidden){stepNav.firstElementChild?.click();return}
  window.scrollTo({top:0,behavior:prefersQuiet.matches?'instant':'smooth'});
  document.querySelector('#transects h2').focus({preventScroll:true});
};
new ResizeObserver(queueLotus).observe(document.body);
new MutationObserver(queueLotus).observe(stepNav,{subtree:true,attributes:true,attributeFilter:['aria-current']});
new MutationObserver(queueLotus).observe(opening,{attributes:true,attributeFilter:['hidden']});
addEventListener('scroll',queueLotus,{passive:true});
addEventListener('resize',queueLotus);
addEventListener('pageshow',queueLotus);
queueLotus();
addEventListener('resize',scheduleLook);
})();


