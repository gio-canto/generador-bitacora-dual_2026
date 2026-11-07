import { describe, it, expect } from "vitest";
import { checkKnownFailures } from "../scripts/check-release-test-failures.mjs";

const full = `
 FAIL  tests/app.test.jsx > flujo heredado
 FAIL  tests/pa-signatures.test.js > espacio PDF
 FAIL  tests/pdf.test.js > formato carta
 Test Files  3 failed | 73 passed (76)
      Tests  3 failed | 385 passed (388)
`;

describe("0.61.1 · excepción de pruebas cerrada", () => {
  it("acepta únicamente las tres fallas previas y su conteo", () => {
    expect(checkKnownFailures(full)).toMatchObject({
      valid: true, failedCount: 3, passedCount: 385,
    });
  });
  it("bloquea cualquier falla nueva", () => {
    expect(checkKnownFailures(full.replace("tests/pdf.test.js", "tests/otra.test.js")).valid).toBe(false);
    expect(checkKnownFailures(full.replace("3 failed | 385", "4 failed | 384")).valid).toBe(false);
  });
  it("bloquea un resultado ausente o incompleto", () => {
    expect(checkKnownFailures("Test Files 3 failed").valid).toBe(false);
    expect(checkKnownFailures("").valid).toBe(false);
  });
});
