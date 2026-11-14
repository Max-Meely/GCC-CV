// KINETIX service worker. Offline only for the free PDF tools; orders, payments and the admin are never cached.
const C='kinetix-v2';
const OK=/\/(pdf-tools|pdf-fill|signature-tool|pdf-unlock)\.html$|\/(pdf-lib\.min\.js|pdf\.min\.mjs|pdf\.worker\.min\.mjs|kinetix-logo\.png|kinetix-k\.png|favicon\.png|icon-192\.png|manifest\.webmanifest)$/;
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=='kx-opt').map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const opt=async()=>!!(await (await caches.open('kx-opt')).match('yes'));
self.addEventListener('message',e=>{const d=e.data||{};
 if(d.consent==='yes'){e.waitUntil(caches.open('kx-opt').then(c=>c.put('yes',new Response('1'))))}
 if(d.consent==='no'){e.waitUntil(Promise.all([caches.delete('kx-opt'),caches.delete(C)]))}
 if(d.precache){const src=e.source;e.waitUntil(caches.open(C).then(async c=>{let ok=0;for(const u of d.precache){try{const r=await fetch(u,{cache:'reload'});if(r.ok){await c.put(u,r);ok++}}catch(x){}}if(src)src.postMessage({precached:ok,total:d.precache.length})}))}});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||!OK.test(u.pathname))return;
 e.respondWith(fetch(r).then(x=>{if(x.ok){const y=x.clone();opt().then(o=>{if(o)caches.open(C).then(c=>c.put(r,y))})}return x}).catch(()=>caches.match(r,{ignoreSearch:true})))});
