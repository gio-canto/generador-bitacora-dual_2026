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
const MONTH_PATTERN="(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)";
const DATE_SOURCE="(?:20\\d{2}[-/.]\\d{1,2}[-/.]\\d{1,2}|\\d{1,2}[-/.]\\d{1,2}[-/.](?:20\\d{2}|\\d{2})|\\d{1,2}(?:\\s*[/.-]\\s*|\\s+de\\s+)"+MONTH_PATTERN+"(?:\\s*[/.-]\\s*|\\s+de\\s+)(?:20\\d{2}|\\d{2}))";
export const DATE_GLOBAL=new RegExp("\\b"+DATE_SOURCE+"\\b","gi");
const expandedYear=value=>Number(value)<100?2000+Number(value):Number(value);
export function dateFromExternal(value){
 const clean=String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()
  .replace(/^(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s*[,.:;-]?\s*/,"")
  .replace(/^(?:fecha|dia|jornada)\s*[:\-]?\s*/,"");
 let match=clean.match(/^(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})$/);
 if(match)return iso(match[1],match[2],match[3]);
 match=clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|20\d{2})$/);
 if(match)return iso(expandedYear(match[3]),match[2],match[1]);
 match=clean.match(new RegExp("^(\\d{1,2})(?:\\s*[/.-]\\s*|\\s+de\\s+)("+MONTH_PATTERN+")(?:\\s*[/.-]\\s*|\\s+de\\s+)(\\d{2}|20\\d{2})$","i"));
 return match?iso(expandedYear(match[3]),MONTHS[match[2]],match[1]):"";
}
function datesIn(value){
 return [...String(value).matchAll(DATE_GLOBAL)].map(match=>dateFromExternal(match[0])).filter(Boolean);
}
// Formatos calibrados con el lote 01: 9a.m.-3p.m., 09:00-14:00 y Entrada/Salida.
const CLOCK_TOKEN="\\d{1,2}(?:(?:[:.]\\d{2})(?:\\s*[ap]\\.?\\s*m\\.?)?|\\s*[ap]\\.?\\s*m\\.?)";
const CLOCK_GLOBAL=new RegExp("(^|[^0-9a-z])("+CLOCK_TOKEN+")","gi");
function timeFromPart(value){
 const match=String(value||"").trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*([ap])?\.?\s*(m)?\.?$/i);
 if(!match)return "";
 const meridian=match[3]&&match[4]?match[3].toLowerCase():"";
 if(!match[2]&&!meridian)return "";
 let h=+match[1],minutes=+(match[2]||0);
 if(minutes>59||h>23||(meridian&&(h<1||h>12)))return "";
 if(meridian==="p"&&h!==12)h+=12;
 if(meridian==="a"&&h===12)h=0;
 return String(h).padStart(2,"0")+":"+String(minutes).padStart(2,"0");
}
export function timesFromExternal(value){
 const text=String(value||"");
 const startMatch=text.match(new RegExp("(?:entrada|ingreso|inicio)\\s*[:\\-]?\\s*("+CLOCK_TOKEN+")","i"));
 const endMatch=text.match(new RegExp("(?:salida|egreso|termino|término|fin)\\s*[:\\-]?\\s*("+CLOCK_TOKEN+")","i"));
 const all=[...text.matchAll(CLOCK_GLOBAL)].map(match=>timeFromPart(match[2])).filter(Boolean);
 const start=timeFromPart(startMatch?.[1])||all[0]||"";
 const end=timeFromPart(endMatch?.[1])||all[1]||"";
 // "9:00-2:00" es ambiguo: no se interpreta automáticamente como 14:00.
 if(!start||!end||end<=start)return {start,end:"",hours:""};
 const [sh,sm]=start.split(":").map(Number),[eh,em]=end.split(":").map(Number);
 return {start,end,hours:String(((eh-sh)*60+em-sm)/60)};
}
function dayIndexFromLine(line){
 const key=externalKey(line);
 const match=key.match(/^(?:(?:dia|fecha|jornada)\s*)?(martes|miercoles|jueves|viernes)\b/);
 return match?DAYS.indexOf(match[1]):-1;
}
function dateAtLineStart(line){
 const lead=String(line||"").replace(/^(?:fecha|dia|día|jornada)\s*[:\-]?\s*/i,"").trim();
 const match=[...lead.matchAll(DATE_GLOBAL)][0];
 return match?.index===0?dateFromExternal(match[0]):"";
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
 return lineField(lines,"(?:nombre\\s+de\\s+la\\s+empresa|empresa|instituci[oó]n receptora|unidad econ[oó]mica|centro de trabajo|raz[oó]n social)").slice(0,160);
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
   if(date&&index<0){
     // Una fecha visible fuera de martes-viernes no debe mezclarse con otra jornada.
     if(current)segments.push(current);
     current=null;
     continue;
   }
   if(/^\s*(?:firma del|firma de vinculaci[oó]n|firma del asesor)/i.test(line)){
     if(current)segments.push(current);
     current=null;
     continue;
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
   const reason=/\b(falta|inasistencia)\b/i.test(all)?"falta":/\b(d[ií]a inh[aá]bil)\b/i.test(all)?"inhabil":/\b(sin labores|no hubo labores|se suspendieron (?:las )?labores|se suspendieron (?:las )?actividades|suspensi[oó]n de (?:las )?actividades)\b/i.test(all)?"sin_labores":"";
   const activity=activityFromChunk(seg.lines);
   days[seg.index]={...days[seg.index],date,start:times.start,end:times.end,hours:times.hours,area,activity,
     status:reason||(times.hours?"laboral":""),detected:true};
 }
 const recognized=days.filter(day=>day.detected).length;
 const warnings=[];
 if(allDates.some(date=>{const day=new Date(date+"T12:00:00Z").getUTCDay();return day<2||day>5;}))
   warnings.push("Hay fechas fuera de martes a viernes. Revisa el periodo antes de asignar la semana.");
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
   if(exact.length>1)return "";
   const aliases=students.filter(s=>(s.aliases||[]).some(a=>externalKey(a)===name));
   if(aliases.length===1)return aliases[0].id;
   if(aliases.length>1)return "";
 }
 const matches=students.filter(s=>{
   const keys=[s.name,...(s.aliases||[])].map(externalKey).filter(key=>key.length>=9);
   return keys.some(key=>doc.includes(key));
 });
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
   method:["pdf-text","docx-text","ocr","mixed","manual"].includes(item.method)?item.method:"ocr",
   pages:Math.min(16,Math.max(1,Number(item.pages)||1)),
   reviewedAt:new Date().toISOString(),
   name:keep(item.name).slice(0,120),
   company:keep(item.company).slice(0,160),
   days:days.map(d=>({date:keep(d.date).slice(0,10),status:d.status||"",
     start:keep(d.start).slice(0,5),end:keep(d.end).slice(0,5),
     area:keep(d.area).slice(0,150),activity:keep(d.activity).slice(0,900)})),
 };
}
/** Propone martes-viernes solamente cuando las fechas legibles pertenecen a un mismo periodo. */
export function suggestExternalWeekPeriod(extracted) {
 const dates=[...new Set(extracted?.dates||[])].sort();
 if(!dates.length)return null;
 const starts=dates.map(value=>{
   if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return "";
   const date=new Date(value+"T12:00:00Z");
   if(date.toISOString().slice(0,10)!==value)return "";
   const dow=date.getUTCDay();
   if(dow<2||dow>5)return "";
   date.setUTCDate(date.getUTCDate()-(dow-2));
   return date.toISOString().slice(0,10);
 });
 if(starts.some(value=>!value)||new Set(starts).size!==1)return null;
 const end=new Date(starts[0]+"T12:00:00Z");
 end.setUTCDate(end.getUTCDate()+3);
 return {startDate:starts[0],endDate:end.toISOString().slice(0,10)};
}

/** Aplica únicamente correcciones únicas confirmadas; nunca sustituye nombres ambiguos. */
export function applyExternalLearning(extracted,examples=[],studentId="") {
 const rawCompany=externalKey(extracted?.company);
 if(!rawCompany||!Array.isArray(examples))return extracted;
 const applicable=examples.filter(example=>
   externalKey(example.observedCompany)===rawCompany &&
   (!studentId||example.studentId===studentId));
 const options=[...new Set(applicable.map(example=>externalClean(example.confirmedCompany)).filter(Boolean))];
 return options.length===1?{...extracted,company:options[0]}:extracted;
}
