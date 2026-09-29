import { blobatarUri } from "blobatar/uri";
import { VERSION } from "../domain/records.js";
import { deliveryStatus, weekSummary } from "./delivery-registry.js";

const PAGE_W = 1240;
const PAGE_H = 1754;
const PDF_W = 595.28;
const PDF_H = 841.89;

const COLORS = {
  ink: "#16202a",
  muted: "#66717d",
  line: "#d9dee5",
  paper: "#ffffff",
  soft: "#f4f6f8",
  blue: "#1f5f91",
  blueSoft: "#eaf1f7",
  green: "#267447",
  greenSoft: "#eaf4ee",
  amber: "#8a5a00",
  amberSoft: "#fbf2dc",
  red: "#a13a32",
  redSoft: "#f9e9e7",
};

const STATUS_META = {
  entregado: {
    label: "Entregado a tiempo",
    color: COLORS.green,
    background: COLORS.greenSoft,
    order: 0,
  },
  entregado_tarde: {
    label: "Entregado a destiempo",
    color: COLORS.amber,
    background: COLORS.amberSoft,
    order: 1,
  },
  no_entregado: {
    label: "No entregado",
    color: COLORS.red,
    background: COLORS.redSoft,
    order: 2,
  },
};

const clean = (value, max = 240) =>
  String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(value + "T12:00:00")
    : new Date(value);
  if (!Number.isFinite(+date)) return clean(value);
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (!Number.isFinite(+date)) return "Sin registro";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPeriod(week) {
  if (!week?.startDate && !week?.endDate) return "Sin periodo";
  if (!week?.endDate || week.startDate === week.endDate)
    return formatDate(week.startDate || week.endDate);
  return formatDate(week.startDate) + " - " + formatDate(week.endDate);
}

function sourceLabel(source) {
  if (source === "camera") return "Cámara";
  if (source === "import") return "Importado";
  if (source === "manual") return "Manual";
  return "";
}

function slug(value) {
  return clean(value || "reporte", 90)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function buildDeliveryReportModel(
  state,
  { mode = "simple", weekId = "", createdAt = new Date().toISOString() } = {},
) {
  const students = Array.isArray(state?.students) ? state.students : [];
  const allWeeks = Array.isArray(state?.weeks) ? state.weeks : [];
  const selected =
    allWeeks.find((week) => week.id === weekId) || allWeeks.at(-1) || null;
  const weeks =
    mode === "weekly"
      ? [...allWeeks].sort((a, b) =>
          String(a.startDate || a.createdAt || "").localeCompare(
            String(b.startDate || b.createdAt || ""),
          ),
        )
      : selected
        ? [selected]
        : [];

  const mappedWeeks = weeks.map((week) => {
    const rows = students
      .map((student) => {
        const status = deliveryStatus(week, student.id);
        const delivery = week.deliveries?.[student.id];
        return {
          id: student.id,
          name: clean(student.name, 180),
          specialty: clean(student.specialty, 120),
          company: clean(student.company, 220),
          status,
          statusLabel: STATUS_META[status].label,
          registeredAt: delivery?.registeredAt || "",
          source: sourceLabel(delivery?.source),
        };
      })
      .sort((a, b) => {
        const statusOrder =
          STATUS_META[a.status].order - STATUS_META[b.status].order;
        return (
          statusOrder ||
          a.name.localeCompare(b.name, "es", { sensitivity: "base" })
        );
      });

    return {
      id: week.id,
      label: clean(week.label, 100) || "Semana",
      startDate: week.startDate || "",
      endDate: week.endDate || "",
      dueAt: week.dueAt || "",
      closedAt: week.closedAt || "",
      period: formatPeriod(week),
      summary: weekSummary(week, students),
      rows,
    };
  });

  return {
    kind: "delivery-report",
    mode: mode === "weekly" ? "weekly" : "simple",
    createdAt,
    school: clean(state?.context?.school, 220) || "Plantel no especificado",
    generation:
      clean(state?.context?.generation, 100) || "No especificada",
    students: students.length,
    weeks: mappedWeeks,
  };
}

function roundedRect(ctx, x, y, w, h, r, fill, stroke = "") {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    ctx.lineTo(x + radius, y + h);
    ctx.arcTo(x, y + h, x, y + h - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function trimToWidth(ctx, value, width) {
  const text = clean(value, 260);
  if (ctx.measureText(text).width <= width) return text;
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const test = text.slice(0, mid) + "…";
    if (ctx.measureText(test).width <= width) low = mid;
    else high = mid - 1;
  }
  return text.slice(0, low) + "…";
}

function drawLabelValue(ctx, label, value, x, y, width) {
  ctx.fillStyle = COLORS.muted;
  ctx.font = "700 18px Arial, Helvetica, sans-serif";
  ctx.fillText(label.toUpperCase(), x, y);
  ctx.fillStyle = COLORS.ink;
  ctx.font = "600 24px Arial, Helvetica, sans-serif";
  ctx.fillText(trimToWidth(ctx, value, width), x, y + 31);
}

function drawSummary(ctx, summary, x, y, width) {
  const gap = 14;
  const cardW = (width - gap * 2) / 3;
  const entries = [
    ["A tiempo", summary.entregado, COLORS.green, COLORS.greenSoft],
    ["A destiempo", summary.entregado_tarde, COLORS.amber, COLORS.amberSoft],
    ["No entregado", summary.no_entregado, COLORS.red, COLORS.redSoft],
  ];
  entries.forEach(([label, number, color, background], index) => {
    const cx = x + index * (cardW + gap);
    roundedRect(ctx, cx, y, cardW, 82, 14, background);
    ctx.fillStyle = color;
    ctx.font = "800 31px Arial, Helvetica, sans-serif";
    ctx.fillText(String(number), cx + 18, y + 36);
    ctx.font = "700 17px Arial, Helvetica, sans-serif";
    ctx.fillText(label, cx + 18, y + 62);
  });
}

const avatarCache = new Map();

async function loadAvatar(name) {
  const key = clean(name, 180) || "Alumno";
  if (avatarCache.has(key)) return avatarCache.get(key);
  const promise = new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = blobatarUri(key, {
      size: 80,
      background: "circle",
    });
  });
  avatarCache.set(key, promise);
  return promise;
}

