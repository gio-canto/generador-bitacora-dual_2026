import { canvasToJpeg, createPdfFromJpegs, downloadPdf } from "./delivery-report.js";
import { calculateDeliveryStatistics, genderLabels, percent } from "./statistics.js";
import { VERSION } from "../domain/records.js";

const W = 1240;
const H = 1754;
const C = {
  ink: "#172233", secondary: "#516175", muted: "#6d7c8e",
  blue: "#1265bd", lightBlue: "#70a9e7",
  teal: "#259f91", green: "#3f956e", amber: "#df9e3e",
  red: "#d86e71", slate: "#8997a9", purple: "#8f78ba",
  pink: "#d481a7", white: "#ffffff", paper: "#f3f5f8",
  border: "#e5e9ef", track: "#e9eff5",
};
const palette = [C.blue, C.teal, C.amber, C.red, C.purple, C.pink, C.slate];
const fmt = (value, digits = 0) => Number(value || 0).toLocaleString("es-MX", { maximumFractionDigits: digits });
const slug = value => String(value || "general").normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, "-")
  .replace(/^-|-$/g, "").toLowerCase().slice(0, 55) || "general";

function rect(ctx, x, y, w, h, radius = 18, color = C.white) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, Math.max(w, 0), Math.max(h, 0), radius);
  ctx.fill();
}
function label(ctx, value, x, y, size = 20, color = C.ink, weight = 400, maxWidth) {
  ctx.font = weight + " " + size + 'px -apple-system, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = color;
  if (maxWidth) ctx.fillText(String(value), x, y, maxWidth);
  else ctx.fillText(String(value), x, y);
}
function separator(ctx, x, y, w) {
  ctx.fillStyle = C.border;
  ctx.fillRect(x, y, w, 2);
}
function panel(ctx, x, y, w, h, title, subtitle = "") {
  rect(ctx, x, y, w, h, 24);
  label(ctx, title, x + 25, y + 44, 26, C.ink, 700, w - 50);
  if (subtitle) label(ctx, subtitle, x + 25, y + 71, 16, C.muted, 400, w - 50);
}
function kpi(ctx, x, y, w, title, value) {
  rect(ctx, x, y, w, 113, 20);
  label(ctx, value, x + 19, y + 59, 35, C.ink, 750, w - 38);
  label(ctx, title, x + 19, y + 91, 17, C.muted, 600, w - 38);
}
function empty(ctx, x, y, w, message = "Sin datos en el periodo") {
  label(ctx, message, x, y, 18, C.muted, 400, w);
}

function bars(ctx, items, { x, y, w, h, unit = "", maxRows = 6, colors = palette } = {}) {
  const rows = items.slice(0, maxRows);
  if (!rows.length || !rows.some(item => item.value > 0)) return empty(ctx, x, y + 40, w);
  const gap = Math.min(76, Math.max(47, h / rows.length));
  const max = Math.max(1, ...rows.map(item => item.value));
  rows.forEach((item, index) => {
    const at = y + index * gap;
    const v = Math.max(0, item.value);
    label(ctx, item.label, x, at + 18, 18, C.secondary, 500, w - 165);
    label(ctx, fmt(v, unit === " h" ? 1 : 0) + unit, x + w - 125, at + 18, 18, C.ink, 700, 122);
    rect(ctx, x, at + 29, w - 6, 12, 6, C.track);
    if (v) rect(ctx, x, at + 29, Math.max(3, (w - 6) * v / max), 12, 6, colors[index % colors.length]);
  });
}

function donut(ctx, items, { cx, cy, radius = 120, central = "", description = "" }) {
  const present = items.filter(item => Number(item.value) > 0);
  const total = present.reduce((sum, item) => sum + item.value, 0);
  ctx.lineWidth = 28;
  ctx.strokeStyle = C.track;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  if (total) {
    let position = -Math.PI / 2;
    present.forEach(item => {
      const angle = item.value / total * Math.PI * 2;
      ctx.strokeStyle = item.color;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, position, position + angle - Math.min(0.012, angle / 6));
      ctx.stroke();
      position += angle;
    });
  }
  const centerText = total ? central || fmt(total) : "—";
  ctx.textAlign = "center";
  label(ctx, centerText, cx, cy + 7, 38, C.ink, 750);
  label(ctx, description, cx, cy + 36, 16, C.muted, 500);
  ctx.textAlign = "left";
}
function legend(ctx, items, x, y, w, gap = 44, maxRows = 7) {
  items.slice(0, maxRows).forEach((item, i) => {
    const yy = y + gap * i;
    rect(ctx, x, yy - 12, 14, 14, 4, item.color);
    label(ctx, item.label, x + 25, yy, 17, C.secondary, 500, w - 115);
    label(ctx, fmt(item.value), x + w - 75, yy, 19, C.ink, 700, 72);
  });
}
function stacked(ctx, items, x, y, w, h = 21) {
  const total = items.reduce((a, i) => a + i.value, 0);
  rect(ctx, x, y, w, h, h / 2, C.track);
  if (!total) return;
  let used = 0;
  ctx.save();ctx.beginPath();ctx.roundRect(x, y, w, h, h / 2);ctx.clip();
  items.forEach(item => {
    if (!item.value) return;
    const width = w * item.value / total;
    ctx.fillStyle = item.color;
    ctx.fillRect(x + used, y, width, h);
    used += width;
  });
  ctx.restore();
}

