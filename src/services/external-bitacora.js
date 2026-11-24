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
const SEP="[-/.*°º]";
const DATE_SOURCE="(?:20\\d{2}"+SEP+"\\d{1,2}"+SEP+"\\d{1,2}|\\d{1,2}"+SEP+"\\d{1,2}"+SEP+"(?:20\\d{2}|\\d{2})|\\d{1,2}(?:\\s*[/.-]\\s*|\\s+de\\s+)"+MONTH_PATTERN+"(?:\\s*[/.-]\\s*|\\s+de(?:l)?\\s+)(?:20\\d{2}|\\d{2}))";
export const DATE_GLOBAL=new RegExp("\\b"+DATE_SOURCE+"\\b","gi");
const PARTIAL_DATE=/^(\d{1,2})[-/.*°º](\d{1,2})(?=\s|$)/;
const expandedYear=value=>Number(value)<100?2000+Number(value):Number(value);
export function dateFromExternal(value,contextYear=null){
 const clean=String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()
  .replace(/^(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s*[,.:;-]?\s*/,"")
  .replace(/^(?:fecha|dia|jornada)\s*[:\-]?\s*/,"");
 let match=clean.match(/^(20\d{2})[-/.*°º](\d{1,2})[-/.*°º](\d{1,2})$/);
 if(match)return iso(match[1],match[2],match[3]);
 match=clean.match(/^(\d{1,2})[-/.*°º](\d{1,2})[-/.*°º](\d{2}|20\d{2})$/);
 if(match)return iso(expandedYear(match[3]),match[2],match[1]);
 match=clean.match(new RegExp("^(\\d{1,2})(?:\\s*[/.-]\\s*|\\s+de\\s+)("+MONTH_PATTERN+")(?:\\s*[/.-]\\s*|\\s+de(?:l)?\\s+)(\\d{2}|20\\d{2})$","i"));
 if(match)return iso(expandedYear(match[3]),MONTHS[match[2]],match[1]);
 match=clean.match(/^(\d{1,2})[-/.*°º](\d{1,2})$/);
 return match&&Number.isInteger(contextYear)&&contextYear>=2000&&contextYear<=2100
   ?iso(contextYear,match[2],match[1]):"";
}
function datesIn(value){
 return [...String(value).matchAll(DATE_GLOBAL)].map(match=>dateFromExternal(match[0])).filter(Boolean);
}
// Reconocimiento de horarios del lote 01 y 02, incluidos segmentos múltiples.
const CLOCK_TOKEN="\\d{1,2}(?:(?:[:.]\\d{2})(?:\\s*[ap]\\.?\\s*m\\.?)?|\\s*[ap]\\.?\\s*m\\.?)";
const CLOCK_GLOBAL=new RegExp("(^|[^0-9a-z])("+CLOCK_TOKEN+")","gi");
const CLOCK_RANGE=new RegExp("("+CLOCK_TOKEN+")\\s*(?:-|–|—|\\ba\\b|\\bal\\b)\\s*("+CLOCK_TOKEN+")","gi");
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
function minuteOf(value){
 if(!value)return NaN;
 return Number(value.slice(0,2))*60+Number(value.slice(3));
}
export function timeBlocksFromExternal(value){
 const text=String(value||"");
 return [...text.matchAll(CLOCK_RANGE)].map(match=>{
   const start=timeFromPart(match[1]),end=timeFromPart(match[2]);
   const minutes=minuteOf(end)-minuteOf(start);
   return {start,end,hours:start&&end&&minutes>0?String(minutes/60):"",raw:match[0]};
 }).slice(0,16);
}
export function timesFromExternal(value){
 const text=String(value||"");
 const blocks=timeBlocksFromExternal(text);
 if(blocks.length){
   const safe=blocks.every((block,index)=>
     block.hours!==""&&(!index||minuteOf(block.start)>=minuteOf(blocks[index-1].end)));
   if(!safe)return {start:blocks[0].start,end:"",hours:"",blocks,ambiguous:true};
   const minutes=blocks.reduce((total,block)=>total+Number(block.hours)*60,0);
   return {start:blocks[0].start,end:blocks.at(-1).end,hours:String(minutes/60),blocks,ambiguous:false};
 }
 const startMatch=text.match(new RegExp("(?:entrada|ingreso|inicio)\\s*[:\\-]?\\s*("+CLOCK_TOKEN+")","i"));
 const endMatch=text.match(new RegExp("(?:salida|egreso|termino|término|fin)\\s*[:\\-]?\\s*("+CLOCK_TOKEN+")","i"));
 const all=[...text.matchAll(CLOCK_GLOBAL)].map(match=>timeFromPart(match[2])).filter(Boolean);
 const start=timeFromPart(startMatch?.[1])||all[0]||"";
 const end=timeFromPart(endMatch?.[1])||all[1]||"";
 if(!start||!end||end<=start)return {start,end:"",hours:"",blocks:[],ambiguous:true};
 return {start,end,hours:String((minuteOf(end)-minuteOf(start))/60),blocks:[],ambiguous:false};
}
function dayIndexFromLine(line){
 const key=externalKey(line);
 const match=key.match(/^(?:(?:dia|fecha|jornada)\s*)?(martes|miercoles|jueves|viernes)\b/);
 return match?DAYS.indexOf(match[1]):-1;
}
function dateAtLineStart(line,contextYear=null){
 const lead=String(line||"").replace(/^(?:fecha|dia|día|jornada)\s*[:\-]?\s*/i,"")
   .replace(/^(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s*[,.:;-]?\s*/i,"").trim();
 const match=[...lead.matchAll(DATE_GLOBAL)][0];
 if(match?.index===0)return dateFromExternal(match[0]);
 const partial=lead.match(PARTIAL_DATE);
 return partial?dateFromExternal(partial[0],contextYear):"";
}
function lineField(lines,label){
 const reg=new RegExp("^(?:"+label+")(?:\\s*[:\\-–]\\s*|\\s+)(.+)$","i");
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
/** Estados normalizados de escritos impresos o manuscritos (sin distinguir acentos). */
export function inferExternalStatus(text,times={hours:""},activity=""){
 const key=externalKey(text),work=externalKey(activity);
 if(/\b(?:no asisti|no me presente|inasistencia|falta(?:\s+(?:justificada|injustificada))?)\b/.test(key)&&
   !/\bfalta de (?:material|equipo|tiempo|herramientas|personal)\b/.test(key))return "falta";
 if(/\b(?:dia inhabil|dia festivo|descanso oficial|asueto|feriado)\b/.test(key))return "inhabil";
 const closed=/\b(?:sin labores|no hubo labores|no hay labores|sin actividad laboral|sin actividades laborales|suspension (?:de|por) (?:las )?(?:labores|actividades)|labores suspendidas|actividades suspendidas|se suspendieron (?:las )?(?:labores|actividades)|se cancelaron (?:las )?(?:labores|actividades)|no se laboro|no laboramos|no hubo jornada|no se trabajo|no trabajamos|no tuvimos labores|sin trabajo por calendario)\b/.test(key);
 if(closed)return "sin_labores";
 const nothing=/\b(?:no se realizaron actividades|no se realizo ninguna actividad|no se llevaron a cabo actividades|no hubo actividades|sin actividades asignadas|no se realizaron labores|no se realizo actividad alguna)\b/.test(key);
 // "En el laboratorio no se realizaron actividades" puede referirse solo al área.
 const local=/\b(?:en el laboratorio|en la sala|en el area|en el departamento|en el salon)\b/.test(key);
 if(nothing)return local&&times?.hours?"":"sin_labores";
 if(times?.hours||/\b(?:actividades realizadas|realizamos|trabajamos|elaboracion|captura|registro|archivo|organizacion|revision|participamos|desarrollamos|asistimos|preparamos|realice|realizo)\b/.test(work))return "laboral";
 return "";
}
function emptyDay(){return {status:"",hours:"",timeBlocks:[],needsReview:false,reasonCode:"0",eventPhase:"no_aplica",eventDiscipline:"No aplica",eventMode:"con",eventResult:"",date:"",start:"",end:"",area:"",activity:"",detected:false};}
export function extractExternalFields(raw){
 const text=String(raw||"").replace(/\r/g,"").slice(0,EXTERNAL_TEXT_LIMIT);
 const lines=text.split(/\n/).map(externalClean).filter(Boolean);
 const days=Array.from({length:4},emptyDay);
 const explicitDates=datesIn(text);
 const candidateYears=[...new Set(explicitDates.map(date=>Number(date.slice(0,4))))];
 const contextYear=candidateYears.length===1?candidateYears[0]:null;
 const allDates=[...explicitDates];
 const uncertainShortDates=[];
 const segments=[];let current=null;
 for(const line of lines){
   let index=dayIndexFromLine(line);
   const date=dateAtLineStart(line,contextYear);
   if(!date&&/^\s*\d{1,2}[-/.*°º]\d{1,2}(?=\s|$)/.test(line))
     uncertainShortDates.push(line);
   if(date&&!allDates.includes(date))allDates.push(date);
   if(index<0&&date){
     const dow=new Date(date+"T12:00:00Z").getUTCDay();
     index=dow>=2&&dow<=5?dow-2:-1;
   } else if(index>=0&&date){
     const dow=new Date(date+"T12:00:00Z").getUTCDay();
     if(dow!==index+2){uncertainShortDates.push("Día y fecha no coinciden: "+line);index=-1;}
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
   const activity=activityFromChunk(seg.lines);
   const status=inferExternalStatus(all,times,activity);
   const uncertainStatus=status===""&&/\b(?:no se realizaron actividades|no hubo actividades|sin actividades asignadas)\b/.test(externalKey(all));
   const nonWorking=["falta","sin_labores","inhabil"].includes(status);
   days[seg.index]={...days[seg.index],date,
     start:nonWorking?"":times.start,end:nonWorking?"":times.end,
     hours:nonWorking?"":times.hours,area,activity,
     timeBlocks:times.blocks,needsReview:Boolean(uncertainStatus||(!nonWorking&&times.ambiguous)),
     status,detected:true};
 }
 const recognized=days.filter(day=>day.detected).length;
 const warnings=[];
 if(uncertainShortDates.length)
   warnings.push("Hay fechas abreviadas sin año verificable o que no coinciden con el día: revisa las fechas.");
 if(allDates.some(date=>{const day=new Date(date+"T12:00:00Z").getUTCDay();return day<2||day>5;}))
   warnings.push("Hay fechas fuera de martes a viernes. Revisa el periodo antes de asignar la semana.");
 if(!getName(lines))warnings.push("No se encontró un nombre identificable.");
 if(recognized===0)warnings.push("No se identificaron jornadas; revisa la transcripción y captura las fechas manualmente.");
 if(recognized>0&&recognized<4)warnings.push("Se detectaron "+recognized+" de cuatro jornadas. Completa o deja sin estadísticas las restantes.");
 if(days.some(day=>day.detected&&!day.hours&&day.status!=="inhabil"&&day.status!=="falta"&&day.status!=="sin_labores"))
   warnings.push("Algunas jornadas no tienen horarios legibles.");
 if(days.some(day=>day.needsReview))
   warnings.push("Hay horarios con varios tramos o actividades suspendidas que requieren confirmar el estado y las horas.");
 return {name:getName(lines),company:getCompany(lines),dates:[...new Set(allDates)],days,warnings,recognized,text};
}

/** Catálogo sugerido desde las empresas ya registradas, sin diferencias por acento o caja. */
export function externalCompanyOptions(students=[]){
 const seen=new Set();
 return students.map(student=>externalClean(student.company||"")).filter(company=>{
   const key=externalKey(company);
   if(!key||seen.has(key))return false;
   seen.add(key);return true;
 }).sort((a,b)=>a.localeCompare(b,"es",{sensitivity:"base"}));
}
export function suggestExternalCompany(extracted,students=[],studentId=""){
 const read=externalClean(extracted?.company||"");
 const key=externalKey(read);
 const options=externalCompanyOptions(students);
 if(key){
   const exact=options.filter(x=>externalKey(x)===key);
   if(exact.length===1)return exact[0];
   const approx=key.length>=5?options.filter(x=>{
     const candidate=externalKey(x);
     return candidate.includes(key)||key.includes(candidate);
   }):[];
   if(approx.length===1)return approx[0];
   return read;
 }
 return externalClean(students.find(x=>x.id===studentId)?.company||"");
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
export function suggestExternalWeek(extracted,weeks=[]){
 const dates=[...new Set(extracted?.dates||[])].filter(Boolean);
 if(dates.length){
   const period=suggestExternalWeekPeriod(extracted);
   if(!period)return ""; // Nunca sustituir fechas contradictorias por el número de semana.
   const matched=weeks.filter(week=>week.startDate===period.startDate&&
     dates.every(date=>date>=week.startDate&&date<=week.endDate));
   return matched.length===1?matched[0].id:"";
 }
 // Con documentos sin fechas legibles, un número de semana explícito y único sí sirve.
 const hint=externalKey(extracted?.text||"").match(/\bsemana\s*(?:numero|num|no|n)?\s*(\d{1,3})\b/);
 if(!hint)return "";
 const matched=weeks.filter(week=>{
   const label=externalKey(week.label||"");
   const number=label.match(/\bsemana\s*(?:numero|num|no|n)?\s*(\d{1,3})\b/);
   return number&&Number(number[1])===Number(hint[1]);
 });
 return matched.length===1?matched[0].id:"";
}
export function externalDaysToStatistics(days){
 if(!Array.isArray(days)||days.length!==4)return null;
 if(days.every(day=>!day.status))return null;
 if(days.some(day=>!day.status))return null;
 if(days.some(day=>["laboral","evento"].includes(day.status)&&
   (!Number.isFinite(Number(day.hours))||Number(day.hours)<=0)))return null;
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
     activity:keep(d.activity).slice(0,900),
     timeBlocks:Array.isArray(d.timeBlocks)?d.timeBlocks.slice(0,12).map(block=>({
       start:keep(block.start).slice(0,5),end:keep(block.end).slice(0,5),
       hours:keep(block.hours).slice(0,16),raw:keep(block.raw).slice(0,80)
     })):[]})),
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