function initials(name) {
  return clean(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

async function drawStudentRow(ctx, row, x, y, width) {
  const meta = STATUS_META[row.status] || STATUS_META.no_entregado;
  const avatar = await loadAvatar(row.name);

  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 72);
  ctx.lineTo(x + width, y + 72);
  ctx.stroke();

  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 28, y + 33, 24, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, x + 4, y + 9, 48, 48);
    ctx.restore();
  } else {
    ctx.fillStyle = COLORS.blueSoft;
    ctx.beginPath();
    ctx.arc(x + 28, y + 33, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.blue;
    ctx.font = "800 15px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(initials(row.name), x + 28, y + 39);
    ctx.textAlign = "left";
  }

  const mainX = x + 68;
  const statusW = 250;
  const mainW = width - 68 - statusW - 18;
  ctx.fillStyle = COLORS.ink;
  ctx.font = "700 20px Arial, Helvetica, sans-serif";
  ctx.fillText(trimToWidth(ctx, row.name, mainW), mainX, y + 28);

  ctx.fillStyle = COLORS.muted;
  ctx.font = "500 15px Arial, Helvetica, sans-serif";
  const detail = [row.specialty, row.company].filter(Boolean).join(" · ");
  ctx.fillText(trimToWidth(ctx, detail || "Sin datos", mainW), mainX, y + 52);

  const badgeX = x + width - statusW;
  roundedRect(ctx, badgeX, y + 11, statusW, 28, 14, meta.background);
  ctx.fillStyle = meta.color;
  ctx.font = "700 14px Arial, Helvetica, sans-serif";
  ctx.fillText(meta.label, badgeX + 12, y + 30);

  ctx.fillStyle = COLORS.muted;
  ctx.font = "500 13px Arial, Helvetica, sans-serif";
  const receipt =
    row.status === "no_entregado"
      ? "Sin registro"
      : formatDateTime(row.registeredAt) +
        (row.source ? " · " + row.source : "");
  ctx.fillText(trimToWidth(ctx, receipt, statusW), badgeX, y + 59);
}

function buildPageSpecs(model) {
  const specs = [];
  const rowsPerPage = model.mode === "weekly" ? 14 : 15;
  for (const week of model.weeks) {
    const chunks = [];
    for (let index = 0; index < week.rows.length; index += rowsPerPage)
      chunks.push(week.rows.slice(index, index + rowsPerPage));
    if (!chunks.length) chunks.push([]);
    chunks.forEach((rows, chunkIndex) => {
      specs.push({
        week,
        rows,
        continuation: chunkIndex > 0,
      });
    });
  }
  return specs;
}

