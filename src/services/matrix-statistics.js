import absenceReasons from "../data/absence-reasons.json";
import nonWorkingReasons from "../data/non-working-reasons.json";
import catalog from "../data/special-events.json";
import {classifyReason} from "./reason-classifier.js";
import {EVENT_PHASE_CODES,eventDisciplineCode,eventDisciplineFromCode,specialEventByCode} from "./special-events.js";
const STATUSES=["laboral","falta","sin_labores","inhabil","evento"];
const MAX_MINUTES=2046;
const reasons=status=>status==="falta"?absenceReasons:status==="sin_labores"?nonWorkingReasons:[];
function minutesBetween(start,end){
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(start||"")||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end||""))return null;
  const [a,b]=start.split(":").map(Number),[c,d]=end.split(":").map(Number),minutes=(c*60+d)-(a*60+b);
  return minutes>0&&minutes<=MAX_MINUTES?minutes:null;
}
export function reasonFromEntry(e){
  if(e?.status==="evento")return catalog.find(x=>x.id===e.eventId)?.code||63;
  const list=reasons(e?.status);
  if(!list.length)return 0;
  const match=list.find(x=>x.id===e.reasonId)||
    list.find(x=>x.text.trim()===String(e.activity||"").trim())||
    classifyReason(e.status,e.activity);
  return match?.code||63;
}
function checksum(bits,n){let crc=0;for(let i=0;i<n;i++)crc^=Number(bits>>BigInt(i*4)&15n);return crc;}
export function encodeWeekStatistics(entries){
  if(!Array.isArray(entries)||entries.length!==4)return "";
  const v6=entries.some(x=>x?.status==="evento"),width=v6?29n:19n;
  let bits=0n;
  for(const e of entries){
    const kind=STATUSES.indexOf(e?.status);
    if(kind<0)return "";
    const hasHours=kind===0||(kind===4&&e.eventMode==="con");
    const minutes=hasHours?minutesBetween(e.start,e.end):0;
    if(minutes===null)return "";
    const code=reasonFromEntry(e);
    let word;
    if(v6){
      const phase=kind===4?EVENT_PHASE_CODES.indexOf(e.eventPhase||"no_aplica"):0;
      if(phase<0)return "";
      const discipline=kind===4?eventDisciplineCode(e.eventId,e.eventDiscipline):0;
      const mode=kind===4&&e.eventMode==="con"?1:0;
      word=kind*2**26+minutes*2**15+code*2**9+phase*2**6+discipline*2+mode;
    } else word=(kind<<17)|(minutes<<6)|code;
    bits=(bits<<width)|BigInt(word);
  }
  const packed=(bits<<4n)|BigInt(checksum(bits,v6?29:19));
  let str="";
  for(let i=(v6?15:10)-1;i>=0;i--)str+=String.fromCharCode(Number(packed>>BigInt(i*8)&255n));
  return (v6?"S6:":"S5:")+globalThis.btoa(str).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
export function decodeWeekStatistics(value){
  const v6=typeof value==="string"&&/^S6:[A-Za-z0-9_-]{20}$/.test(value);
  if(!v6&&!(typeof value==="string"&&/^S5:[A-Za-z0-9_-]{14}$/.test(value)))return null;
  try{
    const raw=value.slice(3).replace(/-/g,"+").replace(/_/g,"/");
    const data=globalThis.atob(raw+"==".slice(0,(4-raw.length%4)%4));
    if(data.length!==(v6?15:10))return null;
    let packed=0n;for(let i=0;i<data.length;i++)packed=packed<<8n|BigInt(data.charCodeAt(i));
    const bits=packed>>4n;
    if(Number(packed&15n)!==checksum(bits,v6?29:19))return null;
    const entries=[];
    for(let i=3;i>=0;i--){
      const word=Number(bits>>BigInt(i*(v6?29:19))&BigInt(v6?0x1fffffff:0x7ffff));
      const kind=v6?Math.floor(word/2**26):word>>17,status=STATUSES[kind];
      const minutes=v6?Math.floor(word/2**15)%2048:(word>>6)&2047;
      const reasonCode=v6?Math.floor(word/2**9)%64:word&63;
      const phase=v6?Math.floor(word/2**6)%8:0,discipline=v6?Math.floor(word/2)%32:0,mode=v6?word%2:0;
      const event=specialEventByCode(reasonCode),list=reasons(status);
      if(!status||minutes>MAX_MINUTES||
        (status==="laboral"&&(!minutes||reasonCode))||
        (!["laboral","evento"].includes(status)&&minutes!==0)||
        (status==="inhabil"&&reasonCode)||
        (status==="evento"&&(!v6||!event||phase>=EVENT_PHASE_CODES.length||
          (mode===0&&minutes!==0)||(mode===1&&!minutes)||
          (discipline&&!event.disciplines[discipline])))||
        (status!=="evento"&&(phase||discipline||mode))||
        (["falta","sin_labores"].includes(status)&&reasonCode!==0&&reasonCode!==63&&!list.some(x=>x.code===reasonCode)))return null;
      entries.push({status,minutes,reasonCode,
        reasonId:status==="evento"?event.id:(list.find(x=>x.code===reasonCode)?.id||""),
        ...(status==="evento"?{eventPhase:EVENT_PHASE_CODES[phase],eventDiscipline:eventDisciplineFromCode(event.id,discipline),eventMode:mode?"con":"sin"}:{})});
    }
    return {version:v6?6:5,entries};
  }catch{return null;}
}
export function summarizeWeekStatistics(stats){
  if(!stats||!Array.isArray(stats.entries)||stats.entries.length!==4)return null;
  const a={minutes:0,worked:0,absent:0,nonWorking:0,holidays:0,events:0};
  for(const d of stats.entries){
    if(d.status==="laboral"){a.worked++;a.minutes+=d.minutes||0;}
    else if(d.status==="falta")a.absent++;
    else if(d.status==="sin_labores")a.nonWorking++;
    else if(d.status==="inhabil")a.holidays++;
    else if(d.status==="evento"){a.events++;if(d.eventMode==="con")a.minutes+=d.minutes||0;}
  }
  return a;
}
export function causeLabel(status,code){
  if(status==="evento")return specialEventByCode(code)?.label||"Otros";
  if(code===63)return "Otro motivo";
  return reasons(status).find(x=>x.code===code)?.label||"Sin clasificar";
}
