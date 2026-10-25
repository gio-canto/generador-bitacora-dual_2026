/**
 * Índice interno de seguimiento de entregas (0-100).
 * No es un puntaje crediticio, disciplinario ni de aptitud personal.
 * Nunca considera faltas, motivos de salud, jornadas inhábiles o sin labores.
 */
export const DUAL_SCORE_NOTICE =
  "Uso escolar interno: indicador orientativo de entregas; no es puntaje de crédito ni una sanción.";

/**
 * Componentes ponderados del gráfico 0–100. Cada segmento ocupa los puntos
 * que realmente aporta al índice, no una categoría de riesgo disciplinario.
 * Un resultado sin plazos evaluables no dibuja barras con valor cero.
 */
export function dualScoreGraphParts(score){
  if(score?.value==null||!score.components)return [];
  const {compliance,punctuality,regularity}=score.components;
  return [
    {key:"compliance",label:"Cumplimiento",points:clamp(compliance)*.5,color:"#1d6096"},
    {key:"punctuality",label:"Puntualidad",points:clamp(punctuality)*.3,color:"#2d8f96"},
    {key:"regularity",label:"Regularidad",points:clamp(regularity)*.2,color:"#c59447"},
  ];
}

const clamp=n=>Math.max(0,Math.min(100,n));
const received=w=>w.status==="entregado"||w.status==="entregado_tarde";
const rounded=n=>Math.round(clamp(n));
export function calculateDualScore(dossier){
  const dueRows=(dossier?.timeline||[]).filter(w=>w.expired&&w.status!=="no_aplica");
  const due=dueRows.length;
  if(!due)return {
    value:null,label:"Sin evaluación",provisional:true,due:0,
    interpretation:"Todavía no existen semanas vencidas evaluables. No se asigna una puntuación. "+DUAL_SCORE_NOTICE,
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
      improvement+" "+DUAL_SCORE_NOTICE,
  };
}