async function renderReportPage(model, spec, pageNumber, pageCount) {
  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W;
  canvas.height = PAGE_H;
  const ctx = canvas.getContext("2d", { alpha: false });

  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  const left = 72;
  const right = PAGE_W - 72;
  const width = right - left;

  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(left, 62, 9, 92);

  ctx.fillStyle = COLORS.blue;
  ctx.font = "800 19px Arial, Helvetica, sans-serif";
  ctx.fillText("REPORTE DE ENTREGAS", left + 26, 82);

  ctx.fillStyle = COLORS.ink;
  ctx.font = "800 34px Arial, Helvetica, sans-serif";
  ctx.fillText(trimToWidth(ctx, model.school, 720), left + 26, 123);

  ctx.fillStyle = COLORS.muted;
  ctx.font = "600 18px Arial, Helvetica, sans-serif";
  ctx.fillText(
    "Generación dual: " + model.generation,
    left + 26,
    151,
  );

  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.ink;
  ctx.font = "700 18px Arial, Helvetica, sans-serif";
  ctx.fillText("Bitácora Dual 2026", right, 86);
  ctx.fillStyle = COLORS.muted;
  ctx.font = "500 15px Arial, Helvetica, sans-serif";
  ctx.fillText("Creado: " + formatDateTime(model.createdAt), right, 113);
  ctx.fillText("Versión " + VERSION, right, 138);
  ctx.textAlign = "left";

  ctx.strokeStyle = COLORS.line;
  ctx.beginPath();
  ctx.moveTo(left, 181);
  ctx.lineTo(right, 181);
  ctx.stroke();

  drawLabelValue(
    ctx,
    "Tipo",
    model.mode === "weekly"
      ? "Reporte semana por semana"
      : "Listado simplificado",
    left,
    218,
    330,
  );
  drawLabelValue(ctx, "Semana", spec.week.label, 430, 218, 260);
  drawLabelValue(ctx, "Periodo", spec.week.period, 715, 218, 330);
  drawLabelValue(
    ctx,
    "Límite",
    formatDateTime(spec.week.dueAt),
    1010,
    218,
    160,
  );

  const sectionY = 286;
  roundedRect(ctx, left, sectionY, width, 74, 14, COLORS.soft);
  ctx.fillStyle = COLORS.ink;
  ctx.font = "800 23px Arial, Helvetica, sans-serif";
  ctx.fillText(
    spec.week.label + (spec.continuation ? " · continuación" : ""),
    left + 18,
    sectionY + 30,
  );
  ctx.fillStyle = COLORS.muted;
  ctx.font = "500 15px Arial, Helvetica, sans-serif";
  ctx.fillText(
    spec.week.period +
      (spec.week.closedAt ? " · Semana cerrada" : " · Semana abierta"),
    left + 18,
    sectionY + 55,
  );

  drawSummary(ctx, spec.week.summary, left, 378, width);

  const tableY = 486;
  ctx.fillStyle = COLORS.muted;
  ctx.font = "700 14px Arial, Helvetica, sans-serif";
  ctx.fillText("ALUMNO / ADSCRIPCIÓN", left + 68, tableY);
  ctx.textAlign = "right";
  ctx.fillText("ESTADO / REGISTRO", right, tableY);
  ctx.textAlign = "left";

  let y = tableY + 18;
  for (const row of spec.rows) {
    await drawStudentRow(ctx, row, left, y, width);
    y += 72;
  }

  if (!spec.rows.length) {
    roundedRect(ctx, left, y + 16, width, 100, 14, COLORS.soft);
    ctx.fillStyle = COLORS.muted;
    ctx.font = "600 20px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No hay alumnos en este reporte.", PAGE_W / 2, y + 74);
    ctx.textAlign = "left";
  }

  ctx.strokeStyle = COLORS.line;
  ctx.beginPath();
  ctx.moveTo(left, PAGE_H - 72);
  ctx.lineTo(right, PAGE_H - 72);
  ctx.stroke();

  ctx.fillStyle = COLORS.muted;
  ctx.font = "500 13px Arial, Helvetica, sans-serif";
  ctx.fillText(
    "Documento generado desde el Registro de entrega · " +
      model.students +
      " alumnos en la base",
    left,
    PAGE_H - 43,
  );
  ctx.textAlign = "right";
  ctx.fillText(
    "Página " + pageNumber + " de " + pageCount,
    right,
    PAGE_H - 43,
  );
  ctx.textAlign = "left";

  return canvas;
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++)
    bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function canvasToJpeg(canvas) {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  return {
    width: canvas.width,
    height: canvas.height,
    bytes: base64ToBytes(dataUrl.split(",")[1]),
  };
}

