/**
 * Índice interno de seguimiento de entregas (0-100).
 * No es un puntaje crediticio, disciplinario ni de aptitud personal.
 * Nunca considera faltas, motivos de salud, jornadas inhábiles o sin labores.
 */
const clamp=n=>Math.max(0,Math.min(100,n));
const received=w=>w.status==="entregado"||w.status==="entregado_tarde";
const rounded=n=>Math.round(clamp(n));
export function calculateDualScore(dossier){
  const dueRows=(dossier?.timeline||[]).filter(w=>w.expired&&w.status!=="no_aplica");
  const due=dueRows.length;
  if(!due)return {
    value:null,label:"Sin evaluación",provisional:true,due:0,
    interpretation:"Todavía no existen semanas vencidas evaluables. No se asigna una puntuación.",
    components:null,
  };
  const submitted=dueRows.filter(received).length;
  const onTime=dueRows.filter(w=>w.status==="entregado").length;
  // La regularidad se limita a los últimos cuatro plazos vencidos,
  // distintos del cumplimiento global. El historial ya viene ordenado
  // cronológicamente de más reciente a más antiguo.
  const recent=dueRows.slice(0,4);
  const compliance=rounded(submitted/due*100);
  const punctuality=rounded(onTime/due*100);
  const regularity=rounded(recent.filter(received).length/recent.length*100);
  const value=rounded(compliance*.5+punctuality*.3+regularity*.2);
  const provisional=due<4;
  const label=value>=85?"Seguimiento sólido":
    value>=70?"Seguimiento favorable":
    value>=50?"Seguimiento por reforzar":"Requiere atención en entregas";
  const opportunities=[];
  if(submitted<due)opportunities.push("regularizar "+(due-submitted)+" entrega"+(due-submitted===1?" vencida":"s vencidas"));
  if(onTime<submitted)opportunities.push("mejorar la puntualidad");
  const improvement=opportunities.length?" Conviene "+opportunities.join(" y ")+".":" No hay entregas vencidas pendientes.";
  return {
    value,label,provisional,due,
    components:{compliance,punctuality,regularity,recentDue:recent.length,
      delivered:submitted,onTime},
    interpretation:"Índice "+value+"/100"+(provisional?" (provisional)":"")+
      " calculado con "+due+" semanas vencidas evaluables. "+label+"."+
      improvement+" No equivale a evaluación crediticia ni sanción.",
  };
}