function trend(ctx, points, { x, y, w, h, unit = "h" }) {
  const data = points.slice(-12);
  if (!data.length || data.every(v => !v.value)) return empty(ctx, x + 8, y + 70, w);
  const max = Math.max(1, ...data.map(p => p.value)) * 1.14;
  const chartBottom = y + h - 46;
  const chartTop = y + 34;
  const chartHeight = chartBottom - chartTop;
  for (let t = 0; t <= 4; t++) {
    const gy = chartBottom - t * chartHeight / 4;
    ctx.strokeStyle = C.border; ctx.lineWidth = 2;
    ctx.beginPath();ctx.moveTo(x + 56, gy);ctx.lineTo(x + w - 10, gy);ctx.stroke();
    label(ctx, fmt(max * t / 4, 1), x, gy + 6, 14, C.muted);
  }
  const usableWidth = w - 82;
  const coords = data.map((item, i) => ({
    x: x + 60 + (data.length === 1 ? usableWidth / 2 : i * usableWidth / (data.length - 1)),
    y: chartBottom - (item.value / max) * chartHeight,
    label: item.label,
  }));
  if (coords.length > 1) {
    ctx.lineWidth = 5;ctx.strokeStyle = C.blue;ctx.lineJoin = "round";ctx.lineCap = "round";
    ctx.beginPath();coords.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));ctx.stroke();
  }
  coords.forEach((p, i) => {
    ctx.fillStyle = C.white; ctx.beginPath();ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);ctx.fill();
    ctx.fillStyle = C.blue;ctx.beginPath();ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);ctx.fill();
    if (coords.length <= 7 || i % Math.ceil(coords.length / 6) === 0 || i === coords.length - 1) {
      ctx.textAlign = "center";
      label(ctx, p.label, p.x, chartBottom + 28, 14, C.muted, 500, coords.length > 7 ? 95 : 120);
      ctx.textAlign = "left";
    }
  });
  label(ctx, unit, x + 9, y + 20, 14, C.muted, 500);
}

function columns(ctx, points, { x, y, w, h, colors = palette }) {
  const max = Math.max(1, ...points.map(p => p.value));
  const baseline = y + h - 52;
  const plotHeight = h - 105;
  const slot = w / Math.max(points.length, 1);
  if (!points.some(p => p.value)) return empty(ctx, x, y + 60, w);
  points.forEach((p, i) => {
    const pw = Math.min(66, slot * 0.55);
    const xx = x + slot * i + (slot - pw) / 2;
    const ph = p.value / max * plotHeight;
    rect(ctx, xx, baseline - ph, pw, ph, 8, colors[i % colors.length]);
    ctx.textAlign = "center";
    label(ctx, fmt(p.value, 1), xx + pw / 2, baseline - ph - 12, 17, C.ink, 700);
    label(ctx, p.label, xx + pw / 2, baseline + 28, 16, C.muted, 500, slot - 4);
    ctx.textAlign = "left";
  });
}

function gauges(ctx, items, { x, y, w, h }) {
  const cols = 2;
  const cw = w / cols;
  const rh = h / 2;
  items.forEach((item, index) => {
    const left = x + (index % cols) * cw;
    const top = y + Math.floor(index / cols) * rh;
    const cx = left + 110;
    const cy = top + rh / 2;
    const pct = Math.min(100, Math.max(0, item.value));
    ctx.lineWidth = 18;
    ctx.strokeStyle = C.track;ctx.beginPath();ctx.arc(cx, cy, 66, 0, 2 * Math.PI);ctx.stroke();
    ctx.strokeStyle = item.color;
    ctx.lineCap = "round";
    ctx.beginPath();ctx.arc(cx, cy, 66, -Math.PI / 2, -Math.PI / 2 + pct / 100 * 2 * Math.PI);ctx.stroke();
    ctx.lineCap = "butt";
    ctx.textAlign = "center";
    label(ctx, fmt(pct) + "%", cx, cy + 10, 29, C.ink, 700);
    ctx.textAlign = "left";
    label(ctx, item.label, left + 203, cy + 7, 18, C.secondary, 600, cw - 225);
  });
}

