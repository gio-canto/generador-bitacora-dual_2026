// Saludo del inicio según la hora local del dispositivo, no la hora del servidor.
// 05:00–11:59: mañana · 12:00–18:59: tarde · 19:00–04:59: noche.
export function greetingForHour(hour) {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function currentGreeting() {
  return greetingForHour(new Date().getHours());
}
