/* Place <coffee-fairy></coffee-fairy> where the artwork belongs. */
(() => {
  if (customElements.get('coffee-fairy')) return;
  const scriptURL = document.currentScript.src;
  const assetURL = file => new URL('assets/' + file + '.webp?v=11', scriptURL).href;
  const armSkin = '#fad7b1';
  const lengths = { lift: 15, notice: 15, turn: 15, front: 17, speak: 9 };
  const idleDuration = 2150;
  // A closed pen path: approach the tilted glass, draw along it, lift away.
  // The position and velocity agree at both ends of every cycle.
  function brushPose(ms) {
    const phase=2*Math.PI*ms/idleDuration;
    const depth=(1-Math.cos(phase))/2;
    const height=58*depth;
    const approach=Math.min(1,depth/.33);
    const contact=approach*approach*(3-2*approach);
    const clearance=33*(1-contact)+16*Math.min(0,Math.sin(phase))**2;
    return [1537-.70*height-clearance,530+height,-.095*depth-.018*Math.sin(phase),depth];
  }
  const restPose=brushPose(0);
  const approach = [
    ['lift', 0, 1, 310], ['lift', 1, 1, 200], ['notice', 0, 1, 230],
    ['turn', 0, 1, 220], ['front', 0, 1, 270], ['speak', 0, 1, 170]
  ];
  const retreat = [
    ['speak', 1, 0, 100], ['front', 1, 0, 200], ['turn', 1, 0, 180],
    ['notice', 1, 0, 180], ['lift', 1, 0, 240]
  ];
  const duration = sequence => sequence.reduce((sum,step) => sum + step[3], 0);
  function progress(ms,start,end) {
    const t=Math.max(0,Math.min(1,(ms-start)/(end-start)));
    return t*t*(3-2*t);
  }
  function between(a,b,t) {return a.map((v,i)=>v+(b[i]-v)*t);}
  function celAt(steps,time) {
    for (const [name,start,end,ms] of steps) {
      if (time<=ms) return [name,start+(end-start)*progress(time,0,ms)];
      time-=ms;
    }
    const [name,,end]=steps[steps.length-1];return [name,end];
  }
  // Master-cel wrist coordinates, angle and perspective scale. Anchor the grip
  // to the inside of the handle, both on the cloud and when offered forward.
  const poised=[1344,550,0,1];
  const parked=[1396,523,1.54,1];
  const handle=[1324,662];
  const offered=[1408,534];
  const gripPoint=[92,-37];
  function fingertip([x,y,a,s]) {
    return [x+s*(gripPoint[0]*Math.cos(a)-gripPoint[1]*Math.sin(a)),
            y+s*(gripPoint[0]*Math.sin(a)+gripPoint[1]*Math.cos(a))];
  }
  function gripAt(pt,a,s) {
    const offset=fingertip([0,0,a,s]);
    return [pt[0]-offset[0],pt[1]-offset[1],a,s];
  }
  const atCup=gripAt(handle,.54,1);
  const extended=gripAt(offered,.12,1.18);
  const serviceEnd=4780;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const touchScreen = matchMedia('(hover: none) and (pointer: coarse)');
  const stillIdle = () => reduce.matches && !touchScreen.matches;
  const invitation = "You’ve been working hard. Would you like a cup of coffee?";
  const silkURL = new URL('assets/silk.svg?v=4',scriptURL).href;
  function loadArt(names) {
    return Promise.all(names.map(name => new Promise((resolve,reject) => {
      const img = new Image();
      img.onload = () => resolve([name,img]);
      img.onerror = () => reject(new Error('Missing fairy asset: ' + name));
      img.src = assetURL(name);
    }))).then(Object.fromEntries);
  }

  class CoffeeFairy extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).innerHTML = `
        <style>
          :host { display:block; width:100%; max-width:var(--fairy-width,760px); color:#233c37; }
          *, *::before, *::after { box-sizing:border-box; }
          .scene { position:relative; container-type:inline-size; }
          .art { display:block; position:relative; width:100%; aspect-ratio:2/1; }
          canvas,img { display:block; width:100%; height:100%; }
          .silk { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
          .poster { position:relative; }
          canvas { position:absolute; inset:0; }
          .visit { position:absolute; left:53%; top:20%; width:34%; height:59%; border:0; border-radius:40%; cursor:pointer; appearance:none; background:transparent; -webkit-tap-highlight-color:transparent; }
          button { font:inherit; touch-action:manipulation; }
          button:focus-visible { outline:3px solid #336998; outline-offset:3px; }
          .visit[aria-expanded="true"]:focus-visible { outline:0; }
          .dialog { position:absolute; bottom:43%; left:10%; width:max-content; max-width:44%; padding:14px 16px; background:#fffaf0; color:#273a32; border:1px solid #b39b7f; border-radius:17px 17px 3px 17px; box-shadow:0 4px 16px #3d322014; font:15px/1.4 system-ui,sans-serif; }
          .message { margin:0; font:500 clamp(15px,2.7cqw,21px)/1.25 Georgia,serif; text-wrap:pretty; }
          .actions { display:flex; gap:6px; flex-wrap:wrap; margin-top:10px; }
          .actions button { min-height:36px; border:1px solid #a7b3a5; padding:4px 12px; border-radius:18px; background:#fffaf0; color:#315148; cursor:pointer; font-size:13px; }
          .actions button:first-child { background:#345746; color:#fffdf4; border-color:#345746; }
          .sr { clip-path:inset(50%); position:absolute; height:1px; width:1px; overflow:hidden; }
          [hidden] { display:none!important; }
          .dialog-slot { display:contents; }
          .dialog-sizer { display:none; }
          @container (max-width:460px) {
            .dialog-slot { display:grid; grid-template-columns:minmax(0,1fr); margin-top:6px; }
            .dialog { position:relative; inset:auto; grid-area:1/1; place-self:start center; max-width:100%; border-radius:14px; }
            .dialog-sizer { display:block; visibility:hidden; pointer-events:none; }
            .message { font-size:17px; }
            .actions button { min-height:44px; }
          }
        </style>
        <div class="scene" lang="en">
          <div class="art">
            <img class="silk" alt="" aria-hidden="true" draggable="false">
            <img class="poster" alt="A Dunhuang flying fairy reclines on a cloud, drawing on her tablet." draggable="false">
            <canvas width="1330" height="665" aria-hidden="true"></canvas>
            <button type="button" class="visit" aria-label="Say hello to the cloud artist" aria-expanded="false" aria-controls="greeting"></button>
          </div>
          <div class="dialog-slot"><div id="greeting" class="dialog" role="group" aria-label="Coffee invitation" hidden>
            <p class="message">${invitation}</p>
            <div class="actions"><button type="button" data-answer="yes">Yes, please</button><button type="button" data-answer="later">Maybe later</button></div>
          </div></div>
          <span class="sr" role="status" aria-live="polite" aria-atomic="true"></span>
        </div>`;
      const find = selector => this.shadowRoot.querySelector(selector);
      find('.silk').src = silkURL;
      this.poster = find('.poster');
      this.poster.src = assetURL('rest');
      this.canvas = find('canvas');
      this.frame = document.createElement('canvas');
      this.frame.width=this.canvas.width;this.frame.height=this.canvas.height;
      this.ctx = this.frame.getContext('2d');
      this.display = this.canvas.getContext('2d');
      if(this.display)this.display.globalCompositeOperation='copy';
      this.hit = find('.visit');
      this.dialog = find('.dialog');
      // Reserve the actual wrapped question and button height, including text zoom.
      const sizer = this.dialog.cloneNode(true);
      sizer.removeAttribute('id');
      sizer.hidden=false;
      sizer.inert=true;
      sizer.setAttribute('aria-hidden','true');
      sizer.classList.add('dialog-sizer');
      this.dialog.after(sizer);
      this.message = find('.message');
      this.actions = find('.actions');
      this.status = find('.sr');
      this.hit.onpointerdown = event => { this.tapType = event.pointerType; };
      this.hit.onclick = event => {
        // Safari can label a tap's final click as a mouse click.
        const pointerType = this.tapType || event.pointerType;
        const touch = pointerType === 'touch' && event.detail !== 0;
        const mouse = pointerType === 'mouse' && event.detail !== 0;
        if (mouse) this.pointer={x:event.clientX,y:event.clientY};
        this.tapType = null;
        this.greet(event.detail===0,mouse,touch);
      };
      this.hit.onkeydown = event => {
        if (event.key==='Enter' || event.key===' ') {
          event.preventDefault();
          if (!event.repeat) this.greet(true);
        }
      };
      this.actions.onclick = event => {
        if (event.target.dataset.answer) this.answer(event.target.dataset.answer);
      };
      this.onMove = event => {
        if (event.pointerType === 'touch' || !this.inView) return;
        this.pointer={x:event.clientX,y:event.clientY};
        const r = this.hit.getBoundingClientRect();
        const near = Math.hypot(Math.max(r.left-event.clientX,0,event.clientX-r.right),
                                Math.max(r.top-event.clientY,0,event.clientY-r.bottom)) < Math.min(34,r.width*.20);
        if (!near) this.armed = true;
        else if (this.armed && this.phase==='drawing') this.greet(false,true);
        this.checkLeave();
      };
      this.onWindowLeave = event => {
        if (event.type==='pointerout' && (event.relatedTarget || event.pointerType==='touch')) return;
        this.pointer=null; this.armed=true; this.checkLeave();
      };
      this.actions.addEventListener('focusin',event=>{
        if (event.target.matches(':focus-visible')) {this.mouseVisit=false;this.cancelLeave();clearTimeout(this.touchTimer);}
      });
      this.onLayout=()=>this.checkLeave();
      this.onKey = event => { if (event.key==='Escape' && this.phase==='offer') this.answer('later'); };
      this.resync = () => { this.stopTick(); this.schedule(); };
      this.onMotion = () => {
        if (this.phase==='drawing' && stillIdle()) this.drawBrush(restPose);
        this.resync();
      };
      this.tick = time => {
        this.raf = 0;
        if (this.lastTime!=null) this.advance(Math.min(80,time-this.lastTime));
        this.lastTime=time;
        this.schedule();
      };
    }
    connectedCallback() {
      this.phase='drawing'; this.elapsed=0; this.armed=true; this.inView=false; this.stock=1;
      this.pointer=null; this.mouseVisit=false; this.leaveTimer=null;
      this.keyboard=false; this.lastFrame=''; this.dialog.hidden=true;
      this.hit.setAttribute('aria-expanded','false');
      this.hit.disabled=false; this.hit.tabIndex=0;
      this.status.textContent='';
      this.observer=new IntersectionObserver(entries => {
        this.inView=entries[entries.length-1].isIntersecting;
        if (this.inView) {
          this.prepare();
          if (touchScreen.matches) this.prepareSilk();
        }
        this.resync();
      });
      this.observer.observe(this);
      window.addEventListener('pointermove',this.onMove,{passive:true});
      window.addEventListener('pointerout',this.onWindowLeave);
      window.addEventListener('blur',this.onWindowLeave);
      window.addEventListener('scroll',this.onLayout,true);
      window.addEventListener('resize',this.onLayout);
      this.shadowRoot.addEventListener('keydown',this.onKey);
      document.addEventListener('visibilitychange',this.resync);
      reduce.addEventListener('change',this.onMotion);
    }
    disconnectedCallback() {
      this.stopTick(); this.cancelLeave(); clearTimeout(this.touchTimer); this.observer.disconnect();
      window.removeEventListener('pointermove',this.onMove);
      window.removeEventListener('pointerout',this.onWindowLeave);
      window.removeEventListener('blur',this.onWindowLeave);
      window.removeEventListener('scroll',this.onLayout,true);
      window.removeEventListener('resize',this.onLayout);
      this.shadowRoot.removeEventListener('keydown',this.onKey);
      document.removeEventListener('visibilitychange',this.resync);
      reduce.removeEventListener('change',this.onMotion);
    }
    async prepareSilk() {
      if (this.silkPending || !this.shadowRoot.querySelector('img.silk')) return;
      this.silkPending=true;
      try {
        const response=await fetch(silkURL);
        if (!response.ok) return;
        const source=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
        const svg=source.documentElement;
        if (!svg.querySelector('path animate')) return;
        // Inline playback keeps the original morph on the page's SVG timeline on iOS.
        svg.querySelector('style')?.remove();
        svg.querySelector('.still')?.remove();
        svg.setAttribute('class','silk');
        svg.setAttribute('aria-hidden','true');
        this.shadowRoot.querySelector('img.silk')?.replaceWith(document.importNode(svg,true));
      } catch { /* Keep the original image fallback. */ }
      finally { this.silkPending=false; }
    }
    async prepare() {
      if (this.preparing || this.images?.speak) return;
      this.preparing=true;
      try {
        if (!this.desk) {
          this.images=await loadArt(['rest','desk','brush-hand','serving-props']);
          this.desk=document.createElement('canvas');
          this.desk.width=1330; this.desk.height=665;
          const ctx=this.desk.getContext('2d');
          ctx.drawImage(this.images.rest,0,0);
          ctx.clearRect(768,306,384,204);
          ctx.drawImage(this.images.desk,768,306,384,204);
          if (this.phase==='drawing') this.drawBrush(stillIdle()?restPose:brushPose(this.elapsed));
          this.schedule();
        }
        Object.assign(this.images,await loadArt(Object.keys(lengths)));
      } catch {
        if (this.phase==='waiting-for-cup') {
          this.phase='answered';
          this.message.textContent=this.status.textContent='Here you go. Enjoy your coffee!';
          this.resync();
        }
        return;
      }
      finally { this.preparing=false; }
      if (this.phase==='waiting-for-cup') this.startServing();
      else if (this.phase==='offer' || this.phase==='answered') this.draw('speak',1);
      this.schedule();
    }
    stopTick() {
      cancelAnimationFrame(this.raf); this.raf=0; this.lastTime=null;
    }
    schedule() {
      if (this.raf || !this.isConnected || !this.inView || document.hidden) return;
      if (this.phase==='offer' || this.phase==='waiting-for-cup' || (this.phase==='drawing' && (!this.desk || stillIdle()))) return;
      this.raf=requestAnimationFrame(this.tick);
    }
    draw(name,t) {
      if (!this.images?.[name] || !this.ctx) return;
      const frame=Math.round(Math.max(0,Math.min(1,t))*(lengths[name]-1));
      if (this.lastFrame===name+frame) return;
      this.lastFrame=name+frame;
      const c=this.ctx;
      // Integer backing-store bounds avoid a hairline along transparent tile edges.
      c.clearRect(0,0,1330,665);
      c.drawImage(this.images.rest,0,0,1330,665);
      c.clearRect(720,129,462,396);
      c.save();c.scale(.75,.75);this.cup(handle,1,this.stock);c.restore();
      c.drawImage(this.images[name],(frame%3)*462,Math.floor(frame/3)*396,462,396,720,129,462,396);
      this.present();
    }
    present() {
      // Publish the composed pose in one write, including its transparent edge.
      if(!this.display)return;
      this.display.drawImage(this.frame,0,0);
      this.poster.style.visibility='hidden';
    }
    drawBrush(pose) {
      if (!this.desk || !this.ctx) return;
      const [tx,ty,angle,depth]=pose;
      const co=Math.cos(angle),si=Math.sin(angle);
      const wx=tx-(160*co+20*si),wy=ty-(160*si-20*co);
      const ex=1177-12*depth,ey=647-7*depth;
      const ctx=this.ctx;
      ctx.clearRect(0,0,1330,665);
      ctx.save();ctx.scale(.75,.75);this.cup(handle,1,this.stock);ctx.restore();
      ctx.drawImage(this.desk,0,0);
      ctx.save();
      ctx.scale(.75,.75);
      this.arm(wx,wy,angle,depth,ex,ey,1);
      ctx.translate(wx,wy);ctx.rotate(angle);
      ctx.drawImage(this.images['brush-hand'],1326-1344,426-550);
      ctx.restore();
      this.lastFrame='drawing:'+tx.toFixed(3)+','+ty.toFixed(3);
      this.present();
    }
    arm(wx,wy,angle,depth,ex,ey,scale,serving=0) {
      const ctx=this.ctx;
      const co=Math.cos(angle),si=Math.sin(angle);
      const supportEnd=618+22*depth;
      ctx.beginPath();
      ctx.moveTo(1210,531);
      ctx.quadraticCurveTo(1226,537,1243,529);
      ctx.bezierCurveTo(1248,548,1260,572,1265,supportEnd-8);
      ctx.quadraticCurveTo(1266,supportEnd+2,1248,supportEnd+6);
      ctx.quadraticCurveTo(1219,supportEnd+17,1216,supportEnd);
      ctx.quadraticCurveTo(1213,578,1210,531);
      ctx.fillStyle=armSkin;
      ctx.fill();
      // The shoulder seam stays pinned. Deform one continuous skin silhouette
      // towards the elbow and wrist; the arm has the same edge on every tick.
      const upper=(x,y)=>{
        const u=Math.max(0,Math.min(1,((x-1094)*83+(y-541)*106)/18125));
        return [x+(ex-1177)*u,y+(ey-647)*u];
      };
      const fore=(x,y)=>{
        const u=((x-1177)*167-(y-647)*97)/37298;
        const v=((x-1177)*97+(y-647)*167)/37298;
        const widen=Math.max(1,148/Math.max(1,Math.hypot(wx-ex,wy-ey)));
        return [ex+u*(wx-ex)-v*widen*(wy-ey),ey+u*(wy-ey)+v*widen*(wx-ex)];
      };
      const wrist=(x,y)=>[wx+scale*((x-1344)*co-(y-550)*si),wy+scale*((x-1344)*si+(y-550)*co)];
      // Keep cross-sections perpendicular to the forearm. Rotating a bent hand
      // must never rotate the two sides of its forearm onto the same line.
      const dx=wx-ex,dy=wy-ey,length=Math.max(1,Math.hypot(dx,dy));
      const section=(original,along,radius)=>serving===0?original:between(original,
        [ex+along*dx-dy/length*radius,ey+along*dy+dx/length*radius],serving);
      const wristRadius=14*scale;
      const wristAlong=1-serving*Math.max(0,Math.sin(angle))*.045;
      ctx.beginPath();
      ctx.moveTo(1067,552);
      ctx.bezierCurveTo(...upper(1086,582),...upper(1105,619),...upper(1137,649));
      ctx.bezierCurveTo(...upper(1154,666),...upper(1171,679),...section(fore(1185,672),.025,27));
      ctx.bezierCurveTo(...section(fore(1228,650),.29,28),...section(fore(1297,606),.78,19*scale),...section(wrist(1349,560),wristAlong,wristRadius));
      // Continue under both bangles into the palm. This is one opaque surface,
      // so steam or a cup drawn behind the arm cannot show through the joint.
      ctx.bezierCurveTo(...wrist(1356,555),...wrist(1365,546),...wrist(1372,540));
      ctx.lineTo(...wrist(1362,521));
      ctx.bezierCurveTo(...wrist(1353,526),...wrist(1342,535),...section(wrist(1336,540),wristAlong,-wristRadius));
      ctx.bezierCurveTo(...section(fore(1298,565),.78,-19*scale),...section(fore(1226,601),.29,-25),...section(fore(1181,619),.10,-24));
      ctx.bezierCurveTo(...upper(1152,588),...upper(1133,551),1118,527);
      ctx.bezierCurveTo(1099,523,1078,536,1067,552);
      ctx.closePath();
      ctx.fillStyle=armSkin;
      ctx.fill();
    }
    play(steps,time) {
      this.draw(...celAt(steps,time));
    }
    cup(pt,size,opacity=1) {
      if (!opacity) return;
      const c=this.ctx;c.save();c.globalAlpha=opacity;
      c.translate(pt[0],pt[1]);c.scale(-size,size);
      c.drawImage(this.images['serving-props'],561,420,103,116,-83,-80,103,116);
      c.restore();
    }
    pen([x,y,angle]) {
      const c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);
      c.beginPath();c.moveTo(33,-110);c.quadraticCurveTo(28,-117,36,-117);
      c.lineTo(149,-34);c.lineTo(160,-20);c.lineTo(143,-29);c.closePath();
      c.fillStyle='#10573f';c.fill();c.restore();
    }
    serviceHead(name,t) {
      const c=this.ctx;
      const i=Math.round((lengths[name]-1)*t);
      c.save();
      // The body rig owns everything below the sleeve. Use just the approved
      // head, neckline and propping hand from the original turning cels.
      c.beginPath();c.moveTo(988,174);c.lineTo(1320,174);c.lineTo(1320,430);
      c.lineTo(1313,465);c.lineTo(1295,490);
      c.lineTo(1263,501);c.lineTo(1261,532);c.lineTo(1197,532);
      c.lineTo(1191,567);c.lineTo(1150,551);c.lineTo(1120,515);
      c.lineTo(1080,511);c.lineTo(1042,538);c.lineTo(985,538);c.closePath();
      c.clip();c.globalCompositeOperation='copy';
      c.drawImage(this.images[name],i%3*462,Math.floor(i/3)*396,462,396,960,172,616,528);
      c.restore();
    }
    drawService(ms) {
      const c=this.ctx;
      let wrist=poised;
      if(ms<620) wrist=between(poised,parked,progress(ms,0,620));
      else if(ms<1420) {
        const approach=progress(ms,710,1420);
        wrist=between(parked,atCup,approach);
        wrist[0]-=25*Math.sin(Math.PI*approach);
        wrist[1]-=17*Math.sin(Math.PI*approach);
      }
      else if(ms<2870) {
        const lift=progress(ms,1590,2390);
        wrist=between(atCup,extended,lift);
        wrist[1]-=18*Math.sin(Math.PI*lift);
      }
      else if(ms<4090) wrist=between(extended,parked,progress(ms,3320,4090));
      else wrist=between(parked,poised,progress(ms,4170,serviceEnd));
      const [wx,wy,angle,size]=wrist;
      const curl=progress(ms,1400,1600)*(1-progress(ms,2840,3120));
      const give=progress(ms,2860,3320);
      const held=ms>=1590&&ms<2860;
      const cupAt=held?fingertip(wrist):ms<1590?handle:[offered[0]-55*give,offered[1]+75*give];
      const cupSize=held?size:ms<1590?1:extended[3]+.23*give;
      let head;
      if(ms<300)head=['speak',1-progress(ms,0,300)];
      else if(ms<3320)head=['speak',progress(ms,2040,2370)];
      else head=celAt(retreat,ms-3320);
      c.clearRect(0,0,1330,665);c.drawImage(this.desk,0,0);
      c.save();c.scale(.75,.75);
      this.serviceHead(...head);
      this.pen(ms<=620||ms>=4170?wrist:parked);
      // The thumb folds through the opening from behind; the fingers curl over
      // the near edge. Both follow the same wrist transform as the bracelets.
      if(curl>0) {
        c.save();c.translate(wx,wy);c.rotate(angle);c.scale(size,size);
        c.translate(57,-53);c.scale(curl,curl);
        c.beginPath();c.moveTo(-8,-4);c.bezierCurveTo(4,-9,14,-1,21,8);
        c.bezierCurveTo(27,16,30,22,36,19);c.quadraticCurveTo(41,15,43,18);
        c.bezierCurveTo(41,27,32,29,25,25);c.bezierCurveTo(17,21,10,11,-6,9);
        c.fillStyle='#f8d2a9';c.fill();
        c.restore();
      }
      this.cup(cupAt,cupSize,1-give);
      const reach=progress(ms,710,1420)*(1-progress(ms,3320,4090));
      const forward=progress(ms,1590,2390)*(1-progress(ms,3320,4090));
      const flex=progress(ms,0,540)*(1-progress(ms,4170,serviceEnd));
      this.arm(wx,wy,angle,reach,1177-8*reach+29*forward,647+9*reach-12*forward,size,flex);
      c.save();c.translate(wx,wy);c.rotate(angle);c.scale(size,size);
      const handFrame=Math.round(14*curl);
      c.drawImage(this.images['serving-props'],(handFrame%4)*187,Math.floor(handFrame/4)*140,
        187,140,-18,-124,187,140);
      c.restore();
      if(ms<130) {
        // A short register blend matches the rig to the exact last greeting cel.
        c.globalAlpha=1-progress(ms,0,130);
        const last=lengths.speak-1;
        c.drawImage(this.images.speak,last%3*462,Math.floor(last/3)*396,462,396,960,172,616,528);
      }
      c.restore();
      this.lastFrame='serving:'+Math.round(ms);
      this.present();
    }
    finishVisit() {
      this.phase='drawing';this.elapsed=0;this.drawBrush(restPose);
      this.hit.tabIndex=0;
      if (this.keyboard) this.hit.focus({preventScroll:true});
      this.keyboard=false;
    }
    cancelLeave() {
      clearTimeout(this.leaveTimer);this.leaveTimer=null;
    }
    inConversation() {
      if (!this.pointer) return false;
      const {x,y}=this.pointer;
      const a=this.hit.getBoundingClientRect(),b=this.dialog.getBoundingClientRect();
      const margin=Math.min(34,a.width*.20);
      const inside=(l,t,r,d)=>x>=l-margin && x<=r+margin && y>=t-margin && y<=d+margin;
      if (inside(a.left,a.top,a.right,a.bottom)||inside(b.left,b.top,b.right,b.bottom)) return true;
      // Keep a safe crossing between the artist and the answer buttons.
      const top=Math.max(a.top,b.top),bottom=Math.min(a.bottom,b.bottom);
      if (top<=bottom && inside(Math.min(a.left,b.left),top,Math.max(a.right,b.right),bottom)) return true;
      const left=Math.max(a.left,b.left),right=Math.min(a.right,b.right);
      return left<=right && inside(left,Math.min(a.top,b.top),right,Math.max(a.bottom,b.bottom));
    }
    checkLeave() {
      if (this.phase!=='offer' || !this.mouseVisit || this.inConversation()) {this.cancelLeave();return;}
      if (this.leaveTimer!==null) return;
      this.leaveTimer=setTimeout(()=>{
        this.leaveTimer=null;
        if (this.phase!=='offer' || !this.mouseVisit || this.inConversation()) return;
        this.resumeDrawing();
      },300);
    }
    resumeDrawing() {
      if (this.phase!=='offer') return;
      this.armed=true; this.dialog.hidden=true; this.status.textContent='';
      this.hit.setAttribute('aria-expanded','false');
      this.phase='returning';this.elapsed=0;this.resync();
    }
    greet(keyboard,mouse=false,touch=false) {
      if (this.phase!=='drawing') return;
      this.armed=false; this.keyboard=keyboard; this.mouseVisit=mouse; this.touchVisit=touch;
      this.hit.tabIndex=-1;
      if (reduce.matches || !this.images?.speak) { this.showOffer(); return; }
      // Match the current velocity as the artist lifts her pen to greet a visitor.
      this.exitPose=brushPose(this.elapsed);
      const ahead=brushPose(this.elapsed+1);
      this.exitVelocity=ahead.map((value,i)=>value-this.exitPose[i]);
      this.phase='finish-stroke';this.elapsed=0;
      this.resync();
    }
    advance(delta) {
      if (this.phase==='drawing') {
        this.elapsed=(this.elapsed+delta)%idleDuration;
        this.drawBrush(brushPose(this.elapsed));
      } else if (this.phase==='finish-stroke') {
        this.elapsed+=delta;
        const t=Math.min(1,this.elapsed/390);
        const ease=t*t*(3-2*t);
        this.drawBrush(this.exitPose.map((v,i)=>v+(restPose[i]-v)*ease+
          this.exitVelocity[i]*390*t*(1-t)*(1-t)));
        if (t===1 || reduce.matches) { this.phase='turning'; this.elapsed=0; }
      } else if (this.phase==='turning') {
        this.elapsed+=delta;
        if(this.stock<1) this.stock=Math.max(this.stock,progress(this.elapsed,0,520));
        this.play(approach,this.elapsed);
        if (this.elapsed>=duration(approach) || reduce.matches) this.showOffer();
      } else if (this.phase==='serving') {
        this.elapsed+=delta;
        const still=this.stillService;
        const moment=still?2390:this.elapsed;
        this.drawService(moment);
        if(moment>=2130 && moment<3180 && this.dialog.hidden){
          this.message.textContent='Here you go. Enjoy your coffee!';
          this.status.textContent=this.message.textContent;this.dialog.hidden=false;
        }
        if(moment>=3180)this.dialog.hidden=true;
        if(this.elapsed>=(still?1350:serviceEnd)){
          this.dialog.hidden=true;this.finishVisit();
        }
      } else if (this.phase==='answered') {
        this.elapsed+=delta;
        if (this.elapsed>=1350) {
          this.dialog.hidden=true; this.phase='returning'; this.elapsed=0;
        }
      } else if (this.phase==='returning') {
        this.elapsed+=delta;
        this.play(retreat,this.elapsed);
        if (this.elapsed>=duration(retreat) || reduce.matches || !this.images?.speak) {
          this.finishVisit();
        }
      }
    }
    showOffer() {
      this.phase='offer'; this.elapsed=0;this.stock=1; this.draw('speak',1);
      const words=invitation;
      this.message.textContent=words; this.status.textContent=words;
      this.hit.setAttribute('aria-expanded','true');
      this.actions.hidden=false; this.dialog.hidden=false;
      if (this.touchVisit) this.touchTimer=setTimeout(()=>this.resumeDrawing(),10000);
      if (this.keyboard) this.actions.firstElementChild.focus({preventScroll:true});
      this.checkLeave();
    }
    startServing() {
      this.phase='serving';this.elapsed=0;this.stock=0;this.dialog.hidden=true;
      // A deliberate tap plays the handoff even when the greeting is shortened.
      this.stillService=reduce.matches && !this.touchVisit;
      this.status.textContent='She sets down her pen and picks up your coffee.';
      this.drawService(this.stillService?2390:0);
      this.resync();
    }
    answer(choice) {
      if (this.phase!=='offer') return;
      clearTimeout(this.touchTimer);
      this.cancelLeave();this.phase='answered'; this.elapsed=0;
      const words=choice==='yes' ? 'Here you go. Enjoy your coffee!' : 'Of course. I’ll be here.';
      this.message.textContent=words; this.status.textContent=words;
      this.actions.hidden=true; this.hit.setAttribute('aria-expanded','false');
      if(choice==='yes') {
        if (this.images?.speak && this.desk) this.startServing();
        else if (this.touchVisit) {
          this.phase='waiting-for-cup';
          this.message.textContent=this.status.textContent='One moment…';
          this.prepare();
        }
      }
      this.dispatchEvent(new CustomEvent('coffee-response',{detail:{answer:choice},bubbles:true,composed:true}));
      this.resync();
    }
  }
  customElements.define('coffee-fairy',CoffeeFairy);
})();
