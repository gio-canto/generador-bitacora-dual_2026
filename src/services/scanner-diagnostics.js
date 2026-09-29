export const SCANNER_ERROR_CATALOG = {
  "CAM-001": {
    area: "Cámara",
    title: "Contexto inseguro",
    description: "La cámara sólo puede abrirse desde HTTPS o un origen permitido.",
  },
  "CAM-002": {
    area: "Cámara",
    title: "API de cámara no disponible",
    description: "El navegador no expone navigator.mediaDevices.getUserMedia.",
  },
  "CAM-003": {
    area: "Cámara",
    title: "Permiso denegado",
    description: "Safari o el sistema bloqueó el permiso de cámara para este sitio.",
  },
  "CAM-004": {
    area: "Cámara",
    title: "Cámara no encontrada",
    description: "El dispositivo no reportó una cámara disponible.",
  },
  "CAM-005": {
    area: "Cámara",
    title: "Cámara ocupada",
    description: "La cámara no pudo abrirse porque está siendo usada o el sistema no pudo leerla.",
  },
  "CAM-006": {
    area: "Cámara",
    title: "Configuración rechazada",
    description: "La cámara rechazó las restricciones solicitadas.",
  },
  "CAM-007": {
    area: "Cámara",
    title: "Acceso interrumpido",
    description: "iOS o el navegador interrumpió la apertura de la cámara.",
  },
  "VID-101": {
    area: "Video",
    title: "Vista de cámara ausente",
    description: "No se encontró el elemento de video donde debe mostrarse el stream.",
  },
  "VID-102": {
    area: "Video",
    title: "El video no inició",
    description: "El stream existe, pero Safari no entregó fotogramas utilizables a la vista.",
  },
  "VID-103": {
    area: "Video",
    title: "Reproducción bloqueada",
    description: "video.play() fue rechazado por el navegador.",
  },
  "ZX-201": {
    area: "Lector",
    title: "ZXing no cargó",
    description: "No se encontró ZXingBrowser después de intentar cargar ambas fuentes.",
  },
  "ZX-202": {
    area: "Lector",
    title: "Clase de lector no disponible",
    description: "ZXing cargó, pero no exportó un lector Data Matrix compatible.",
  },
  "ZX-203": {
    area: "Lector",
    title: "No se pudo crear el lector",
    description: "ZXing cargó, pero falló al construir la instancia del lector.",
  },
  "ZX-204": {
    area: "Lector",
    title: "No se pudo iniciar el escaneo",
    description: "La cámara está activa, pero ZXing falló al comenzar a analizar el video.",
  },
  "ZX-205": {
    area: "Lector",
    title: "Fallo repetido durante lectura",
    description: "El decodificador produjo varias veces seguidas un error no recuperable.",
  },
  "ZX-207": {
    area: "Video",
    title: "No se pudo capturar el fotograma",
    description: "Safari mantuvo la cámara activa, pero la captura del fotograma falló repetidamente.",
  },
  "BD-206": {
    area: "Lector",
    title: "BarcodeDetector sin Data Matrix",
    description: "El navegador ofrece BarcodeDetector, pero no soporta el formato data_matrix.",
  },
  "IMG-301": {
    area: "Imagen",
    title: "No se pudo leer la imagen",
    description: "El archivo se abrió, pero ningún lector pudo decodificar el Data Matrix.",
  },
};

function trim(value, max = 260) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function scannerCodeForCameraError(error) {
  const name = trim(error?.name, 80);
  if (name === "NotAllowedError" || name === "SecurityError") return "CAM-003";
  if (name === "NotFoundError" || name === "DevicesNotFoundError")
    return "CAM-004";
  if (name === "NotReadableError" || name === "TrackStartError")
    return "CAM-005";
  if (name === "OverconstrainedError") return "CAM-006";
  if (name === "AbortError") return "CAM-007";
  return "CAM-005";
}


export function scannerDecoderErrorKind(error) {
  const parts = [
    error?.name,
    error?.constructor?.name,
    error?.getKind?.(),
    error?.message,
  ]
    .filter(Boolean)
    .join(" ");

  if (
    /NotFoundException|ChecksumException|FormatException|No MultiFormat Readers|not found|checksum|format/i.test(
      parts,
    )
  )
    return "miss";

  if (
    /InvalidStateError|IndexSizeError|AbortError|drawImage|canvas|frame|video|source image|not ready|readyState/i.test(
      parts,
    )
  )
    return "frame";

  return "fatal";
}

