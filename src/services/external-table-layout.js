/**
 * Detección de cuadrículas en coordenadas de imagen (px), no puntos PDF.
 * Para tablas impresas de 4 jornadas; si la geometría es ambigua se devuelve null.
 */
const between=(n,low,high)=>n>=low&&n<=high;
const dark=(data,width,height,x,y)=>{
  const px=Math.round(x),py=Math.round(y);
  if(px<0||py<0||px>=width||py>=height)return false;
  const i=(py*width+px)*4;
  return (data[i]*.299+data[i+1]*.587+data[i+2]*.114)<135 && data[i+3]>100;
};
function cluster(points,distance){
 const groups=[];
 for(const point of points){
   if(!groups.length||point-groups[groups.length-1].at(-1)>distance)groups.push([]);
   groups.at(-1).push(point);
 }
 return groups.map(group=>Math.round(group.reduce((a,b)=>a+b,0)/group.length));
}
function verticalLines(data,w,h){
 const found=[];
 for(let x=Math.ceil(w*.04);x<Math.floor(w*.96);x+=2){
   let seen=0,checked=0;
   for(let y=Math.ceil(h*.27);y<Math.floor(h*.8);y+=5){
     checked++;
     if(dark(data,w,h,x-2,y)||dark(data,w,h,x,y)||dark(data,w,h,x+2,y))seen++;
   }
   if(seen/checked>.46)found.push(x);
 }
 return cluster(found,12);
}
function horizontalLines(data,w,h,left,right){
 const found=[],start=Math.ceil(h*.27),end=Math.floor(h*.81);
 const begin=Math.round(left+Math.min(15,(right-left)*.12));
 const finish=Math.round(right-Math.min(15,(right-left)*.12));
 for(let y=start;y<end;y++){
   let darkPixels=0,checked=0;
   for(let x=begin;x<finish;x+=3){
     checked++;
     if(dark(data,w,h,x,y))darkPixels++;
   }
   if(checked&&darkPixels/checked>.49)found.push(y);
 }
 return cluster(found,8);
}
function tableCandidate(xs,w){
 if(xs.length<5)return null;
 let best=null,grade=Infinity;
 for(let i=0;i+4<xs.length;i++){
   const x=xs.slice(i,i+5),whole=x[4]-x[0];
   if(whole<w*.53||whole>w*.96)continue;
   const ratios=[(x[1]-x[0])/whole,(x[2]-x[1])/whole,
     (x[3]-x[2])/whole,(x[4]-x[3])/whole];
   const target=[.10,.58,.14,.18];
   if(!between(ratios[0],.055,.25)||!between(ratios[1],.37,.72)||
     !between(ratios[2],.07,.27)||!between(ratios[3],.07,.32))continue;
   const distance=ratios.reduce((total,value,k)=>total+Math.abs(value-target[k]),0);
   if(distance<grade){best=x;grade=distance;}
 }
 return best;
}
export function detectFourDayTable(canvas){
 if(!canvas?.width||!canvas?.height||canvas.width<500||canvas.height<400)return null;
 let image;
 try{image=canvas.getContext("2d",{willReadFrequently:true})?.getImageData(0,0,canvas.width,canvas.height);}
 catch{return null;}
 if(!image?.data)return null;
 const {width:w,height:h}=canvas,data=image.data;
 const columns=tableCandidate(verticalLines(data,w,h),w);
 if(!columns)return null;
 const datePeaks=horizontalLines(data,w,h,columns[0],columns[1]);
 if(datePeaks.length<6||datePeaks.length>10)return null;
 const rows=datePeaks.slice(-5);
 if(rows.some((row,i)=>i>0&&!between(row-rows[i-1],h*.033,h*.25)))return null;
 // Las líneas de las fotos pueden inclinarse ligeramente: calibrar por columna.
 const hourPeaks=horizontalLines(data,w,h,columns[2],columns[3]);
 const base=rows[0],inRange=hourPeaks.filter(y=>Math.abs(y-base)<45);
 const reference=inRange.sort((a,b)=>Math.abs(a-base-12)-Math.abs(b-base-12))[0];
 const dateCenter=(columns[0]+columns[1])/2;
 const hourCenter=(columns[2]+columns[3])/2;
 const slope=reference===undefined?0:Math.max(-.035,Math.min(.035,(reference-base)/(hourCenter-dateCenter)));
 return {columns,rows,slope,width:w,height:h,confidence:"detected-grid"};
}
export function tableCellRect(grid,column,row){
 if(!grid||!Number.isInteger(column)||!between(column,0,3)||!Number.isInteger(row)||!between(row,0,3))return null;
 const {columns,rows,slope,width,height}=grid;
 const left=Math.ceil(columns[column]+7),right=Math.floor(columns[column+1]-7);
 const reference=(columns[0]+columns[1])/2;
 const shift=slope*((left+right)/2-reference);
 const top=Math.ceil(rows[row]+shift+6),bottom=Math.floor(rows[row+1]+shift-6);
 if(left<0||right>width||top<0||bottom>height||right-left<16||bottom-top<12)return null;
 return {left,top,width:right-left,height:bottom-top};
}
function collectWords(value,out){
 if(!value||typeof value!=="object")return;
 if(Array.isArray(value)){value.forEach(v=>collectWords(v,out));return;}
 const children=["blocks","paragraphs","lines","words"].filter(name=>Array.isArray(value[name]));
 if(children.length){children.forEach(name=>collectWords(value[name],out));return;}
 const box=value.bbox;
 if(box&&typeof value.text==="string"&&value.text.trim()&&
   [box.x0,box.x1,box.y0,box.y1].every(Number.isFinite))
   out.push({text:value.text.trim(),x:(box.x0+box.x1)/2,y:(box.y0+box.y1)/2});
}
export function textFromTableCell(blocks,grid,column,row){
 const rect=tableCellRect(grid,column,row);
 if(!rect)return "";
 const words=[];collectWords(blocks,words);
 const sorted=words.filter(w=>between(w.x,rect.left-4,rect.left+rect.width+4)&&
   between(w.y,rect.top-3,rect.top+rect.height+3))
   .sort((a,b)=>a.y-b.y||a.x-b.x);
 const groups=[];
 for(const word of sorted){
   let current=groups.at(-1);
   if(!current||Math.abs(word.y-current.base)>Math.max(9,grid.height*.009)){
     current={base:word.y,words:[]};groups.push(current);
   }
   current.words.push(word);
 }
 return groups.map(g=>g.words.sort((a,b)=>a.x-b.x).map(w=>w.text).join(" ")).join("\n");
}
export function makeExternalTableTranscript({name="",company="",weekLabel="",rows=[]}){
 const lines=[];
 if(name)lines.push("Nombre del alumno: "+name);
 if(company)lines.push("Empresa: "+company);
 if(weekLabel)lines.push(weekLabel);
 for(const row of rows){
   if(!row.date)continue;
   lines.push(row.date);
   if(row.time)lines.push(row.time);
   if(row.activity)lines.push("Actividades: "+row.activity.replace(/\s+/g," ").trim());
   if(row.area)lines.push("Área: "+row.area.replace(/\s+/g," ").trim());
 }
 return lines.join("\n");
}
