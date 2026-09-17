import { validDate } from "../domain/records.js";
const COUNCIL =
  "Consejo de Ciencia, Tecnología e Innovación del Estado de Guerrero (COCYTIEG)";
const PAGE = { w: 297, h: 210 };
const layout = {
  logo: { x: 68.5, y: 5.5, w: 160, h: 18.75 },
  strip: { x: 62.5, y: 31, w: 172, h: 5.7 },
  programY: 48.4,
  bitacoraY: 58.4,
  metaY: [67, 73, 79],
  table: {
    x: 10.5,
    y: 84,
    w: 276,
    headH: 7,
    colRatio: [0.075, 0.47, 0.11, 0.345],
  },
  signatures: {
    x: 10.5,
    y: 159,
    w: 276,
    colRatio: [0.18, 0.34, 0.28, 0.2],
    lineY: 184.6,
  },
};
const sizes = {
  strip: 11.5,
  title: 20,
  meta: 13,
  tableHead: 11,
  activity: 9,
  other: 9.5,
  signatureHead: 9.5,
  name: 8.3,
  role: 7.7,
  note: 7.3,
};

const measureContext = document.createElement("canvas").getContext("2d"),
  ptToMm = (pt) => (pt * 25.4) / 72;
function fontCss(s, st = "normal") {
  const px = (s * 96) / 72,
    w = st.includes("bold") ? 700 : 400,
    it = st.includes("italic") ? "italic " : "";
  return `${it}${w} ${px}px "Times New Roman", Times, serif`;
}
function measureMm(t, s, st = "normal") {
  measureContext.font = fontCss(s, st);
  return (measureContext.measureText(t).width * 25.4) / 96;
}
function parseInline(text, on) {
  if (!on) return [{ text, style: "normal" }];
  const out = [];
  let i = 0;
  while (i < text.length) {
    if (text.startsWith("**", i) || text.startsWith("__", i)) {
      const tok = text.slice(i, i + 2),
        end = text.indexOf(tok, i + 2);
      if (end >= 0) {
        out.push({ text: text.slice(i + 2, end), style: "bold" });
        i = end + 2;
        continue;
      }
    }
    if (text[i] === "*" || text[i] === "_") {
      const tok = text[i],
        end = text.indexOf(tok, i + 1);
      if (end > i + 1) {
        out.push({ text: text.slice(i + 1, end), style: "italic" });
        i = end + 1;
        continue;
      }
    }
    let n = i + 1;
    while (
      n < text.length &&
      !text.startsWith("**", n) &&
      !text.startsWith("__", n) &&
      text[n] !== "*" &&
      text[n] !== "_"
    )
      n++;
    out.push({ text: text.slice(i, n), style: "normal" });
    i = n;
  }
  return out.filter((x) => x.text);
}
function wrapStyled(text, max, s, on = true) {
  const lines = [];
  String(text || "")
    .split("\n")
    .forEach((raw) => {
      if (!raw) {
        lines.push([]);
        return;
      }
      let c = raw,
        prefix = "";
      const b = raw.match(/^\s*[-•]\s+(.+)$/),
        num = raw.match(/^\s*(\d+[.)])\s+(.+)$/);
      if (b) {
        prefix = "• ";
        c = b[1];
      } else if (num) {
        prefix = num[1] + " ";
        c = num[2];
      }
      const seg = [
          ...(prefix ? [{ text: prefix, style: "normal" }] : []),
          ...parseInline(c, on),
        ],
        tokens = [];
      seg.forEach((x) =>
        x.text
          .split(/(\s+)/)
          .filter(Boolean)
          .forEach((t) => tokens.push({ text: t, style: x.style })),
      );
      let cur = [],
        w = 0;
      tokens
        .flatMap((t) => {
          if (measureMm(t.text, s, t.style) <= max) return [t];
          const parts = [];
          let part = "";
          for (const char of t.text) {
            if (part && measureMm(part + char, s, t.style) > max) {
              parts.push({ ...t, text: part });
              part = "";
            }
            part += char;
          }
          if (part) parts.push({ ...t, text: part });
          return parts;
        })
        .forEach((t) => {
          const tw = measureMm(t.text, s, t.style);
          if (w + tw <= max || !cur.length) {
            cur.push(t);
            w += tw;
          } else if (/^\s+$/.test(t.text)) {
            lines.push(cur);
            cur = [];
            w = 0;
          } else {
            lines.push(cur);
            cur = [{ ...t, text: t.text.trimStart() }];
            w = measureMm(cur[0].text, s, cur[0].style);
          }
        });
      if (cur.length) lines.push(cur);
    });
  return lines.length ? lines : [[]];
}
function wrapPlain(t, m, s, st = "normal") {
  return wrapStyled(t, m, s, false).map((line) =>
    line.map((x) => ({ ...x, style: st })),
  );
}
function formatDate(iso) {
  if (!validDate(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}
function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "p.m." : "a.m."}`;
}
function companySignatureName(company) {
  const value = String(company || "").trim(),
    m = value.match(/\(([^()]+)\)\s*$/);
  return (m?.[1] || value).trim();
}
function authoritySignatureRoles(role, company) {
  let lines = String(role || "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  if (company === COUNCIL)
    lines = lines.filter(
      (x) => !/^cocy?ti?e?g$/i.test(x.replace(/[^a-z]/gi, "")),
    );
  const companyName = companySignatureName(company);
  if (companyName) lines.push(companyName);
  return lines;
}
export function buildPageModel(record) {
  const entries = record.entries;
  const t = layout.table,
    widths = t.colRatio.map((r) => r * t.w),
    xs = [t.x];
  widths.forEach((w) => xs.push(xs.at(-1) + w));
  const bodyTop = t.y + t.headH,
    maxBottom = layout.signatures.y - 5,
    on = record.markdown !== false,
    rows = entries.map((e) => {
      const st = e.status || "laboral",
        special = st !== "laboral",
        label =
          st === "sin_labores"
            ? "SIN LABORES"
            : st === "inhabil"
              ? "DÍA INHÁBIL"
              : st === "falta"
                ? "FALTA"
                : "",
        dateLines = wrapPlain(
          formatDate(e.date),
          widths[0] - 2.6,
          sizes.other,
          "bold",
        ),
        activityLines = special
          ? [
              ...wrapPlain(label, widths[1] - 3.2, sizes.activity, "bold"),
              ...wrapStyled(e.activity, widths[1] - 3.2, sizes.activity, on),
            ]
          : wrapStyled(e.activity, widths[1] - 3.2, sizes.activity, on),
        timeLines = special
          ? wrapPlain("-", widths[2] - 2.6, sizes.other)
          : wrapPlain(
              formatTime(e.start) + " - " + formatTime(e.end),
              widths[2] - 2.6,
              sizes.other,
            ),
        areaLines = special
          ? wrapPlain("-", widths[3] - 3.2, sizes.other)
          : wrapPlain(e.area, widths[3] - 3.2, sizes.other),
        h = Math.max(
          10.5,
          dateLines.length * 3.65 + 3,
          activityLines.length * 3.38 + 3,
          timeLines.length * 3.65 + 3,
          areaLines.length * 3.65 + 3,
        );
      return {
        e,
        st,
        special,
        label,
        dateLines,
        activityLines,
        timeLines,
        areaLines,
        h,
      };
    }),
    bottom = bodyTop + rows.reduce((s, r) => s + r.h, 0);
  return {
    xs,
    widths,
    rows,
    bodyTop,
    bottom,
    maxBottom,
    fits: bottom <= maxBottom && signatureFits(record),
  };
}
const mm = (v, p) => v * p;
function setFont(c, s, st, p) {
  const px = ptToMm(s) * p,
    w = st.includes("bold") ? 700 : 400,
    it = st.includes("italic") ? "italic " : "";
  c.font = `${it}${w} ${px}px "Times New Roman", Times, serif`;
}
function drawText(c, t, x, y, s, st, a, col, p, maxWidth) {
  if (maxWidth)
    s = Math.min(s, (s * maxWidth) / Math.max(measureMm(t, s, st), 0.01));
  setFont(c, s, st, p);
  c.fillStyle = col || "#000";
  c.textAlign = a || "left";
  c.textBaseline = "alphabetic";
  c.fillText(t, mm(x, p), mm(y, p));
}
function line(c, x1, y1, x2, y2, w, col, p) {
  c.beginPath();
  c.moveTo(mm(x1, p), mm(y1, p));
  c.lineTo(mm(x2, p), mm(y2, p));
  c.lineWidth = mm(w || 0.22, p);
  c.strokeStyle = col || "#333";
  c.stroke();
}
function rect(c, x, y, w, h, fill, stroke, lw, p) {
  if (fill) {
    c.fillStyle = fill;
    c.fillRect(mm(x, p), mm(y, p), mm(w, p), mm(h, p));
  }
  if (stroke) {
    c.lineWidth = mm(lw || 0.22, p);
    c.strokeStyle = stroke;
    c.strokeRect(mm(x, p), mm(y, p), mm(w, p), mm(h, p));
  }
}
function styled(c, lines, x, y, s, lh, p) {
  lines.forEach((ln, ri) => {
    let cx = x;
    ln.forEach((seg) => {
      drawText(c, seg.text, cx, y + ri * lh, s, seg.style, "left", "#000", p);
      cx += measureMm(seg.text, s, seg.style);
    });
  });
}
function centered(c, lines, cx, top, h, s, lh, p) {
  const total = lines.length * lh,
    first = top + (h - total) / 2 + lh * 0.78;
  lines.forEach((ln, i) => {
    const t = ln.map((x) => x.text).join(""),
      styles = [...new Set(ln.map((x) => x.style))],
      st = styles.length === 1 ? styles[0] : "normal";
    drawText(c, t, cx, first + i * lh, s, st, "center", "#000", p);
  });
}
export function drawPdfPage(canvas, p, record, logoImage) {
  const model = buildPageModel(record),
    id = record;
  canvas.width = Math.round(PAGE.w * p);
  canvas.height = Math.round(PAGE.h * p);
  const c = canvas.getContext("2d");
  c.fillStyle = "#fff";
  c.fillRect(0, 0, canvas.width, canvas.height);
  if (logoImage?.naturalWidth) {
    const w = layout.logo.w * 0.9625,
      h = w / (logoImage.naturalWidth / logoImage.naturalHeight);
    c.drawImage(
      logoImage,
      mm(layout.logo.x + (layout.logo.w - w) / 2, p),
      mm(layout.logo.y + (layout.logo.h - h) / 2, p),
      mm(w, p),
      mm(h, p),
    );
  }
  rect(
    c,
    layout.strip.x,
    layout.strip.y,
    layout.strip.w,
    layout.strip.h,
    "#808080",
    null,
    0,
    p,
  );
  drawText(
    c,
    (id.school || "INSTITUCIÓN EDUCATIVA").toUpperCase(),
    layout.strip.x + layout.strip.w / 2,
    layout.strip.y + 4.35,
    sizes.strip,
    "bold",
    "center",
    "#fff",
    p,
    layout.strip.w - 4,
  );
  const A = "PROGRAMA DE FORMACIÓN ",
    B = "DUAL",
    tw = measureMm(A, sizes.title, "bold") + measureMm(B, sizes.title, "bold"),
    sx = (PAGE.w - tw) / 2;
  drawText(c, A, sx, layout.programY, sizes.title, "bold", "left", "#000", p);
  drawText(
    c,
    B,
    sx + measureMm(A, sizes.title, "bold"),
    layout.programY,
    sizes.title,
    "bold",
    "left",
    "#bd8d2d",
    p,
  );
  drawText(
    c,
    "BITÁCORA SEMANAL",
    PAGE.w / 2,
    layout.bitacoraY,
    sizes.title,
    "bold",
    "center",
    "#000",
    p,
  );
  drawText(
    c,
    "Nombre del alumno: " + id.student,
    layout.table.x,
    layout.metaY[0],
    sizes.meta,
    "bold",
    "left",
    "#000",
    p,
    layout.table.w,
  );
  drawText(
    c,
    "Nombre de la empresa: " + id.company,
    layout.table.x,
    layout.metaY[1],
    sizes.meta,
    "bold",
    "left",
    "#000",
    p,
    layout.table.w,
  );
  drawText(
    c,
    `Especialidad: ${id.specialty}    Semestre: ${id.semester}°    Grupo: ${id.group}`,
    layout.table.x,
    layout.metaY[2],
    sizes.meta,
    "bold",
    "left",
    "#000",
    p,
    layout.table.w,
  );
  const t = layout.table,
    { xs, widths, rows } = model;
  rect(c, t.x, t.y, t.w, t.headH, null, "#333", 0.22, p);
  for (let i = 1; i < xs.length - 1; i++)
    line(c, xs[i], t.y, xs[i], model.bottom, 0.22, "#333", p);
  [
    "FECHA",
    "ACTIVIDADES REALIZADAS",
    "HORARIOS",
    "ÁREA DONDE REALIZÓ LA ACTIVIDAD",
  ].forEach((h, i) =>
    drawText(
      c,
      h,
      i === 0 || i === 2 ? xs[i] + widths[i] / 2 : xs[i] + 1.2,
      t.y + 5.25,
      sizes.tableHead,
      "bold",
      i === 0 || i === 2 ? "center" : "left",
      "#000",
      p,
    ),
  );
  let y = t.y + t.headH;
  rows.forEach((r) => {
    rect(c, t.x, y, t.w, r.h, r.special ? "#e7e7e7" : null, "#333", 0.22, p);
    centered(
      c,
      r.dateLines,
      xs[0] + widths[0] / 2,
      y,
      r.h,
      sizes.other,
      3.65,
      p,
    );
    r.special
      ? centered(
          c,
          r.activityLines,
          xs[1] + widths[1] / 2,
          y,
          r.h,
          sizes.activity,
          3.65,
          p,
        )
      : styled(
          c,
          r.activityLines,
          xs[1] + 1.5,
          y + 3.7,
          sizes.activity,
          3.38,
          p,
        );
    centered(
      c,
      r.timeLines,
      xs[2] + widths[2] / 2,
      y,
      r.h,
      sizes.other,
      3.65,
      p,
    );
    centered(
      c,
      r.areaLines,
      xs[3] + widths[3] / 2,
      y,
      r.h,
      sizes.other,
      3.65,
      p,
    );
    y += r.h;
  });
  const s = layout.signatures,
    sw = s.colRatio.map((r) => r * s.w),
    sx2 = [s.x];
  sw.forEach((w) => sx2.push(sx2.at(-1) + w));
  const companyName = companySignatureName(id.company),
    cells = [
      {
        h: "Elaboró",
        n: id.authorities.elaboroName,
        r: id.authorities.elaboroRole.split("\n").filter(Boolean),
        on: true,
      },
      {
        h: "Vo.Bo",
        n: id.authorities.voboName,
        r: id.authorities.voboRole.split("\n").filter(Boolean),
        on: true,
      },
      {
        h: "Autorizó",
        n: id.authorities.autorizoName,
        r: authoritySignatureRoles(id.authorities.autorizoRole, id.company),
        on: true,
      },
      {
        h: "Vo.Bo",
        n: id.instructor.name,
        r: [id.instructor.roleMain, id.instructor.note, companyName].filter(
          Boolean,
        ),
        on: id.instructor.enabled,
      },
    ];
  cells.forEach((cell, i) => {
    if (!cell.on) return;
    const cx = sx2[i] + sw[i] / 2;
    drawText(
      c,
      cell.h,
      cx,
      s.y + 5.4,
      sizes.signatureHead,
      "bold",
      "center",
      "#000",
      p,
    );
    if (i < 3)
      drawText(
        c,
        [
          "FIRMA DEL ALUMNO:",
          "FIRMA DE VINCULACIÓN:",
          "FIRMA DEL ASESOR DE LA EMPRESA:",
        ][i],
        cx,
        s.y + 9.1,
        5.4,
        "normal",
        "center",
        "#555",
        p,
      );
    line(
      c,
      cx - sw[i] * 0.39,
      s.lineY,
      cx + sw[i] * 0.39,
      s.lineY,
      0.22,
      "#222",
      p,
    );
    drawText(
      c,
      cell.n,
      cx,
      s.lineY + 3.55,
      sizes.name,
      "bold",
      "center",
      "#000",
      p,
      sw[i] - 3,
    );
    cell.r
      .slice(0, 4)
      .forEach((r, j) =>
        drawText(
          c,
          r,
          cx,
          s.lineY + 6.4 + j * 2.75,
          r.toLowerCase() === "instructor formador" ? sizes.note : sizes.role,
          r.toLowerCase() === "instructor formador" ? "normal" : "italic",
          "center",
          r.toLowerCase() === "instructor formador" ? "#555" : "#000",
          p,
          sw[i] - 3,
        ),
      );
  });
  return model;
}

function dataUrlToBytes(url) {
  const bin = atob(url.split(",")[1]),
    b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return b;
}
function asciiBytes(t) {
  const b = new Uint8Array(t.length);
  for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i) & 255;
  return b;
}
function concatBytes(parts) {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  parts.forEach((p) => {
    out.set(p, o);
    o += p.length;
  });
  return out;
}
export function createPdf(jpeg, w, h) {
  const pw = 841.8898,
    ph = 595.2756,
    content = asciiBytes(
      `q\n${pw.toFixed(4)} 0 0 ${ph.toFixed(4)} 0 0 cm\n/Im0 Do\nQ\n`,
    ),
    obj = [];
  obj[1] = asciiBytes("<< /Type /Catalog /Pages 2 0 R >>");
  obj[2] = asciiBytes("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  obj[3] = asciiBytes(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(4)} ${ph.toFixed(4)}] /Resources << /ProcSet [/PDF /ImageC] /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
  );
  obj[4] = concatBytes([
    asciiBytes(`<< /Length ${content.length} >>\nstream\n`),
    content,
    asciiBytes("endstream"),
  ]);
  obj[5] = concatBytes([
    asciiBytes(
      `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
    ),
    jpeg,
    asciiBytes("\nendstream"),
  ]);
  const chunks = [asciiBytes("%PDF-1.4\n%PDF\n")],
    off = [0];
  let pos = chunks[0].length;
  for (let i = 1; i <= 5; i++) {
    off[i] = pos;
    const x = concatBytes([
      asciiBytes(i + " 0 obj\n"),
      obj[i],
      asciiBytes("\nendobj\n"),
    ]);
    chunks.push(x);
    pos += x.length;
  }
  let xr = "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++)
    xr += String(off[i]).padStart(10, "0") + " 00000 n \n";
  xr += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`;
  chunks.push(asciiBytes(xr));
  return concatBytes(chunks);
}

export function canvasToJpegBytes(canvas, quality = 0.96) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("No se pudo generar la imagen del PDF."));
          return;
        }
        try {
          resolve(new Uint8Array(await blob.arrayBuffer()));
        } catch (err) {
          reject(err);
        }
      },
      "image/jpeg",
      quality,
    );
  });
}

function signatureFits(r) {
  const widths = layout.signatures.colRatio.map(
    (v) => v * layout.signatures.w - 3,
  );
  const groups = [
    {
      name: r.student,
      roles: r.authorities.elaboroRole.split("\n").filter(Boolean),
    },
    {
      name: r.authorities.voboName,
      roles: r.authorities.voboRole.split("\n").filter(Boolean),
    },
    {
      name: r.authorities.autorizoName,
      roles: authoritySignatureRoles(r.authorities.autorizoRole, r.company),
    },
  ];
  if (r.instructor.enabled)
    groups.push({
      name: r.instructor.name,
      roles: [
        r.instructor.roleMain,
        r.instructor.note,
        companySignatureName(r.company),
      ].filter(Boolean),
    });
  return (
    groups.every(
      (g, i) =>
        g.roles.length <= 4 &&
        measureMm(g.name, 6, "bold") <= widths[i] &&
        g.roles.every((t) => measureMm(t, 6, "italic") <= widths[i]),
    ) &&
    measureMm(r.school.toUpperCase(), 8, "bold") <= layout.strip.w - 4 &&
    measureMm("Nombre de la empresa: " + r.company, 9, "bold") <= layout.table.w
  );
}
