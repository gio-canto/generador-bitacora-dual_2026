import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED = [
  "tests/app.test.jsx",
  "tests/pa-signatures.test.js",
  "tests/pdf.test.js",
];

export function checkKnownFailures(log) {
  const clean = String(log || "").replace(/\x1b\[[0-9;]*m/g, "");
  const matches = [...clean.matchAll(/^\s*FAIL\s+(tests\/[^\s>]+)\s+>/gm)];
  const failedFiles = [...new Set(matches.map((match) => match[1]))].sort();
  const summary = clean.match(/\bTests\s+(\d+) failed\s*\|\s*(\d+) passed/);
  const expected = [...ALLOWED].sort();
  return {
    valid: Boolean(summary) &&
      Number(summary[1]) === expected.length &&
      JSON.stringify(failedFiles) === JSON.stringify(expected),
    failedFiles,
    failedCount: summary ? Number(summary[1]) : null,
    passedCount: summary ? Number(summary[2]) : null,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) {
    console.error("Falta el archivo de resultados de las pruebas.");
    process.exit(1);
  }
  const result = checkKnownFailures(readFileSync(file, "utf8"));
  if (!result.valid) {
    console.error("Fallas inesperadas o resultado incompleto; se bloquea la publicación.", result);
    process.exit(1);
  }
  console.log(`::warning::Excepción verificada: ${result.failedCount} pruebas conocidas, ${result.passedCount} aprobadas. Se bloquean otras fallas.`);
}