function ascii(value) {
  return new TextEncoder().encode(value);
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function createPdfFromJpegs(images) {
  const objectCount = 2 + images.length * 3;
  const objects = new Array(objectCount + 1);
  const pageRefs = [];

  objects[1] = [ascii("<< /Type /Catalog /Pages 2 0 R >>")];

  images.forEach((image, index) => {
    const imageId = 3 + index * 3;
    const contentId = imageId + 1;
    const pageId = imageId + 2;
    pageRefs.push(pageId + " 0 R");

    objects[imageId] = [
      ascii(
        "<< /Type /XObject /Subtype /Image /Width " +
          image.width +
          " /Height " +
          image.height +
          " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " +
          image.bytes.length +
          " >>\nstream\n",
      ),
      image.bytes,
      ascii("\nendstream"),
    ];

    const stream =
      "q\n" +
      PDF_W +
      " 0 0 " +
      PDF_H +
      " 0 0 cm\n/Im0 Do\nQ\n";
    objects[contentId] = [
      ascii(
        "<< /Length " +
          new TextEncoder().encode(stream).length +
          " >>\nstream\n" +
          stream +
          "endstream",
      ),
    ];

    objects[pageId] = [
      ascii(
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " +
          PDF_W +
          " " +
          PDF_H +
          "] /Resources << /XObject << /Im0 " +
          imageId +
          " 0 R >> >> /Contents " +
          contentId +
          " 0 R >>",
      ),
    ];
  });

  objects[2] = [
    ascii(
      "<< /Type /Pages /Count " +
        images.length +
        " /Kids [" +
        pageRefs.join(" ") +
        "] >>",
    ),
  ];

  const chunks = [ascii("%PDF-1.4\n% Delivery Report\n")];
  const offsets = new Array(objectCount + 1).fill(0);
  let position = chunks[0].length;

  for (let id = 1; id <= objectCount; id++) {
    offsets[id] = position;
    const parts = [
      ascii(id + " 0 obj\n"),
      ...(objects[id] || [ascii("<<>>")]),
      ascii("\nendobj\n"),
    ];
    chunks.push(...parts);
    position += parts.reduce((sum, part) => sum + part.length, 0);
  }

  const xrefPosition = position;
  let xref = "xref\n0 " + (objectCount + 1) + "\n";
  xref += "0000000000 65535 f \n";
  for (let id = 1; id <= objectCount; id++)
    xref += String(offsets[id]).padStart(10, "0") + " 00000 n \n";
  xref +=
    "trailer\n<< /Size " +
    (objectCount + 1) +
    " /Root 1 0 R >>\nstartxref\n" +
    xrefPosition +
    "\n%%EOF";

  chunks.push(ascii(xref));
  return concatBytes(chunks);
}

function downloadPdf(bytes, filename) {
  const url = URL.createObjectURL(
    new Blob([bytes], { type: "application/pdf" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function generateDeliveryReportPdf(
  state,
  { mode = "simple", weekId = "" } = {},
) {
  const model = buildDeliveryReportModel(state, { mode, weekId });
  if (!model.weeks.length)
    throw new Error("No hay semanas disponibles para generar el reporte.");

  const specs = buildPageSpecs(model);
  const images = [];
  for (let index = 0; index < specs.length; index++) {
    const canvas = await renderReportPage(
      model,
      specs[index],
      index + 1,
      specs.length,
    );
    images.push(canvasToJpeg(canvas));
  }

  const pdf = createPdfFromJpegs(images);
  const date = new Date(model.createdAt).toISOString().slice(0, 10);
  const scope =
    model.mode === "weekly"
      ? "semana-por-semana"
      : slug(model.weeks[0]?.label || "semana");
  const generation =
    model.generation === "No especificada"
      ? ""
      : "-" + slug(model.generation);
  const filename =
    "reporte-entregas-" + scope + generation + "-" + date + ".pdf";
  downloadPdf(pdf, filename);
  return { filename, pages: specs.length, model };
}
