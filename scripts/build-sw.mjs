import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const files = await readdir("dist/assets");
const staticPages = ["faq", "privacy", "cookies", "terms", "accessibility", "acknowledgements", "presentacion", "registro-entrega", "debug"];
const pagePaths = staticPages.flatMap((page) => [
  `./${page}/`,
  `./${page}/index.html`,
]);
const core = [
  "./",
  "./index.html",
  "./Assets/Edu.png",
  "./Assets/asset_chime.mp3",
  "./Assets/asset_landing.png",
  "./Assets/Asset_cont_matrix.png",
  "./licenses/nspell.txt",
  "./licenses/dictionary-es.txt",
  ...pagePaths,
  ...files
    .filter((f) => !f.startsWith("sileo-host-") && !f.startsWith("spell-worker-"))
    .map((f) => "./assets/" + f),
];
const hash = createHash("sha256");
for (const f of [
  "dist/index.html",
  "dist/Assets/asset_chime.mp3",
  "dist/Assets/asset_landing.png",
  "dist/Assets/Asset_cont_matrix.png",
  ...staticPages.map((page) => `dist/${page}/index.html`),
  "dist/licenses/nspell.txt",
  "dist/licenses/dictionary-es.txt",
  ...files.map((f) => "dist/assets/" + f),
])
  hash.update(await readFile(f));
hash.update("atomic-html-v3");
const pages = {
  "./": await readFile("dist/index.html", "utf8"),
  "./index.html": await readFile("dist/index.html", "utf8"),
};
for (const page of staticPages) {
  const html = await readFile(`dist/${page}/index.html`, "utf8");
  pages[`./${page}/`] = html;
  pages[`./${page}/index.html`] = html;
}
const cache = "bitacora-dual-" + hash.digest("hex").slice(0, 12);
await writeFile(
  "dist/sw.js",
  `const CACHE=${JSON.stringify(cache)},CORE=${JSON.stringify(core)},PAGES=${JSON.stringify(pages)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async c=>{
// HTML comes from this exact build, never from a stale CDN navigation response.
for(const path of CORE){const url=new URL(path,self.registration.scope);if(PAGES[path])await c.put(url,new Response(PAGES[path],{headers:{'Content-Type':'text/html; charset=utf-8'}}));else{const response=await fetch(new Request(url,{cache:'reload'}));if(!response.ok)throw new Error('Incomplete offline build');await c.put(url,response)}}
})));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
const relative='./'+url.pathname.slice(new URL(self.registration.scope).pathname.length);
const optional=relative.startsWith('./assets/spell-worker-');
if(!CORE.includes(relative)&&!optional)return;
e.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(e.request,{ignoreSearch:true});if(cached)return cached;const response=await fetch(e.request);if(response.ok)await cache.put(e.request,response.clone());return response;}));});
`,
);
