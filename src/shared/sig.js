/* KXSIG: turn a photo of a signature into a transparent PNG, plus a draw pad and a UI panel. Runs fully in the browser. */
(function(){
var css='.sg{display:grid;gap:12px}.sg .tabs{display:flex;gap:8px;flex-wrap:wrap}.sg .tabs button{padding:9px 16px;border-radius:999px;border:1px solid var(--bd);background:var(--card);color:inherit;font:inherit;font-weight:650;cursor:pointer}.sg .tabs button[aria-pressed=true]{background:var(--accg,linear-gradient(135deg,#3b82f6,#22d3ee));color:#fff;border-color:transparent}'
+'.sg .cb{background-color:#fff;background-image:linear-gradient(45deg,#d9dee7 25%,transparent 25%,transparent 75%,#d9dee7 75%),linear-gradient(45deg,#d9dee7 25%,transparent 25%,transparent 75%,#d9dee7 75%);background-size:20px 20px;background-position:0 0,10px 10px;border-radius:16px;border:1px solid var(--bd);display:grid;place-items:center;min-height:150px;padding:12px;overflow:hidden}.sg .cb img,.sg .cb canvas{max-width:100%;max-height:260px;display:block}'
+'.sg .pad{touch-action:none;background:#fff;border-radius:16px;border:2px dashed var(--bd);width:100%;height:190px;cursor:crosshair;display:block}'
+'.sg .ctl{display:flex;gap:14px;flex-wrap:wrap;align-items:center}.sg .ctl label{font-size:.85rem;font-weight:650;display:flex;gap:8px;align-items:center}.sg .ctl input[type=range]{width:150px}'
+'.sg .sw{display:flex;gap:8px}.sg .sw button{width:30px;height:30px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px var(--bd);cursor:pointer}.sg .sw button[aria-pressed=true]{box-shadow:0 0 0 3px var(--acc,#3b82f6)}'
+'.sg .drop2{display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center;padding:24px 14px;border-radius:16px;border:2px dashed var(--bd);cursor:pointer;background:var(--soft,rgba(255,255,255,.04))}.sg .hint{font-size:.82rem;opacity:.75}';
function $(h,s){return h.querySelector(s)}
function loadImg(src){return new Promise(function(res,rej){var i=new Image();i.onload=function(){res(i)};i.onerror=function(){rej(new Error('Could not read that picture. Try a JPG or PNG.'))};i.src=src})}
function fileToImg(file){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){loadImg(r.result).then(res,rej)};r.onerror=function(){rej(new Error('Could not read the file.'))};r.readAsDataURL(file)})}
function otsu(h,n){var sum=0,i;for(i=0;i<256;i++)sum+=i*h[i];var sB=0,wB=0,max=-1,t=0;for(i=0;i<256;i++){wB+=h[i];if(!wB)continue;var wF=n-wB;if(!wF)break;sB+=i*h[i];var mB=sB/wB,mF=(sum-sB)/wF,v=wB*wF*(mB-mF)*(mB-mF);if(v>max){max=v;t=i}}return t/255}
function hex(c){c=c.replace('#','');return[parseInt(c.substr(0,2),16),parseInt(c.substr(2,2),16),parseInt(c.substr(4,2),16)]}
/* autoLevels: stretch each channel's histogram so the darkest/lightest ~0.5% clip to black/white. Deterministic, no AI. */
function autoLevels(img){var iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,c=document.createElement('canvas');c.width=iw;c.height=ih;var x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,iw,ih);
 var d=x.getImageData(0,0,iw,ih),p=d.data,N=iw*ih;
 ['r','g','b'].forEach(function(ch,off){var h=new Uint32Array(256),i;for(i=0;i<N;i++)h[p[i*4+off]]++;
  var lo=0,hi=255,cum=0,cut=N*.005;for(i=0;i<256;i++){cum+=h[i];if(cum>=cut){lo=i;break}}cum=0;for(i=255;i>=0;i--){cum+=h[i];if(cum>=cut){hi=i;break}}
  if(hi<=lo){return}var scale=255/(hi-lo);for(i=0;i<N;i++){var v=(p[i*4+off]-lo)*scale;p[i*4+off]=v<0?0:v>255?255:v}});
 x.putImageData(d,0,0);return c}
