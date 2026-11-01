import {useMemo,useState} from "react";
import {getRegistryNotifications,playInboxBell,markInboxSeen,getSeenInbox} from "../services/registry-notifications.js";
import {classifyReason} from "../services/reason-classifier.js";
import {calculateDualMilestones} from "../services/dual-milestones.js";
import {studentIsActive} from "../services/delivery-registry.js";
const storageFactory=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}};
function mockState(base,{pending,reasons,milestones,missingStats}){
  const state=JSON.parse(JSON.stringify(base));
  const week=state.weeks[0],student=state.students[0];week.id="debug-week-1";week.dueAt="2026-01-10T18:00:00-06:00";
  if(pending)week.deliveries={};
  else {
    const delivery=week.deliveries[student.id];
    if(missingStats)delete delivery.statistics;
    else delivery.statistics={version:5,entries:[
      {status:"laboral",minutes:240,reasonCode:0},
      {status:"falta",minutes:0,reasonCode:reasons?63:1,reasonId:reasons?"":"medical_appointment"},
      {status:"laboral",minutes:240,reasonCode:0},
      {status:"laboral",minutes:240,reasonCode:0}
    ]};
  }
  if(milestones){
    const first=state.weeks[0];
    for(let i=0;i<120;i++){
      const wk=JSON.parse(JSON.stringify(first));
      wk.id="debug-extra-"+i;
      wk.startDate="2026-"+String(1+Math.floor(i/12)).padStart(2,"0")+"-"+String(1+(i%12)).padStart(2,"0");
      wk.dueAt="2027-01-01T18:00:00-06:00";
      wk.deliveries={[student.id]:{status:"entregado",registeredAt:"2026-10-20T14:00:00Z",
        statistics:{version:5,entries:Array.from({length:4},()=>({status:"laboral",minutes:420,reasonCode:0}))}}};
      state.weeks.push(wk);
    }
  }
  return state;
}
export default function DebugInboxLab({base}){
  const [flags,setFlags]=useState({pending:true,reasons:true,milestones:false,missingStats:false,backup:true});
  const [storage,setStorage]=useState(storageFactory);
  const [revision,setRevision]=useState(0);
  const [sample,setSample]=useState("La empresa suspendió actividades porque fumigaron el lugar.");
  const state=useMemo(()=>mockState(base,flags),[base,flags]);
  const notices=useMemo(()=>getRegistryNotifications(state,{now:new Date("2026-11-02T12:00:00Z"),backupPending:flags.backup}),[state,flags.backup]);
  const seen=getSeenInbox(storage);
  const update=(k,on)=>setFlags(x=>({...x,[k]:on}));
  return <div className="debug-event-editor">
    <div className="debug-row">
      {[[ "pending","Entrega vencida"],["reasons","Otro motivo"],["milestones","Hitos de horas"],["missingStats","Sin estadísticas"],["backup","Respaldo"]].map(([key,label])=>
        <label key={key} style={{display:"inline-flex",gap:6,alignItems:"center",fontSize:13}}>
          <input type="checkbox" checked={flags[key]} onChange={e=>update(key,e.target.checked)}/>{label}
        </label>)}
    </div>
    <div className="debug-row">
      <button className="debug-button" onClick={()=>playInboxBell()}>Probar sonido de campana</button>
      <button className="debug-button" onClick={()=>{markInboxSeen(storage,notices);setRevision(x=>x+1);}}>Simular lectura</button>
      <button className="debug-button" onClick={()=>{setStorage(storageFactory());setRevision(x=>x+1);}}>Restablecer simulación</button>
    </div>
    <div className="debug-test-list">
      {notices.length?notices.map(n=><div className="debug-test pass" key={n.id}>
        <strong>{n.title} · {n.severity} · {seen[n.id]?"Visto":"Nuevo"}</strong>
        <span>{n.description} · destino: {n.action}</span>
      </div>):<p>Sin avisos con estas condiciones.</p>}
    </div>
    <div className="debug-event-test">
      <label>Prueba de justificaciones de Sin labores
        <textarea rows="2" style={{width:"100%"}} value={sample} onChange={e=>setSample(e.target.value)}/></label>
      <p><strong>Resultado:</strong> {classifyReason("sin_labores",sample)?.label||"Otro motivo (63)"}</p>
    </div>
    <small>Las simulaciones usan datos ficticios y memoria aislada. No se alteran alumnos, registros ni anuncios vistos.</small>
  </div>;
}
