import {
  House,CalendarDots,Scan,ChartBar,Image,FilePdf,Users,
  DownloadSimple,Plus,Question, X,ArrowRight
} from "@phosphor-icons/react";

/** Controles globales de Registro Dual; mismo estado y rutas que el resto del módulo. */
export default function RegistryQuickSidebar({open,onClose,current,canScan,
 onNavigate,onScan,onCreateWeek,onReport,onManage,onBackup,onTutorial}){
 const routes=[
  {id:"home",label:"Inicio",icon:House},
  {id:"weeks",label:"Semanas",icon:CalendarDots},
  {id:"statistics",label:"Datos",icon:ChartBar},
  {id:"announcements",label:"Avisos PNG",icon:Image},
 ];
 const isCurrent=id=>current===id||(id==="weeks"&&current==="week");
 return <>
  {open&&<button className="delivery-quick-scrim" type="button" onClick={onClose}
    aria-label="Cerrar accesos rápidos"/>}
  <aside className={"delivery-quick-sidebar"+(open?" delivery-quick-open":"")}
    aria-label="Accesos rápidos del registro">
    <div className="delivery-quick-heading">
      <div><span>REGISTRO DUAL</span><strong>Accesos rápidos</strong></div>
      <button className="delivery-quick-close" type="button" onClick={onClose}
        aria-label="Cerrar barra lateral"><X size={20}/></button>
    </div>
    <nav aria-label="Navegación rápida">
      {routes.map(({id,label,icon:Icon})=><button type="button"
        className={"delivery-quick-link"+(isCurrent(id)?" active":"")}
        aria-current={isCurrent(id)?"page":undefined} key={id}
        onClick={()=>{onNavigate(id);onClose();}}>
        <Icon size={19} weight={isCurrent(id)?"fill":"regular"} aria-hidden="true"/>
        <span>{label}</span><ArrowRight className="delivery-quick-chevron" size={14} aria-hidden="true"/>
      </button>)}
    </nav>
    <div className="delivery-quick-rule"/>
    <span className="delivery-quick-caption">HERRAMIENTAS</span>
    <div className="delivery-quick-actions">
      <button type="button" disabled={!canScan} onClick={()=>{onScan();onClose();}}>
        <Scan size={19} aria-hidden="true"/> Escanear bitácora
      </button>
      <button type="button" onClick={()=>{onCreateWeek();onClose();}}>
        <Plus size={19} aria-hidden="true"/> Nueva semana
      </button>
      <button type="button" onClick={()=>{onManage();onClose();}}>
        <Users size={19} aria-hidden="true"/> Administrar alumnos
      </button>
      <button type="button" onClick={()=>{onReport();onClose();}}>
        <FilePdf size={19} aria-hidden="true"/> Reportes PDF
      </button>
      <button type="button" onClick={()=>{onTutorial();onClose();}}>
        <Question size={19} aria-hidden="true"/> Ayuda
      </button>
    </div>
    <div className="delivery-quick-backup">
      <span>PROTEGE TUS REGISTROS</span>
      <p>Descarga una copia JSON para conservarla fuera del navegador.</p>
      <button type="button" onClick={()=>{onBackup();onClose();}}>
        <DownloadSimple size={18} aria-hidden="true"/> Guardar respaldo
      </button>
    </div>
  </aside>
 </>;
}