async function loadLogo() {
  if (typeof Image === "undefined" || typeof document === "undefined")
    throw new Error("No se pudo cargar el logotipo del sistema.");
  const urls = [
    new URL("../Assets/Asset_logo.png", document.baseURI).href,
    new URL("Assets/Asset_logo.png", document.baseURI).href,
  ];
  for (const url of urls) {
    try {
      const image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("No se encontró el logotipo."));
        element.src = url;
      });
      if ((image.naturalWidth || image.width) > 0) return image;
    } catch { /* Reintento con otra ruta local. */ }
  }
  throw new Error("No se pudo cargar el logotipo oficial. Comprueba los archivos sin conexión.");
}
function pageBase(report, pageNumber, logo) {
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = C.paper;ctx.fillRect(0, 0, W, H);
  rect(ctx, 42, 34, W - 84, 98, 24);
  const naturalW = logo.naturalWidth || logo.width;
  const naturalH = logo.naturalHeight || logo.height;
  const scale = Math.min(245 / naturalW, 74 / naturalH);
  const rw = naturalW * scale, rh = naturalH * scale;
  ctx.drawImage(logo, 63, 48 + (69 - rh) / 2, rw, rh);
  label(ctx, "GENERADOR DE BITÁCORA DUAL", 329, 93, 24, C.ink, 700, 620);
  label(ctx, "ESTADÍSTICAS", W - 208, 89, 17, C.muted, 700);
  label(ctx, "Reporte estadístico", 54, 207, 47, C.ink, 750);
  label(ctx, report.school, 54, 248, 21, C.secondary, 600, 1130);
  label(ctx, report.scope, 54, 284, 18, C.muted, 450, 1130);
  separator(ctx, 54, 317, W - 108);
  separator(ctx, 54, 1658, W - 108);
  label(ctx, "GENERACIÓN  " + report.generation, 54, 1694, 16, C.muted, 600, 550);
  label(ctx, "Emitido " + report.date + "  ·  " + pageNumber + "/3  ·  " + VERSION,
    W - 435, 1694, 15, C.muted, 500, 430);
  return { ctx, canvas };
}

export function statisticsReportModel(state, filters = {}) {
  const data = calculateDeliveryStatistics(state, filters);
  const scope = [
    filters.period === "weekly" ? data.weeks[0]?.label || "Semana sin seleccionar" :
    filters.period === "monthly" ? filters.month || "Mes" : "Histórico general",
    filters.specialty, filters.company,
  ].filter(Boolean).join(" · ");
  return {
    data, scope,
    school: state.context?.school || "Registro de entrega",
    generation: state.context?.generation || "No especificada",
    date: new Date().toLocaleDateString("es-MX", {day:"2-digit", month:"long", year:"numeric"}),
  };
}

