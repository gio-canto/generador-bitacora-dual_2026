/**
 * Extracción conservadora de campos de bitácoras externas.
 * No inventa jornadas ni fechas. El responsable valida todo antes de registrar.
 */
const DAYS=["martes","miercoles","jueves","viernes"];
const MONTHS={enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12};
export const EXTERNAL_MAX_FILES=12;
export const EXTERNAL_TEXT_LIMIT=20000;
export const externalClean=value=>String(value??"").replace(/\r/g,"").replace(/[ \t\u00a0]+/g," ").trim();
export const externalKey=value=>externalClean(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
function iso(y,m,d){
 const result=new Date(Date.UTC(+y,+m-1,+d));
 return +y>=2000&&+y<=2100&&result.getUTCFullYear()===+y&&result.getUTCMonth()+1===+m&&result.getUTCDate()===+d
   ?result.toISOString().slice(0,10):"";
}
export function dateFromExternal(value){
 const raw=externalClean(value).replace(/\s/g,"");
 let match=raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
 if(match)return iso(match[1],match[2],match[3]);
 match=raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
 if(match)return iso(match[3],match[2],match[1]);
 match=externalKey(value).match(/^(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})$/);
 return match&&MONTHS[match[2]]?iso(match[3],MONTHS[match[2]],match[1]):"";
}
const DATE_GLOBAL=/\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]20\d{2}|\d{1,2}\s+de\s+[a-záéíóú]+\s+de\s+20\d{2})\b/gi;
function datesIn(value){
 return [...String(value).matchAll(DATE_GLOBAL)].map(match=>dateFromExternal(match[0])).filter(Boolean);
}
function timeFromPart(value){
 const m=String(value||"").match(/\b(\d{1,2})(?::|\.)(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/i);
 if(!m)return "";
 let h=+m[1],min=+m[2];
 if(min>59||h>23)return "";
 const meridian=externalKey(m[3]||"").replace(/ /g,"");
 if(meridian&&h>=1&&h<=12){if(meridian.startsWith("p")&&h!==12)h+=12;else if(meridian.startsWith("a")&&h===12)h=0;}
 return String(h).padStart(2,"0")+":"+String(min).padStart(2,"0");
}
export function timesFromExternal(value){
 const text=String(value||"");
 const a=text.match(/(?:entrada|ingreso|inicio)\s*[:\-]?\s*(\d{1,2}[:.]\d{2}(?:\s*[ap]\.?m\.?)?)/i);
 const b=text.match(/(?:salida|egreso|termino|término|fin)\s*[:\-]?\s*(\d{1,2}[:.]\d{2}(?:\s*[ap]\.?m\.?)?)/i);
 const all=[...text.matchAll(/\b\d{1,2}[:.]\d{2}(?:\s*[ap]\.?m\.?)?/gi)].map(x=>timeFromPart(x[0])).filter(Boolean);
 const start=timeFromPart(a?.[1])||all[0]||"",end=timeFromPart(b?.[1])||all[1]||"";
 return start&&end&&end>start?{start,end,hours:String((+end.slice(0,2)*60+(+end.slice(3))-(+start.slice(0,2)*60+(+start.slice(3))))/60)}:{start,end:"",hours:""};
}
function dayIndexFromLine(line){
 const key=externalKey(line);
 const match=key.match(/^(?:(?:dia|fecha|jornada)\s*)?(martes|miercoles|jueves|viernes)\b/);
 return match?DAYS.indexOf(match[1]):-1;
}
function dateAtLineStart(line){
 const lead=String(line||"").replace(/^(?:fecha|dia|día|jornada)\s*[:\-]?\s*/i,"");
 const candidate=lead.match(/^\s*(20\d{2}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]20\d{2})\b/);
 return candidate?dateFromExternal(candidate[0]):"";
}
function lineField(lines,label){
 const reg=new RegExp("^(?:"+label+")\\s*[:\\-–]\\s*(.+)$","i");
 return lines.map(x=>String(x).match(reg)?.[1]?.trim()).find(Boolean)||"";
}
function getName(lines){
 const found=lineField(lines,"(?:nombre(?: completo)?(?: del (?:alumno|estudiante))?|alumno\\s*\\(a\\)|alumno|estudiante|aprendiz)");
 return found ? found.replace(/\s+(?:grupo|semestre|especialidad)\s*:.*/i,"").slice(0,120):"";
}
function getCompany(lines){
 return lineField(lines,"(?:empresa|instituci[oó]n receptora|unidad econ[oó]mica|centro de trabajo|raz[oó]n social)").slice(0,160);
}
function activityFromChunk(lines){
 const idx=lines.findIndex(l=>/^\s*(?:actividad(?:es)?(?: realizadas)?|descripci[oó]n|labores)\s*[:\-]/i.test(l));
 if(idx>=0){
   const first=lines[idx].replace(/^[^:\-]+[:\-]\s*/,"");
   return externalClean([first,...lines.slice(idx+1)].join(" ")).slice(0,900);
 }
 return externalClean(lines.filter(line=>!/(?:nombre|empresa|fecha|entrada|salida|hora|semestre|grupo|firma|área|area|depto)\s*:/i.test(line))
    .map(line=>line.replace(DATE_GLOBAL,"").replace(/\b\d{1,2}[:.]\d{2}(?:\s*[ap]\.?m\.?)?/gi,""))
    .join(" ")).slice(0,900);
}
function emptyDay(){return {status:"",hours:"",reasonCode:"0",eventPhase:"no_aplica",eventDiscipline:"No aplica",eventMode:"con",eventResult:"",date:"",start:"",end:"",area:"",activity:"",detected:false};}
export function extractExternalFields(raw){
 const text=String(raw||"").replace(/\r/g,"").slice(0,EXTERNAL_TEXT_LIMIT);
 const lines=text.split(/\n/).map(externalClean).filter(Boolean);
 const days=Array.from({length:4},emptyDay);
 const allDates=datesIn(text);
 const segments=[];let current=null;
 for(const line of lines){
   let index=dayIndexFromLine(line);
   const date=dateAtLineStart(line);
   if(index<0&&date){
     const dow=new Date(date+"T12:00:00Z").getUTCDay();
     index=dow>=2&&dow<=5?dow-2:-1;
   }
   if(index>=0){
     if(current)segments.push(current);
     current={index,lines:[line],date};
   }else if(current) current.lines.push(line);
 }
 if(current)segments.push(current);
 for(const seg of segments){
   if(days[seg.index].detected)continue;
   const all=seg.lines.join("\n");
   const dates=datesIn(all);
   const date=seg.date||dates[0]||"";
   const times=timesFromExternal(all);
   const area=lineField(seg.lines,"(?:[aá]rea|departamento|secci[oó]n)");
   const reason=/\b(falta|inasistencia)\b/i.test(all)?"falta":/\b(d[ií]a inh[aá]bil)\b/i.test(all)?"inhabil":/\b(sin labores|suspensi[oó]n de actividades)\b/i.test(all)?"sin_labores":"";
   const activity=activityFromChunk(seg.lines);
   days[seg.index]={...days[seg.index],date,start:times.start,end:times.end,hours:times.hours,area,activity,
     status:reason||(times.hours?"laboral":""),detected:true};
 }
 const recognized=days.filter(day=>day.detected).length;
 const warnings=[];
 if(!getName(lines))warnings.push("No se encontró un nombre identificable.");
 if(recognized===0)warnings.push("No se identificaron jornadas; revisa la transcripción y captura las fechas manualmente.");
 if(recognized>0&&recognized<4)warnings.push("Se detectaron "+recognized+" de cuatro jornadas. Completa o deja sin estadísticas las restantes.");
 if(days.some(day=>day.detected&&!day.hours&&day.status!=="inhabil"&&day.status!=="falta"&&day.status!=="sin_labores"))
   warnings.push("Algunas jornadas no tienen horarios legibles.");
 return {name:getName(lines),company:getCompany(lines),dates:[...new Set(allDates)],days,warnings,recognized,text};
}
export function suggestExternalStudent(extracted,students){
 const name=externalKey(extracted?.name);
 const doc=externalKey(extracted?.text||"");
 if(name){
   const exact=students.filter(s=>externalKey(s.name)===name);
   if(exact.length===1)return exact[0].id;
 }
 const matches=students.filter(s=>{const key=externalKey(s.name);return key.length>=9&&doc.includes(key);});
 return matches.length===1?matches[0].id:"";
}
export function suggestExternalWeek(extracted,weeks){
 const dates=[...new Set(extracted?.dates||[])];
 if(!dates.length)return "";
 const matched=weeks.filter(week=>dates.every(date=>date>=week.startDate&&date<=week.endDate));
 return matched.length===1?matched[0].id:"";
}
export function externalDaysToStatistics(days){
 if(!Array.isArray(days)||days.length!==4)return null;
 if(days.every(day=>!day.status))return null;
 if(days.some(day=>!day.status))return null;
 return days.map(day=>({status:day.status,hours:day.hours,reasonCode:day.reasonCode||"0",
    eventPhase:day.eventPhase||"no_aplica",eventDiscipline:day.eventDiscipline||"No aplica",
    eventMode:"con",eventResult:day.eventResult||""}));
}
export function externalReviewMetadata(item,days){
 const keep=value=>externalClean(value).slice(0,900);
 return {
   filename:keep(item.filename).slice(0,180),
   method:["pdf-text","ocr","mixed","manual"].includes(item.method)?item.method:"ocr",
   pages:Math.min(16,Math.max(1,Number(item.pages)||1)),
   reviewedAt:new Date().toISOString(),
   name:keep(item.name).slice(0,120),
   company:keep(item.company).slice(0,160),
   days:days.map(d=>({date:keep(d.date).slice(0,10),status:d.status||"",
     start:keep(d.start).slice(0,5),end:keep(d.end).slice(0,5),
     area:keep(d.area).slice(0,150),activity:keep(d.activity).slice(0,900)})),
 };
}