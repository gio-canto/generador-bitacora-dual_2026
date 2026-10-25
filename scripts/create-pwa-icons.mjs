import {mkdir,readFile,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {join,resolve} from "node:path";
import {createCanvas,loadImage} from "@napi-rs/canvas";

// Derive installable PWA icons from the official Dual artwork committed in Assets.
// Always preserve the original image; generated sizes are build artifacts.
export const ASSET_DIR=fileURLToPath(new URL("../public/Assets/",import.meta.url));
export const PWA_SIZES=[
  ["registro-dual-icon-192.png",192,"any"],
  ["registro-dual-icon-512.png",512,"any"],
  ["registro-dual-maskable-512.png",512,"maskable"],
  ["registro-dual-apple-180.png",180,"apple"],
  ["registro-dual-favicon-32.png",32,"favicon"],
];

export async function generatePwaIcons(dir=ASSET_DIR){
  const original=await readFile(new URL("../public/Assets/registro-dual-icon-original.png",import.meta.url));
  const logo=await loadImage(original);
  if(logo.width!==logo.height||logo.width<512){
    throw new Error("El logotipo original del PWA debe ser cuadrado y medir al menos 512 píxeles.");
  }
  await mkdir(dir,{recursive:true});
  for(const [filename,size,purpose] of PWA_SIZES){
    const canvas=createCanvas(size,size);
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="#FFFFFF";
    ctx.fillRect(0,0,size,size);
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality="high";
    // Android may crop maskable icons to a circle: keep the entire Dual
    // symbol within the guaranteed inner safe zone, not just the square.
    const fraction=purpose==="maskable"?0.70:1;
    const side=size*fraction;
    const offset=(size-side)/2;
    ctx.drawImage(logo,offset,offset,side,side);
    await writeFile(join(dir,filename),canvas.toBuffer("image/png"));
  }
  return PWA_SIZES.map(([filename])=>filename);
}

if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  generatePwaIcons().then(files=>console.log("PWA Dual: "+files.join(", ")))
    .catch(err=>{console.error(err);process.exitCode=1;});
}
