import absenceReasons from "../data/absence-reasons.json";
import nonWorkingReasons from "../data/non-working-reasons.json";

const catalogs = { falta:absenceReasons, sin_labores:nonWorkingReasons };
export const REVIEW_DAYS = ["Martes","Miércoles","Jueves","Viernes"];
export const reasonsForReview = status => catalogs[status] || [];

export function pendingReasonReviews(state) {
  const students = new Map((state?.students || []).map(student=>[student.id, student]));
  const pending = [];
  for (const week of state?.weeks || []) {
    for (const [studentId, delivery] of Object.entries(week.deliveries || {})) {
      if (!students.has(studentId)) continue;
      if (!Array.isArray(delivery?.statistics?.entries)) continue;
      delivery.statistics.entries.forEach((day, dayIndex) => {
        if (!catalogs[day.status] || day.reasonCode !== 63 ||
            day.reasonReview === "kept") return;
        pending.push({
          key:week.id + ":" + studentId + ":" + dayIndex,
          weekId:week.id, studentId, dayIndex,
          student:students.get(studentId)?.name || "Alumno",
          week:week.label, status:day.status,
          day:REVIEW_DAYS[dayIndex] || "Jornada " + (dayIndex + 1),
        });
      });
    }
  }
  return pending;
}

export function decideReasonReview(state, {weekId, studentId, dayIndex, code}) {
  const nextCode = Number(code);
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 3 ||
      !Number.isInteger(nextCode) || (nextCode !== 63 && nextCode <= 0))
    throw new Error("Selecciona un motivo válido.");
  const week = state.weeks.find(item=>item.id === weekId);
  const delivery = week?.deliveries?.[studentId];
  const day = delivery?.statistics?.entries?.[dayIndex];
  if (!day || !catalogs[day.status] || day.reasonCode !== 63 ||
      day.reasonReview === "kept") throw new Error("El aviso ya no está pendiente.");
  const selected = catalogs[day.status].find(item=>item.code === nextCode);
  if (nextCode !== 63 && !selected) throw new Error("El motivo no existe en el catálogo.");
  const updated = {
    ...day, reasonCode:nextCode, reasonId:selected?.id || "",
    reasonReview:nextCode === 63 ? "kept" : "classified",
    reasonReviewedAt:new Date().toISOString(),
  };
  return {
    ...state,
    weeks:state.weeks.map(item=>item.id !== weekId ? item : {
      ...item, deliveries:{
        ...item.deliveries,
        [studentId]:{
          ...delivery, statistics:{
            ...delivery.statistics,
            entries:delivery.statistics.entries.map((entry,index)=>
              index === dayIndex ? updated : entry),
          },
        },
      },
    }),
  };
}
