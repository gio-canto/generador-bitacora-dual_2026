import {afterEach,describe,expect,it} from "vitest";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {JSDOM} from "jsdom";

const read=path=>readFile(join(process.cwd(),path),"utf8");
let page=null;
afterEach(()=>{page?.window.close();page=null;});

function startHtml(html){
  const timers=[];
  page=new JSDOM(html,{
    url:"https://gio-canto.github.io/generador-bitacora-dual_2026/registro-entrega/",
    runScripts:"dangerously",
    beforeParse(window){
      window.setTimeout=(fn,delay)=>{
        const id=timers.length+1;
        timers.push({id,fn,delay,cancelled:false});
        return id;
      };
      window.clearTimeout=id=>{
        const timer=timers.find(value=>value.id===id);
        if(timer)timer.cancelled=true;
      };
    },
  });
  return {document:page.window.document,boot:page.window.__dualBoot,timers};
}

describe("Registro Dual: splash móvil instantáneo y caché offline",()=>{
  it("muestra el icono oficial y mensajes legibles sin dependencias externas ni React",async()=>{
    const html=await read("registro-entrega/index.html");
    const {document,boot}=startHtml(html);
    const screen=document.querySelector("#dual-boot-screen");
    expect(screen).toBeTruthy();
    expect(screen.dataset.phase).toBe("loading");
    expect(screen.querySelector("img").getAttribute("src")).toBe("../Assets/registro-dual-icon-192.png");
    expect(screen.querySelector(".dual-boot-title").textContent).toBe("Registro Dual");
    expect(screen.querySelector(".dual-boot-caption").textContent).toContain("Preparando");
    expect(typeof boot.ready).toBe("function");
    expect(html).toContain("@media(max-width:760px)");
    expect(html).toContain("prefers-reduced-motion:reduce");
    expect(html).toContain('type="module" src="../src/main.jsx"');
    expect(html).not.toMatch(/<script[^>]+src="https?:\/\//i);
  });
  it("retira el splash al terminar de montar la app, sin un tiempo mínimo falso",async()=>{
    const {document,boot,timers}=startHtml(await read("registro-entrega/index.html"));
    const screen=document.querySelector("#dual-boot-screen");
    boot.ready();
    expect(screen.dataset.phase).toBe("done");
    expect(timers.find(value=>value.delay===14000).cancelled).toBe(true);
    timers.find(value=>value.delay===500).fn();
    expect(document.querySelector("#dual-boot-screen")).toBeNull();
    boot.ready(); // idempotencia, sin manipular la interfaz ya montada
  });
  it("si la app tarda, ofrece recuperación y se cierra si React termina después",async()=>{
    const {document,boot,timers}=startHtml(await read("registro-entrega/index.html"));
    const watchdog=timers.find(value=>value.delay===14000);
    expect(watchdog).toBeTruthy();
    watchdog.fn();
    expect(document.querySelector("#dual-boot-screen").dataset.phase).toBe("issue");
    expect(document.querySelector("#dual-boot-retry").textContent).toBe("Reintentar");
    expect(document.querySelector("#dual-boot-recovery").textContent).toContain("Tus registros guardados");
    boot.ready();
    expect(document.querySelector("#dual-boot-screen").dataset.phase).toBe("done");
  });
  it("precarga el HTML, el icono y los chunks en la misma versión atómica",async()=>{
    const [sw,manifest,app,main]=await Promise.all([
      read("scripts/build-sw.mjs"),read("public/registro-entrega/manifest.webmanifest"),
      read("src/App.jsx"),read("src/main.jsx"),
    ]);
    expect(sw).toContain("...pagePaths");
    expect(sw).toContain("...files");
    expect(sw).toContain("./registro-entrega/manifest.webmanifest");
    expect(sw).toContain("./Assets/registro-dual-icon-192.png");
    expect(sw).toContain("PAGES[path]");
    expect(sw).toContain("old.slice(0,-1)");
    expect(app).toContain("window.__dualBoot?.ready?.()");
    expect(main).toContain("componentDidCatch()");
    expect(JSON.parse(manifest).background_color).toBe("#f5f6f9");
  });
  it("carga herramientas de Excel o escáner solo si se necesitan",async()=>{
    const content=await read("src/components/DeliveryRegistry.jsx");
    expect(content).toContain("async function ensureXlsx()");
    expect(content).toContain("const XLSX = await ensureXlsx()");
    expect(content).toContain("async function ensureZxingBrowser()");
    expect(content).toContain("XLSX_SOURCES");
  });
});
