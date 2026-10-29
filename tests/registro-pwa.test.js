import {describe,it,expect} from "vitest";
import {readFile,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {generatePwaIcons,PWA_SIZES} from "../scripts/create-pwa-icons.mjs";

const manifestUrl=join(process.cwd(),"public","registro-entrega","manifest.webmanifest");
const registryHtmlUrl=join(process.cwd(),"registro-entrega","index.html");
const rootHtmlUrl=join(process.cwd(),"index.html");
const swBuilderUrl=join(process.cwd(),"scripts","build-sw.mjs");

describe("PWA independiente de Registro Dual",()=>{
  it("inicia directamente en Registro y anuncia iconos Android normales y maskable",async()=>{
    const manifest=JSON.parse(await readFile(manifestUrl,"utf8"));
    expect(manifest).toMatchObject({
      short_name:"Registro Dual",id:"./",start_url:"./",scope:"./",display:"standalone",
    });
    expect(manifest.icons.map(i=>i.sizes)).toContain("192x192");
    expect(manifest.icons.map(i=>i.sizes)).toContain("512x512");
    expect(manifest.icons.some(i=>i.purpose==="maskable"&&i.sizes==="512x512")).toBe(true);
    for(const icon of manifest.icons){
      expect(icon.src).toMatch(/^\.\.\/Assets\/registro-dual-/);
    }
  });
  it("mantiene independientes los manifest e iconos Apple de Registro y Generador",async()=>{
    const html=await readFile(registryHtmlUrl,"utf8");
    const main=await readFile(rootHtmlUrl,"utf8");
    expect(html).toContain('href="./manifest.webmanifest"');
    expect(html).toContain("registro-dual-apple-180.png");
    expect(html).toContain("registro-dual-favicon-32.png");
    expect(main).not.toContain("registro-dual-apple-180.png");
    expect(main).toContain('href="./manifest.webmanifest"');
    expect(main).toContain("generador-dual-apple-180.png");
    expect(main).not.toContain("registro-dual-apple-180.png");
    const script=await readFile(swBuilderUrl,"utf8");
    expect(script).toContain("./registro-entrega/manifest.webmanifest");
    expect(script).toContain("./Assets/registro-dual-maskable-512.png");
  });
  it("crea PNG con las medidas exactas a partir del archivo original",async()=>{
    const folder=await mkdtemp(join(tmpdir(),"dual-pwa-icons-"));
    try{
      const names=await generatePwaIcons(folder);
      expect(names).toHaveLength(PWA_SIZES.length);
      for(const [name,size] of PWA_SIZES){
        const buffer=await readFile(join(folder,name));
        expect(buffer.subarray(1,4).toString()).toBe("PNG");
        expect(buffer.readUInt32BE(16)).toBe(size);
        expect(buffer.readUInt32BE(20)).toBe(size);
        expect(buffer.length).toBeGreaterThan(600);
      }
    } finally {await rm(folder,{recursive:true,force:true});}
  });
});
