import absenceReasons from "../data/absence-reasons.json";
import nonWorkingReasons from "../data/non-working-reasons.json";

const VALID = ["laboral", "falta", "sin_labores", "inhabil"];
export const MANUAL_DAYS = ["Martes", "Miércoles", "Jueves", "Viernes"];
export const blankManualDays = () => MANUAL_DAYS.map(() => ({ status: "", hours: "", reasonCode: "0" }));
export const manualDaysFromStatistics = statistics =>
  statistics?.entries?.length === 4
    ? statistics.entries.map(day=>({
      status:day.status,
      hours: day.status === "laboral" ? String(day.minutes / 60) : "",
      reasonCode: String(day.reasonCode || 0),
    }))
    : blankManualDays();

export const reasonsForStatus = status =>
  status === "falta" ? absenceReasons :
  status === "sin_labores" ? nonWorkingReasons : [];

export function buildManualStatistics(days) {
  if (!Array.isArray(days) || days.length !== 4) throw Error("Se requieren cuatro jornadas.");
  if (days.every(day=>!day.status)) return null;
  if (days.some(day=>!VALID.includes(day.status)))
    throw Error("Completa los estados de martes a viernes o déjalos todos vacíos.");
  const entries = days.map((day,index)=>{
    const status=day.status;
    let minutes=0,reasonCode=0;
    if (status === "laboral") {
      const hours=Number(day.hours);
      if (String(day.hours??"").trim() === "" || !Number.isFinite(hours) || hours<=0 || hours>24 || Math.abs(hours*60-Math.round(hours*60))>1e-6)
        throw Error("Revisa las horas de " + MANUAL_DAYS[index].toLowerCase() + ".");
      minutes=Math.round(hours*60);
    } else if (status === "falta" || status === "sin_labores") {
      reasonCode=Number(day.reasonCode);
      if (!Number.isInteger(reasonCode) || reasonCode < 0 || reasonCode > 63 ||
        (reasonCode!==0 && reasonCode!==63 && !reasonsForStatus(status).some(reason=>reason.code===reasonCode)))
        throw Error("Revisa la causa de " + MANUAL_DAYS[index].toLowerCase() + ".");
    }
    return {status,minutes,reasonCode,reasonId: reasonsForStatus(status).find(r=>r.code===reasonCode)?.id || ""};
  });
  return {version:5,entries};
}