export async function generateStatisticsReportPdf(state, filters = {}, options = {}) {
  const report = statisticsReportModel(state, filters);
  const r = report.data;
  if (!r.weeks.length) throw new Error("Selecciona un periodo con semanas registradas.");
  // Un solo logotipo por reporte: se incorpora en las tres páginas.
  const logo = options.logoImage || await loadLogo();
  const images = [];
  const deliveryItems = [
    {label:"A tiempo",value:r.delivered,color:C.blue},
    {label:"A destiempo",value:r.late,color:C.amber},
    {label:"No entregadas",value:r.notDelivered,color:C.red},
    {label:"No aplica",value:r.notApplicable,color:C.slate},
  ];
  const attendanceItems = [
    {label:"Con labores",value:r.daily.laboral,color:C.blue},
    {label:"Faltas",value:r.daily.falta,color:C.red},
    {label:"Sin labores",value:r.daily.sin_labores,color:C.amber},
    {label:"Días inhábiles",value:r.daily.inhabil,color:C.slate},
  ];
  const usageItems = [
    {label:"Generador",value:r.usage.used,color:C.blue},
    {label:"Otro método",value:r.usage.other,color:C.teal},
    {label:"Sin información",value:r.usage.unknown,color:C.slate},
  ];
  const genders = Object.entries(r.genderCounts)
    .map(([key,value],i)=>({label:genderLabels[key] || "Sin dato",value,color:palette[i % palette.length]}))
    .filter(g=>g.value>0);

  // Página 1: actividad y distribución de entregas.
  {
    const {ctx,canvas}=pageBase(report,1,logo);
    const cardW=(1132 - 42)/4;
    [
      ["Alumnos activos",fmt(r.students.length)],
      ["Horas realizadas",fmt(r.totalMinutes/60,1)+" h"],
      ["Faltas",fmt(r.daily.falta)],
      ["Utilización",percent(r.usage.used,r.students.length)+"%"],
    ].forEach(([name,value],i)=>kpi(ctx,54+i*(cardW+14),344,cardW,name,value));
    panel(ctx,54,479,551,495,"Estado de entregas","Total del periodo");
    bars(ctx,deliveryItems,{x:83,y:589,w:488,h:345,maxRows:4,
      colors:[C.blue,C.amber,C.red,C.slate]});
    panel(ctx,623,479,563,495,"Uso del generador","Alumnos activos");
    donut(ctx,usageItems,{cx:792,cy:716,radius:111,
      central:percent(r.usage.used,r.students.length)+"%",description:"uso identificado"});
    legend(ctx,usageItems,938,641,220,60,3);
    panel(ctx,54,993,551,605,"Tipo de jornada","Jornadas con datos");
    donut(ctx,attendanceItems,{cx:269,cy:1210,radius:117,
      central:fmt(r.daily.laboral+r.daily.falta+r.daily.sin_labores+r.daily.inhabil),
      description:"jornadas"});
    legend(ctx,attendanceItems,102,1431,455,34,4);
    panel(ctx,623,993,563,605,"Evolución de horas",
      filters.period==="weekly"?"Martes a viernes":"Últimas semanas");
    const series=filters.period==="weekly"?
      ["Mar","Mié","Jue","Vie"].map((label,i)=>({label,value:r.dayTrend[i]/60})):
      r.trend.map((v,i)=>({label:String(i+1),value:v.minutes/60}));
    trend(ctx,series,{x:650,y:1120,w:500,h:412});
    images.push(canvasToJpeg(canvas));
  }

  // Página 2: razones, distribución por género y jornadas de la semana.
  {
    const {ctx,canvas}=pageBase(report,2,logo);
    panel(ctx,54,345,551,542,"Motivos de falta","Causas registradas");
    bars(ctx,r.causesAbsence.map(e=>({label:e.label,value:e.count})),
      {x:81,y:451,w:496,h:396,maxRows:6});
    panel(ctx,623,345,563,542,"Días sin labores","Causas registradas");
    bars(ctx,r.causesNonWorking.map(e=>({label:e.label,value:e.count})),
      {x:650,y:451,w:506,h:396,maxRows:6});
    panel(ctx,54,906,551,692,"Distribución por género","Alumnos activos");
    donut(ctx,genders,{cx:274,cy:1141,radius:122,
      central:fmt(r.students.length),description:"alumnos"});
    legend(ctx,genders,92,1373,470,35,6);
    panel(ctx,623,906,563,692,"Horas por día","Jornadas de martes a viernes");
    columns(ctx,["Mar","Mié","Jue","Vie"].map((label,i)=>({
      label,value:Number((r.dayTrend[i]/60).toFixed(1))
    })),{x:669,y:1098,w:460,h:423,colors:[C.blue,C.lightBlue,C.teal,C.purple]});
    images.push(canvasToJpeg(canvas));
  }

  // Página 3: comparativas y porcentaje de cumplimiento.
  {
    const {ctx,canvas}=pageBase(report,3,logo);
    panel(ctx,54,345,551,553,"Horas por especialidad","Totales del periodo");
    bars(ctx,r.bySpecialty.map(e=>({label:e.label,value:e.minutes/60})),{
      x:82,y:453,w:492,h:407,unit:" h",maxRows:6});
    panel(ctx,623,345,563,553,"Horas por empresa","Totales del periodo");
    bars(ctx,r.byCompany.map(e=>({label:e.label,value:e.minutes/60})),{
      x:650,y:453,w:505,h:407,unit:" h",maxRows:6});
    panel(ctx,54,916,1132,682,"Indicadores del periodo","Porcentaje de registros aplicables");
    gauges(ctx,[
      {label:"Cumplimiento\nde entrega",value:r.deliveryRate,color:C.blue},
      {label:"Puntualidad\nde entrega",value:r.onTimeRate,color:C.teal},
      {label:"Asistencia",value:r.attendanceRate,color:C.green},
      {label:"Cobertura estadística",value:r.coverage,color:C.purple},
    ],{x:93,y:1035,w:1054,h:495});
    label(ctx,"Promedio de horas por bitácora con datos: "+fmt(r.avgHours,1)+" h",82,1559,18,C.secondary,600);
    images.push(canvasToJpeg(canvas));
  }

  const filename="estadisticas-dual-"+slug(report.generation)+"-"+slug(report.scope)+"-"+
    new Date().toISOString().slice(0,10)+".pdf";
  downloadPdf(createPdfFromJpegs(images),filename);
  return {filename,pages:images.length};
}
