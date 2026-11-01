
import {useEffect,useId,useRef,useState} from "react";
import {Check,CaretDown,CaretLeft,CaretRight,CalendarBlank,X,Upload,Copy} from "@phosphor-icons/react";

export function StudioField({label,value,onChange,placeholder="",multiline=false,rows=4,help="",disabled=false}){
  const id=useId();
  return <div className="es-field">
    <label htmlFor={id}>{label}</label>
    {multiline?<textarea id={id} className="es-textbox es-textarea" rows={rows}
      value={value??""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}/>:
      <input id={id} className="es-textbox" type="text" value={value??""}
      onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}/>}
    {help&&<span className="es-help">{help}</span>}
  </div>;
}
export function StudioSwitch({label,checked,onChange,help=""}){
  return <button type="button" role="switch" aria-checked={Boolean(checked)} onClick={()=>onChange(!checked)}
    className={"es-switch-row"+(checked?" is-on":"")}>
    <span><strong>{label}</strong>{help&&<small>{help}</small>}</span>
    <span aria-hidden="true" className="es-switch-track"><span/></span>
  </button>;
}
export function StudioChoices({label,items,value,onChange,columns=2}){
  return <div className="es-field">
    <span className="es-label">{label}</span>
    <div role="group" aria-label={label} className="es-choice-grid" style={{"--es-columns":columns}}>
      {items.map(({id,title,description,icon:Icon,disabled})=><button key={id} type="button" disabled={disabled}
        className={"es-choice"+(value===id?" is-selected":"")} aria-pressed={value===id} onClick={()=>onChange(id)}>
        {Icon&&<Icon size={20} aria-hidden="true"/>}
        <span><strong>{title}</strong>{description&&<small>{description}</small>}</span>
        {value===id&&<Check size={17} className="es-choice-check" aria-hidden="true"/>}
      </button>)}
    </div>
  </div>;
}
export function StudioSelect({label,items,value,onChange,help}){
  const [open,setOpen]=useState(false),ref=useRef(null);
  useEffect(()=>{if(!open)return;
    const click=e=>{if(!ref.current?.contains(e.target))setOpen(false);};
    const key=e=>{if(e.key==="Escape")setOpen(false);};
    document.addEventListener("pointerdown",click);document.addEventListener("keydown",key);
    return()=>{document.removeEventListener("pointerdown",click);document.removeEventListener("keydown",key);};
  },[open]);
  const selected=items.find(item=>item.id===value);
  return <div ref={ref} className="es-field es-select-wrap">
    <span className="es-label">{label}</span>
    <button type="button" className="es-select-trigger" aria-haspopup="listbox" aria-expanded={open}
      onClick={()=>setOpen(x=>!x)}>{selected?.title||"Seleccionar"}<CaretDown size={17} aria-hidden="true"/></button>
    {open&&<div className="es-select-list" role="listbox" aria-label={label}>
      {items.map(item=><button key={item.id} type="button" role="option"
        aria-selected={item.id===value} className={item.id===value?"is-selected":""}
        onClick={()=>{onChange(item.id);setOpen(false);}}>
        <span>{item.title}</span>{item.id===value&&<Check size={16}/>}</button>)}
    </div>}
    {help&&<span className="es-help">{help}</span>}
  </div>;
}
export function StudioPills({label,items,selection,onChange,help}){
  const all=selection==="all";
  return <div className="es-field">
    <span className="es-label">{label}</span>
    <div className="es-pills">
      <button type="button" aria-pressed={all} className={all?"is-active":""}
        onClick={()=>onChange("all")}>Todos</button>
      {items.map(item=><button type="button" key={item.id}
        aria-pressed={!all&&selection.includes(item.id)}
        className={!all&&selection.includes(item.id)?"is-active":""}
        onClick={()=>{
          const next=all?[]:selection;
          const values=next.includes(item.id)?next.filter(x=>x!==item.id):[...next,item.id];
          onChange(values.length?values:"all");
        }}>{item.title}</button>)}
    </div>
    {help&&<span className="es-help">{help}</span>}
  </div>;
}
const asMonth=value=>{
  const parsed=new Date((/^\d{4}-\d{2}-\d{2}$/.test(value||"")?value:"2027-07-01")+"T12:00:00Z");
  return new Date(Date.UTC(parsed.getUTCFullYear(),parsed.getUTCMonth(),1,12));
};
const iso=date=>date.toISOString().slice(0,10);
const weekdays=["L","M","M","J","V","S","D"];
export function StudioCalendar({label,value,onChange,multiple=false,min="",max="",help=""}){
  const selected=multiple?(Array.isArray(value)?value:[]):[value].filter(Boolean);
  const [month,setMonth]=useState(()=>asMonth(selected[0]||min||"2027-07-01"));
  useEffect(()=>setMonth(asMonth(selected[0]||min||"2027-07-01")), [min,max,multiple]);
  const firstDay=(month.getUTCDay()+6)%7;
  const maxDay=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0,12)).getUTCDate();
  const cells=[...Array(firstDay).fill(null),...Array.from({length:maxDay},(_,i)=>i+1)];
  const monthName=new Intl.DateTimeFormat("es-MX",{month:"long",year:"numeric",timeZone:"UTC"}).format(month);
  const shift=offset=>setMonth(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+offset,1,12)));
  const choose=day=>{
    const date=iso(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),day,12)));
    if(multiple)onChange(selected.includes(date)?selected.filter(x=>x!==date):[...selected,date].sort());
    else onChange(date);
  };
  const previous=iso(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()-1,1,12)));
  const next=iso(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0,12)));
  return <div className="es-field">
    <span className="es-label">{label}</span>
    <div className="es-calendar" aria-label={label}>
      <div className="es-calendar-header">
        <button type="button" onClick={()=>shift(-1)} disabled={Boolean(min&&previous<min.slice(0,7)+"-01")}
          aria-label="Mes anterior"><CaretLeft size={19}/></button>
        <strong><CalendarBlank size={17}/>{monthName}</strong>
        <button type="button" onClick={()=>shift(1)} disabled={Boolean(max&&next>max)}
          aria-label="Mes siguiente"><CaretRight size={19}/></button>
      </div>
      <div className="es-calendar-grid">
        {weekdays.map((d,i)=><span key={i} className="es-weekday">{d}</span>)}
        {cells.map((day,i)=>{
          if(!day)return <span key={"blank"+i}/>;
          const date=iso(new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth(),day,12)));
          const available=(!min||date>=min)&&(!max||date<=max);
          const checked=selected.includes(date);
          return <button type="button" key={date} disabled={!available}
            className={checked?"is-selected":""} aria-pressed={checked} aria-label={date}
            onClick={()=>choose(day)}>{day}</button>;
        })}
      </div>
      {selected.length>0&&<div className="es-calendar-selected">
        {multiple?<span>{selected.length} {selected.length===1?"día seleccionado":"días seleccionados"}</span>:
          <span>{selected[0]}</span>}
        <button type="button" onClick={()=>onChange(multiple?[]:"")}>Limpiar</button>
      </div>}
    </div>
    {help&&<span className="es-help">{help}</span>}
  </div>;
}
export function StudioConfirmation({title,body,onCancel,onConfirm,confirmLabel="Eliminar"}){
  useEffect(()=>{const key=e=>{if(e.key==="Escape")onCancel();};document.addEventListener("keydown",key);
    return()=>document.removeEventListener("keydown",key);},[onCancel]);
  return <div className="es-confirm-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onCancel();}}>
    <div role="alertdialog" aria-modal="true" aria-label={title} className="es-confirm">
      <h3>{title}</h3><p>{body}</p>
      <div className="es-actions"><button type="button" onClick={onCancel}>Cancelar</button>
        <button type="button" className="es-danger" onClick={onConfirm}>{confirmLabel}</button></div>
    </div>
  </div>;
}
