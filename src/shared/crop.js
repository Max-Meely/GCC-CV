/* KXCROP: a small crop + rotate dialog. Opens over any image/canvas, lets the person drag a
   crop box and rotate in 90 degree steps, and resolves to the cropped canvas (or null if cancelled).
   transparent:true keeps alpha (for signatures); otherwise a white backing is shown/used. */
(function(){
var css = '.kxcrop{border:1px solid var(--bd,#ddd);border-radius:22px;padding:18px;width:min(680px,94vw);background:var(--bg,#fff);color:var(--ink,inherit);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);box-shadow:0 30px 70px -20px rgba(0,0,0,.5)}'
+'.kxcrop::backdrop{background:rgba(4,10,24,.6)}'
+'.kxcrop-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:10px}'
+'.kxcrop-stage{display:flex;justify-content:center;padding:8px;background:repeating-conic-gradient(#e3e7ee 0% 25%,#fff 0% 50%) 0 0/20px 20px;border-radius:14px;overflow:hidden;touch-action:none}'
+'.kxcrop-frame{position:relative;max-width:100%}'
+'.kxcrop-frame canvas{display:block;max-width:100%}'
+'.kxcrop-box{position:absolute;border:2px dashed #2563eb;box-shadow:0 0 0 2000px rgba(10,15,30,.4);touch-action:none;cursor:move}'
+'.kxcrop-box i{position:absolute;width:22px;height:22px;background:#2563eb;border:2px solid #fff;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,.4);touch-action:none}'
+'.kxcrop-box i[data-h=nw]{left:-11px;top:-11px;cursor:nwse-resize}.kxcrop-box i[data-h=ne]{right:-11px;top:-11px;cursor:nesw-resize}'
+'.kxcrop-box i[data-h=sw]{left:-11px;bottom:-11px;cursor:nesw-resize}.kxcrop-box i[data-h=se]{right:-11px;bottom:-11px;cursor:nwse-resize}'
+'.kxcrop-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px}'
+'.kxcrop-hint{font-size:.8rem;color:var(--muted,#777);margin-top:8px}';
function $(h,s){return h.querySelector(s)}
function toCanvas(src){if(src&&src.tagName==='CANVAS')return src;var c=document.createElement('canvas');c.width=src.naturalWidth||src.width;c.height=src.naturalHeight||src.height;c.getContext('2d').drawImage(src,0,0);return c}
function rot90(cv,dir){var w=cv.width,h=cv.height,o=document.createElement('canvas');o.width=h;o.height=w;var x=o.getContext('2d');
 if(dir>0){x.translate(h,0);x.rotate(Math.PI/2)}else{x.translate(0,w);x.rotate(-Math.PI/2)}
 x.drawImage(cv,0,0);return o}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function open(src,opts){opts=opts||{};
 return new Promise(function(resolve){
  if(!document.getElementById('kxcrop-css')){var st=document.createElement('style');st.id='kxcrop-css';st.textContent=css;document.head.appendChild(st)}
  var cur=toCanvas(src),done=false;
  var dlg=document.createElement('dialog');dlg.className='kxcrop';
  dlg.innerHTML='<div class="kxcrop-top"><b>'+(opts.title||'Crop and straighten')+'</b><button type="button" class="btn sm ghost" data-x>Cancel</button></div>'
   +'<div class="kxcrop-stage"><div class="kxcrop-frame"><canvas class="kxcrop-cv"></canvas><div class="kxcrop-box"><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div></div></div>'
   +'<div class="kxcrop-hint">Drag the corners to cut away anything you do not want. Drag inside the box to move it.</div>'
   +'<div class="kxcrop-bar"><button type="button" class="btn sm" data-rl>&#8634; Rotate left</button><button type="button" class="btn sm" data-rr>&#8635; Rotate right</button><span style="flex:1"></span><button type="button" class="btn sm" data-reset>Reset</button><button type="button" class="btn sm pri" data-ok>Use this crop</button></div>';
  document.body.appendChild(dlg);
  var cv=$(dlg,'.kxcrop-cv'),frame=$(dlg,'.kxcrop-frame'),box=$(dlg,'.kxcrop-box');
  var rect={x:.02,y:.02,w:.96,h:.96};
  function draw(){var maxW=Math.min(620,innerWidth-70),maxH=Math.min(440,innerHeight-240),sc=Math.min(maxW/cur.width,maxH/cur.height,1),dw=Math.max(40,Math.round(cur.width*sc)),dh=Math.max(40,Math.round(cur.height*sc));
   cv.width=dw;cv.height=dh;frame.style.width=dw+'px';frame.style.height=dh+'px';var x=cv.getContext('2d');x.clearRect(0,0,dw,dh);if(!opts.transparent){x.fillStyle='#fff';x.fillRect(0,0,dw,dh)}x.drawImage(cur,0,0,dw,dh);layout()}
  function layout(){var dw=cv.width,dh=cv.height;box.style.left=(rect.x*dw)+'px';box.style.top=(rect.y*dh)+'px';box.style.width=(rect.w*dw)+'px';box.style.height=(rect.h*dh)+'px'}
  draw();
  var drag=null;
  box.addEventListener('pointerdown',function(e){var h=e.target.getAttribute&&e.target.getAttribute('data-h');drag={mode:h||'move',sx:e.clientX,sy:e.clientY,r:{x:rect.x,y:rect.y,w:rect.w,h:rect.h},dw:cv.width,dh:cv.height};try{box.setPointerCapture(e.pointerId)}catch(er){}e.preventDefault()});
  box.addEventListener('pointermove',function(e){if(!drag)return;var dx=(e.clientX-drag.sx)/drag.dw,dy=(e.clientY-drag.sy)/drag.dh,r={x:drag.r.x,y:drag.r.y,w:drag.r.w,h:drag.r.h};
   if(drag.mode==='move'){r.x=clamp(drag.r.x+dx,0,1-drag.r.w);r.y=clamp(drag.r.y+dy,0,1-drag.r.h)}
   else{if(drag.mode.indexOf('w')>-1){var nx=clamp(drag.r.x+dx,0,drag.r.x+drag.r.w-.04);r.w=drag.r.x+drag.r.w-nx;r.x=nx}
    if(drag.mode.indexOf('e')>-1){r.w=clamp(drag.r.w+dx,.04,1-drag.r.x)}
    if(drag.mode.indexOf('n')>-1){var ny=clamp(drag.r.y+dy,0,drag.r.y+drag.r.h-.04);r.h=drag.r.y+drag.r.h-ny;r.y=ny}
    if(drag.mode.indexOf('s')>-1){r.h=clamp(drag.r.h+dy,.04,1-drag.r.y)}}
   rect=r;layout()});
  function endDrag(){drag=null}box.addEventListener('pointerup',endDrag);box.addEventListener('pointercancel',endDrag);
  $(dlg,'[data-rl]').onclick=function(){cur=rot90(cur,-1);rect={x:.02,y:.02,w:.96,h:.96};draw()};
  $(dlg,'[data-rr]').onclick=function(){cur=rot90(cur,1);rect={x:.02,y:.02,w:.96,h:.96};draw()};
  $(dlg,'[data-reset]').onclick=function(){rect={x:.02,y:.02,w:.96,h:.96};layout()};
  function finish(v){if(done)return;done=true;window.removeEventListener('resize',onResize);try{dlg.close()}catch(e){}dlg.remove();resolve(v)}
  $(dlg,'[data-x]').onclick=function(){finish(null)};
  dlg.addEventListener('cancel',function(e){e.preventDefault();finish(null)});
  $(dlg,'[data-ok]').onclick=function(){var sx=Math.round(rect.x*cur.width),sy=Math.round(rect.y*cur.height),sw=Math.max(1,Math.round(rect.w*cur.width)),sh=Math.max(1,Math.round(rect.h*cur.height));
   var out=document.createElement('canvas');out.width=sw;out.height=sh;var x=out.getContext('2d');if(!opts.transparent){x.fillStyle='#fff';x.fillRect(0,0,sw,sh)}x.drawImage(cur,sx,sy,sw,sh,0,0,sw,sh);finish(out)};
  function onResize(){draw()}window.addEventListener('resize',onResize);
  try{dlg.showModal()}catch(e){dlg.setAttribute('open','')}
 })}
window.KXCROP={open:open,rot90:rot90};
})();