/* chromaKey: best-effort background removal for a roughly plain/even background. Samples the four corners,
   and makes pixels close to that colour transparent, fading near the edge of the tolerance. Not ML - will
   struggle with busy or multi-colour backgrounds. */
function chromaKey(img,o){o=o||{};var tol=o.tol==null?38:o.tol,iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,c=document.createElement('canvas');c.width=iw;c.height=ih;var x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,iw,ih);
 var d=x.getImageData(0,0,iw,ih),p=d.data,N=iw*ih;
 var pts=[[2,2],[iw-3,2],[2,ih-3],[iw-3,ih-3]],cr=0,cg=0,cb=0;pts.forEach(function(pt){var k=(pt[1]*iw+pt[0])*4;cr+=p[k];cg+=p[k+1];cb+=p[k+2]});cr/=4;cg/=4;cb/=4;
 for(var i=0;i<N;i++){var dr=p[i*4]-cr,dg=p[i*4+1]-cg,db=p[i*4+2]-cb,dist=Math.sqrt(dr*dr+dg*dg+db*db);
  if(dist<tol){var a=dist/tol;p[i*4+3]=Math.round(p[i*4+3]*(a*a))}}
 x.putImageData(d,0,0);return c}
/* extract: img (Image or Canvas) -> canvas with transparent background, cropped to the ink */
function extract(img,o){o=o||{};var sens=o.sens==null?50:o.sens,color=o.color||'#0b1b3a',maxW=o.maxW||1400;
 var iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,sc=Math.min(1,maxW/Math.max(iw,ih)),w=Math.max(1,Math.round(iw*sc)),h=Math.max(1,Math.round(ih*sc));
 var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);
 var d=x.getImageData(0,0,w,h),p=d.data,N=w*h,g=new Float32Array(N),i;
 for(i=0;i<N;i++){g[i]=.299*p[i*4]+.587*p[i*4+1]+.114*p[i*4+2]}
 /* paper brightness estimate: block max, then dilate and blur on a coarse grid */
 var B=Math.max(4,Math.round(Math.max(w,h)/150)),gw=Math.ceil(w/B),gh=Math.ceil(h/B),bg=new Float32Array(gw*gh),gx,gy,xx,yy;
 for(gy=0;gy<gh;gy++)for(gx=0;gx<gw;gx++){var m=0;for(yy=gy*B;yy<Math.min(h,gy*B+B);yy++)for(xx=gx*B;xx<Math.min(w,gx*B+B);xx++){var v=g[yy*w+xx];if(v>m)m=v}bg[gy*gw+gx]=m}
 function sep(src,r,mode){var tmp=new Float32Array(src.length),out=new Float32Array(src.length),k,a,s,n;
  for(gy=0;gy<gh;gy++)for(gx=0;gx<gw;gx++){s=mode?0:0;n=0;a=0;for(k=-r;k<=r;k++){var q=Math.min(gw-1,Math.max(0,gx+k)),val=src[gy*gw+q];if(mode){a+=val;n++}else if(val>a)a=val}tmp[gy*gw+gx]=mode?a/n:a}
  for(gy=0;gy<gh;gy++)for(gx=0;gx<gw;gx++){n=0;a=0;for(k=-r;k<=r;k++){var q2=Math.min(gh-1,Math.max(0,gy+k)),val2=tmp[q2*gw+gx];if(mode){a+=val2;n++}else if(val2>a)a=val2}out[gy*gw+gx]=mode?a/n:a}
  return out}
 bg=sep(bg,3,0);bg=sep(bg,2,1);
 function bgAt(px,py){var fx=Math.min(gw-1,Math.max(0,px/B-.5)),fy=Math.min(gh-1,Math.max(0,py/B-.5)),x0=Math.floor(fx),y0=Math.floor(fy),x1=Math.min(gw-1,x0+1),y1=Math.min(gh-1,y0+1),tx=fx-x0,ty=fy-y0;
  return (bg[y0*gw+x0]*(1-tx)+bg[y0*gw+x1]*tx)*(1-ty)+(bg[y1*gw+x0]*(1-tx)+bg[y1*gw+x1]*tx)*ty}
 var ink=new Float32Array(N),hist=new Uint32Array(256);
 for(var py=0;py<h;py++)for(var px=0;px<w;px++){var k2=py*w+px,b=Math.max(40,bgAt(px,py)),r=Math.min(1,g[k2]/b),v2=1-r;ink[k2]=v2;hist[Math.min(255,Math.round(v2*255))]++}
 var t=Math.min(.6,Math.max(.12,otsu(hist,N))),cc=t*(1.5-sens/100),ww=Math.max(.03,cc*.45),lo=Math.max(.05,cc-ww),hi=cc+ww;
 var alpha=new Float32Array(N);
 for(i=0;i<N;i++){var u=(ink[i]-lo)/(hi-lo);u=u<0?0:u>1?1:u;alpha[i]=u*u*(3-2*u)}
 /* drop tiny specks (paper dust) */
 var lab=new Int32Array(N),stack=[],minA=Math.max(10,Math.round(N*.00004)),bgw=null;
 for(i=0;i<N;i++){if(alpha[i]<.5||lab[i])continue;var comp=[i];lab[i]=1;stack=[i];while(stack.length){var cur=stack.pop(),cx=cur%w,cy=(cur/w)|0;for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;var nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;var nk=ny*w+nx;if(!lab[nk]&&alpha[nk]>=.5){lab[nk]=1;stack.push(nk);comp.push(nk)}}}
  if(comp.length<minA){for(var z=0;z<comp.length;z++){var kk=comp[z];for(var ddy=-1;ddy<=1;ddy++)for(var ddx=-1;ddx<=1;ddx++){var qx=kk%w+ddx,qy=((kk/w)|0)+ddy;if(qx>=0&&qy>=0&&qx<w&&qy<h)alpha[qy*w+qx]=0}}}}
 var rgb=color==='original'?null:hex(color),minX=w,minY=h,maxX=0,maxY=0;
 for(var yy2=0;yy2<h;yy2++)for(var xx2=0;xx2<w;xx2++){var kk2=yy2*w+xx2,a=alpha[kk2];
  if(rgb){p[kk2*4]=rgb[0];p[kk2*4+1]=rgb[1];p[kk2*4+2]=rgb[2]}else{var bb=Math.max(40,bgAt(xx2,yy2)),f=255/bb;p[kk2*4]=Math.min(255,p[kk2*4]*f*.75);p[kk2*4+1]=Math.min(255,p[kk2*4+1]*f*.75);p[kk2*4+2]=Math.min(255,p[kk2*4+2]*f*.75)}
  p[kk2*4+3]=Math.round(a*255);if(a>.2){if(xx2<minX)minX=xx2;if(xx2>maxX)maxX=xx2;if(yy2<minY)minY=yy2;if(yy2>maxY)maxY=yy2}}
 if(maxX<=minX||maxY<=minY)return null;
 x.putImageData(d,0,0);var pad=Math.round(Math.max(maxX-minX,maxY-minY)*.04)+2;minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(w-1,maxX+pad);maxY=Math.min(h-1,maxY+pad);
 var o2=document.createElement('canvas');o2.width=maxX-minX+1;o2.height=maxY-minY+1;o2.getContext('2d').drawImage(c,minX,minY,o2.width,o2.height,0,0,o2.width,o2.height);return o2}
