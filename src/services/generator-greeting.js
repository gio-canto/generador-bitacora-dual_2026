// Use the visitor's device-local time, not a fixed server or build time.
// The night message intentionally applies from 01:00 through 04:59.
export function getGeneratorGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 1 && hour < 5) {
    return {
      title: "¿Qué haces aquí? ¡Duérmete!",
      subtitle: "Tu bitácora puede esperar. Descansa y continúa cuando quieras.",
      kind: "sleep",
    };
  }
  if (hour >= 5 && hour < 12) {
    return {
      title: "Buenos días",
      subtitle: "Continúa donde te quedaste o comienza una nueva bitácora semanal.",
      kind: "morning",
    };
  }
  if (hour >= 12 && hour < 19) {
    return {
      title: "Buenas tardes",
      subtitle: "Continúa donde te quedaste o comienza una nueva bitácora semanal.",
      kind: "afternoon",
    };
  }
  return {
    title: "Buenas noches",
    subtitle: "Continúa donde te quedaste o comienza una nueva bitácora semanal.",
    kind: "evening",
  };
}
