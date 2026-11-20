// KINETIX service worker. Offline only for the free PDF tools; orders, payments and the admin are never cached.
const C='kinetix-v3';   // bumped: activate() deletes every other cache, so a bad copy of a tool file cannot stick around on a phone
const OK=/\/(pdf-tools|pdf-fill|signature-tool|pdf-unlock|pdf-protect)\.html$|\/(pdf-lib\.min\.js|pdf\.min\.mjs|pdf\.worker\.min\.mjs|kinetix-logo\.webp|kinetix-k\.webp|favicon\.png|icon-192\.png|manifest\.webmanifest)$/;
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=='kx-opt').map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const opt=async()=>!!(await (await caches.open('kx-opt')).match('yes'));
self.addEventListener('message',e=>{const d=e.data||{};
 if(d.consent==='yes'){e.waitUntil(caches.open('kx-opt').then(c=>c.put('yes',new Response('1'))))}
 if(d.consent==='no'){e.waitUntil(Promise.all([caches.delete('kx-opt'),caches.delete(C)]))}
 if(d.precache){const src=e.source;e.waitUntil(caches.open(C).then(async c=>{let ok=0;for(const u of d.precache){try{const r=await fetch(u,{cache:'reload'});if(r.ok){await c.put(u,r);ok++}}catch(x){}}if(src)src.postMessage({precached:ok,total:d.precache.length})}))}});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||!OK.test(u.pathname))return;
 /* The catch used to hand respondWith() whatever caches.match returned - and that is undefined
    when nothing was ever cached, which the browser treats as a hard network error. One dropped
    request for pdf.worker.min.mjs on mobile data was enough to kill the PDF tools outright.
    Now the cache only answers when it really holds the file; otherwise the original failure is
    rethrown, which is what the browser knows how to recover from. */
 e.respondWith(fetch(r).then(x=>{if(x.ok){const y=x.clone();opt().then(o=>{if(o)caches.open(C).then(c=>c.put(r,y))})}return x})
  .catch(err=>caches.match(r,{ignoreSearch:true}).then(hit=>{if(hit)return hit;throw err})))});
