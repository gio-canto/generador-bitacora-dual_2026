import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const files = await readdir("dist/assets");
const core = [
  "./",
  "./index.html",
  "./Assets/Edu.png",
  "./faq/",
  "./faq/index.html",
  ...files.map((f) => "./assets/" + f),
];
const hash = createHash("sha256");
for (const f of ["dist/index.html", ...files.map((f) => "dist/assets/" + f)])
  hash.update(await readFile(f));
const cache = "bitacora-dual-" + hash.digest("hex").slice(0, 12);
await writeFile(
  "dist/sw.js",
  `const CACHE=${JSON.stringify(cache)},CORE=${JSON.stringify(core)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('bitacora-dual-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
const relative='./'+url.pathname.slice(new URL(self.registration.scope).pathname.length);
if(!CORE.includes(relative))return;
e.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(e.request);if(cached)return cached;const response=await fetch(e.request);if(response.ok)await cache.put(e.request,response.clone());return response;}));});
`,
);