function trim(cv){var w=cv.width,h=cv.height,d=cv.getContext('2d').getImageData(0,0,w,h).data,a=w,b=h,c=0,e=0;for(var y=0;y<h;y++)for(var x=0;x<w;x++)if(d[(y*w+x)*4+3]>10){if(x<a)a=x;if(x>c)c=x;if(y<b)b=y;if(y>e)e=y}
 if(c<=a)return null;var p=6;a=Math.max(0,a-p);b=Math.max(0,b-p);c=Math.min(w-1,c+p);e=Math.min(h-1,e+p);var o=document.createElement('canvas');o.width=c-a+1;o.height=e-b+1;o.getContext('2d').drawImage(cv,a,b,o.width,o.height,0,0,o.width,o.height);return o}
/* UI panel: tabs Photo / Draw. opt.onChange(dataUrl|null) */
function panel(host,opt){opt=opt||{};if(!document.getElementById('sg-css')){var st=document.createElement('style');st.id='sg-css';st.textContent=css;document.head.appendChild(st)}
 var state={color:'#0b1b3a',sens:50,img:null,url:null,tab:'photo',canvasDrawn:false};
 host.classList.add('sg');
 host.innerHTML='<div class="tabs"><button type="button" data-t="photo" aria-pressed="true">Photo of my signature</button><button type="button" data-t="draw" aria-pressed="false">Draw it</button></div>'
 +'<div data-p="photo"><label class="drop2" for="sgf"><b>Take or choose a photo</b><span class="hint">Sign on plain white paper in good light, then photograph just the signature. We remove the paper and keep the ink.</span></label><input id="sgf" type="file" accept="image/*" style="position:absolute;left:-9999px"></div>'
 +'<div data-p="draw" hidden><canvas class="pad" id="sgpad"></canvas><div class="hint">Draw with your finger or mouse.</div></div>'
 +'<div class="ctl" id="sgctl" hidden><label data-for="photo">Sensitivity <input type="range" min="0" max="100" value="50" id="sgs"></label><span class="sw" id="sgsw" aria-label="Ink colour"></span><button type="button" class="btn sm" id="sgcrop">Crop</button><button type="button" class="btn sm" id="sgclr">Clear</button></div>'
 +'<div class="cb" id="sgprev" hidden></div><div class="hint" id="sgmsg"></div>';
 var pad=$(host,'#sgpad'),pc=pad.getContext('2d'),drawing=false,last=null;
 [['#0b1b3a','Navy'],['#111111','Black'],['#1d3fbf','Blue'],['original','Original']].forEach(function(c){var b=document.createElement('button');b.type='button';b.title=c[1];b.setAttribute('aria-label',c[1]);b.setAttribute('aria-pressed',c[0]===state.color);b.dataset.ink=c[0];b.style.background=c[0]==='original'?'linear-gradient(135deg,#222,#2563eb)':c[0];$(host,'#sgsw').appendChild(b)});
 function emit(u){state.url=u;if(opt.onChange)opt.onChange(u)}
 function show(cv){state.outCv=cv||null;var pv=$(host,'#sgprev');if(!cv){pv.hidden=true;emit(null);return}pv.hidden=false;var url=cv.toDataURL('image/png');pv.innerHTML='<img alt="Your transparent signature" src="'+url+'">';emit(url)}
 function run(){if(!state.img)return;var cv=extract(state.img,{sens:state.sens,color:state.color});if(!cv){$(host,'#sgmsg').textContent='We could not find a signature in that picture. Use plain white paper, dark ink and good light, or raise the sensitivity.';show(null);return}$(host,'#sgmsg').textContent='Done. The background is now transparent.';show(cv)}
 function setTab(t){state.tab=t;host.querySelectorAll('.tabs button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.t===t)});host.querySelectorAll('[data-p]').forEach(function(e){e.hidden=e.dataset.p!==t});$(host,'#sgctl').hidden=false;host.querySelectorAll('[data-for=photo]').forEach(function(e){e.style.display=t==='photo'?'':'none'});
  if(t==='draw')sizePad();if(t==='photo'){if(state.img)run();else{$(host,'#sgprev').hidden=true;emit(null)}}else{drawOut()}}
 function sizePad(){var r=pad.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);if(!r.width)return;if(pad.width!==Math.round(r.width*dpr)){var keep=state.canvasDrawn?pad.toDataURL():null;pad.width=Math.round(r.width*dpr);pad.height=Math.round(r.height*dpr);pc.lineCap='round';pc.lineJoin='round';if(keep)loadImg(keep).then(function(i){pc.drawImage(i,0,0,pad.width,pad.height)})}}
 function pos(e){var r=pad.getBoundingClientRect();return{x:(e.clientX-r.left)*pad.width/r.width,y:(e.clientY-r.top)*pad.height/r.height}}
 function ink(){return state.color==='original'?'#111111':state.color}
 pad.addEventListener('pointerdown',function(e){e.preventDefault();sizePad();drawing=true;last=pos(e);pad.setPointerCapture(e.pointerId);pc.strokeStyle=ink();pc.fillStyle=ink();pc.lineWidth=Math.max(2.5,pad.width/260);pc.beginPath();pc.arc(last.x,last.y,pc.lineWidth/2,0,6.3);pc.fill();state.canvasDrawn=true});
 pad.addEventListener('pointermove',function(e){if(!drawing)return;var p=pos(e),m={x:(last.x+p.x)/2,y:(last.y+p.y)/2};pc.strokeStyle=ink();pc.beginPath();pc.moveTo(last.x,last.y);pc.quadraticCurveTo(last.x,last.y,m.x,m.y);pc.lineTo(p.x,p.y);pc.stroke();last=p});
 function end(){if(!drawing)return;drawing=false;drawOut()}pad.addEventListener('pointerup',end);pad.addEventListener('pointercancel',end);
 function drawOut(){if(state.tab!=='draw')return;if(!state.canvasDrawn){state.outCv=null;emit(null);$(host,'#sgprev').hidden=true;return}var t=trim(pad);if(t){state.outCv=t;var u=t.toDataURL('image/png');$(host,'#sgprev').hidden=false;$(host,'#sgprev').innerHTML='<img alt="Your drawn signature" src="'+u+'">';emit(u)}}
 $(host,'#sgclr').onclick=function(){if(state.tab==='draw'){pc.clearRect(0,0,pad.width,pad.height);state.canvasDrawn=false;drawOut()}else{state.img=null;$(host,'#sgf').value='';show(null);$(host,'#sgmsg').textContent=''}};
 $(host,'#sgcrop').onclick=function(){if(!state.outCv||!window.KXCROP){$(host,'#sgmsg').textContent='Make a signature first, then crop it.';return}
  KXCROP.open(state.outCv,{transparent:true,title:'Crop your signature'}).then(function(cv){if(!cv)return;show(cv);$(host,'#sgmsg').textContent='Cropped. Changing the sensitivity or colour afterwards will redo the automatic cut, so crop last.'})};
 host.querySelector('.tabs').addEventListener('click',function(e){var b=e.target.closest('button[data-t]');if(b)setTab(b.dataset.t)});
 $(host,'#sgsw').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;state.color=b.dataset.ink;$(host,'#sgsw').querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x===b)});if(state.tab==='photo')run()});
 var tm;$(host,'#sgs').addEventListener('input',function(e){state.sens=+e.target.value;clearTimeout(tm);tm=setTimeout(run,60)});
 $(host,'#sgf').addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;$(host,'#sgmsg').textContent='Working on it...';$(host,'#sgctl').hidden=false;fileToImg(f).then(function(i){state.img=i;setTimeout(run,20)}).catch(function(er){$(host,'#sgmsg').textContent=er.message})});
 $(host,'#sgctl').hidden=true;
 $(host,'.drop2').addEventListener('click',function(){$(host,'#sgctl').hidden=false});
 return{getUrl:function(){return state.url},reset:function(){state.img=null;state.canvasDrawn=false;state.outCv=null;$(host,'#sgprev').hidden=true;$(host,'#sgmsg').textContent='';emit(null)}}}
window.KXSIG={extract:extract,trim:trim,panel:panel,loadImg:loadImg,fileToImg:fileToImg,autoLevels:autoLevels,chromaKey:chromaKey};
})();
