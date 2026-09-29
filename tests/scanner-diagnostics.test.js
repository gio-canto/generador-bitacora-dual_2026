import { describe, expect, it } from "vitest";
import {
  SCANNER_ERROR_CATALOG,
  createScannerIssue,
  formatScannerDiagnostic,
  scannerCodeForCameraError,
  scannerDecoderErrorKind,
  scannerDiagnosticSnapshot,
} from "../src/services/scanner-diagnostics.js";

describe("scanner diagnostics", () => {
  it("clasifica errores comunes de cámara con códigos estables", () => {
    expect(scannerCodeForCameraError({ name: "NotAllowedError" })).toBe(
      "CAM-003",
    );
    expect(scannerCodeForCameraError({ name: "NotFoundError" })).toBe(
      "CAM-004",
    );
    expect(scannerCodeForCameraError({ name: "NotReadableError" })).toBe(
      "CAM-005",
    );
    expect(scannerCodeForCameraError({ name: "OverconstrainedError" })).toBe(
      "CAM-006",
    );
    expect(scannerCodeForCameraError({ name: "AbortError" })).toBe("CAM-007");
  });

  it("trata los errores normales de decodificación como intentos, no como fallos", () => {
    expect(
      scannerDecoderErrorKind({
        name: "Error",
        constructor: { name: "Error" },
        getKind: () => "NotFoundException",
        message: "No MultiFormat Readers were able to detect the code.",
      }),
    ).toBe("miss");
    expect(
      scannerDecoderErrorKind({
        name: "InvalidStateError",
        message: "The video frame is not ready.",
      }),
    ).toBe("frame");
    expect(
      scannerDecoderErrorKind({
        name: "TypeError",
        message: "Unexpected decoder failure",
      }),
    ).toBe("fatal");
  });

  it("crea un problema con mensaje de usuario y detalle técnico separados", () => {
    const issue = createScannerIssue(
      "ZX-204",
      { name: "TypeError", message: "reader.scan is not a function" },
      {
        stage: "start-reader",
        source: "ZXing Browser",
        message: "La cámara está activa, pero el lector no pudo iniciar.",
      },
    );

    expect(issue.code).toBe("ZX-204");
    expect(issue.area).toBe("Lector");
    expect(issue.message).toContain("lector no pudo iniciar");
    expect(issue.technical).toBe("reader.scan is not a function");
    expect(issue.stage).toBe("start-reader");
  });

  it("genera un diagnóstico copiable sin incluir el contenido del Data Matrix", () => {
    const issue = createScannerIssue(
      "ZX-201",
      new Error("No se pudo cargar ZXing Browser."),
      { stage: "load-library", source: "ZXing Browser" },
    );
    const snapshot = scannerDiagnosticSnapshot({
      issue,
      cameraState: "ready",
      video: {
        readyState: 4,
        paused: false,
        videoWidth: 1920,
        videoHeight: 1080,
        srcObject: {},
      },
      stream: {
        active: true,
        getVideoTracks: () => [
          {
            getSettings: () => ({
              width: 1920,
              height: 1080,
              facingMode: "environment",
              frameRate: 30,
              deviceId: "hidden-device-id",
            }),
          },
        ],
      },
      zxing: null,
      version: "0.50.0-beta.9",
    });
    const text = formatScannerDiagnostic(snapshot);

    expect(text).toContain("Código: ZX-201");
    expect(text).toContain("Estado cámara: ready");
    expect(text).toContain('"deviceIdPresent":true');
    expect(text).not.toContain("hidden-device-id");
    expect(SCANNER_ERROR_CATALOG["ZX-205"].area).toBe("Lector");
  });
});
