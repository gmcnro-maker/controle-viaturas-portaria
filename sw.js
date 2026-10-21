const CACHE='dpl-static-v3';
const ASSETS=['ce-p4-viatura-192.png','ce-p4-viatura-512.png','brasao-pmro-transparente.png','brasao-centro-ensino-transparente.png'].map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dpl-static-')&&k!==CACHE).map(k=>caches.delete(k)))));});
// Não guarda respostas autenticadas, fotografias, tokens, HTML ou código da aplicação.
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'&&url.href.startsWith(self.registration.scope)){
  event.respondWith(fetch(request).catch(()=>new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0e2d50"><title>CE-P4 · Sem conexão</title><body style="margin:0;background:#f4f7fc;color:#0e2d50;font:20px system-ui;padding:32px"><h1>Sem conexão</h1><p>Conecte-se à internet para entrar e consultar suas missões.</p><p>Solicitações e fotos precisam ser enviadas com conexão.</p><button onclick="location.reload()" style="font:inherit;background:#1263d6;color:white;border:0;border-radius:12px;padding:16px 22px">Tentar novamente</button></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}})));return;
 }
 if(ASSETS.includes(url.href))event.respondWith(caches.open(CACHE).then(async cache=>{const saved=await cache.match(request);if(saved)return saved;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;}));
});
