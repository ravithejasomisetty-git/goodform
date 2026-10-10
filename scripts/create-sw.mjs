import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const assets=fs.readdirSync('dist/assets').map(name=>'/assets/'+name);
const version=Date.now();
fs.writeFileSync('dist/sw.js',`
const CACHE='goodform-${version}';
const ASSETS=${JSON.stringify(['/', '/index.html','/app-icon.svg','/bodybuilding-pose.png','/manifest.webmanifest',...assets])};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('goodform-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin) return;
  event.respondWith(caches.match(event.request,{ignoreVary:true}).then(cached=>cached||fetch(event.request).catch(()=>event.request.mode==='navigate'?caches.match('/index.html'):Response.error())));
});
`);
execFileSync(process.execPath,['--check','dist/sw.js'],{stdio:'inherit'});


