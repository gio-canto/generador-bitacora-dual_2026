/** Short source-backed explanations shared by the page and the PDF. */
const count=n=>Number(n||0).toLocaleString("es-MX");
export function interpretStatistics(data,insights){
 const applicable=Number(data.applicable||0);
 const delivered=Number(data.delivered||0);
 const late=Number(data.late||0);
 const worked=Number(data.daily?.laboral||0);
 const absent=Number(data.daily?.falta||0);
 const expected=insights?.totalDue||0;
 return {
   deliveries:applicable
     ? count(delivered+late)+" de "+count(applicable)+" registros aplicables se entregaron."
     : "No hay entregas aplicables para comparar.",
   punctuality:applicable
     ? count(delivered)+" entregas puntuales y "+count(late)+" tardías."
     : "Aún no hay entregas para evaluar.",
   attendance:worked+absent
     ? count(worked)+" jornadas con labores y "+count(absent)+" faltas."
     : "No hay jornadas de asistencia registradas.",
   hours:data.weeksWithStatistics
     ? Number((Number(data.totalMinutes||0)/60).toFixed(1)).toLocaleString("es-MX")+" horas en "+count(data.weeksWithStatistics)+" registros con jornadas."
     : "Todavía no hay horas registradas.",
   pending:expected
     ? count(insights?.totalPending||0)+" de "+count(expected)+" entregas vencidas siguen pendientes."
     : "No hay semanas vencidas para este periodo.",
   causes:absent
     ? count(absent)+" faltas registradas. Consulta las causas antes de evaluarlas."
     : "No se registraron faltas en las jornadas conocidas.",
 };
}