export function createScannerIssue(code, error, extra = {}) {
  const meta = SCANNER_ERROR_CATALOG[code] || {
    area: "Escáner",
    title: "Error no clasificado",
    description: "Se produjo un error sin código específico.",
  };
  return {
    code,
    area: meta.area,
    title: meta.title,
    message: trim(extra.message || meta.description, 360),
    technical: trim(error?.message, 360),
    errorName: trim(error?.name || error?.constructor?.name, 120),
    stage: trim(extra.stage, 100),
    source: trim(extra.source, 100),
    at: new Date().toISOString(),
  };
}

export function scannerDiagnosticSnapshot({
  issue,
  cameraState,
  video,
  stream,
  zxing = globalThis.ZXingBrowser,
  version = "",
}) {
  const track = stream?.getVideoTracks?.()[0];
  let settings = {};
  try {
    const raw = track?.getSettings?.() || {};
    settings = {
      width: raw.width || null,
      height: raw.height || null,
      facingMode: raw.facingMode || null,
      frameRate: raw.frameRate || null,
      deviceIdPresent: Boolean(raw.deviceId),
    };
  } catch {
    settings = {};
  }

  return {
    version,
    code: issue?.code || "",
    area: issue?.area || "",
    stage: issue?.stage || "",
    errorName: issue?.errorName || "",
    message: issue?.message || "",
    technical: issue?.technical || "",
    source: issue?.source || "",
    secureContext: Boolean(globalThis.isSecureContext),
    mediaDevices: Boolean(globalThis.navigator?.mediaDevices),
    getUserMedia: Boolean(globalThis.navigator?.mediaDevices?.getUserMedia),
    cameraState,
    streamActive: Boolean(stream?.active),
    video: {
      readyState: Number(video?.readyState || 0),
      paused: Boolean(video?.paused),
      width: Number(video?.videoWidth || 0),
      height: Number(video?.videoHeight || 0),
      hasSrcObject: Boolean(video?.srcObject),
    },
    track: settings,
    zxing: {
      loaded: Boolean(zxing),
      source: trim(globalThis.__deliveryZxingSource, 180),
      dataMatrixReader: Boolean(zxing?.BrowserDatamatrixCodeReader),
      multiFormatReader: Boolean(zxing?.BrowserMultiFormatReader),
      dataMatrixFormat:
        zxing?.BarcodeFormat?.DATA_MATRIX !== undefined,
    },
    barcodeDetector: "BarcodeDetector" in globalThis,
    visibility: globalThis.document?.visibilityState || "",
    userAgent: trim(globalThis.navigator?.userAgent, 220),
    at: issue?.at || new Date().toISOString(),
  };
}

export function formatScannerDiagnostic(snapshot) {
  return [
    "Bitácora Dual · Diagnóstico de escáner",
    `Versión: ${snapshot.version || "desconocida"}`,
    `Código: ${snapshot.code || "sin código"}`,
    `Área: ${snapshot.area || "sin área"}`,
    `Etapa: ${snapshot.stage || "sin etapa"}`,
    `Error: ${snapshot.errorName || "sin nombre"}`,
    `Mensaje: ${snapshot.message || "sin mensaje"}`,
    `Detalle técnico: ${snapshot.technical || "sin detalle"}`,
    `Origen: ${snapshot.source || "sin origen"}`,
    `Contexto seguro: ${snapshot.secureContext}`,
    `getUserMedia: ${snapshot.getUserMedia}`,
    `Estado cámara: ${snapshot.cameraState}`,
    `Stream activo: ${snapshot.streamActive}`,
    `Video: readyState=${snapshot.video.readyState}, paused=${snapshot.video.paused}, ${snapshot.video.width}x${snapshot.video.height}, srcObject=${snapshot.video.hasSrcObject}`,
    `Track: ${JSON.stringify(snapshot.track)}`,
    `ZXing: ${JSON.stringify(snapshot.zxing)}`,
    `BarcodeDetector: ${snapshot.barcodeDetector}`,
    `Visibilidad: ${snapshot.visibility}`,
    `Navegador: ${snapshot.userAgent}`,
    `Fecha: ${snapshot.at}`,
  ].join("\n");
}
