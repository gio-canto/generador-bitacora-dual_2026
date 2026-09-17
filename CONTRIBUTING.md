# Contribuir

Gracias por ayudar a simplificar las bitácoras de Educación Dual.

1. Crea una rama a partir de `main`.
2. Instala Node.js 24 y ejecuta `npm ci`.
3. Trabaja con `npm run dev`.
4. Modifica catálogos en `src/data/` o componentes y reglas en su módulo correspondiente.
5. Ejecuta `npm run check` y revisa el PDF si modificaste su contenido o diseño.
6. Actualiza `CHANGELOG.md` y la documentación aplicable.
7. Abre un pull request con problema, solución y verificación.

Usa datos ficticios en pruebas. No publiques bitácoras personales, respaldos, credenciales ni capturas con información privada. Conserva la licencia y los créditos. Los nombres de autoridades precargados deben actualizarse con información confirmada.

En cambios visuales revisa teléfono, iPad y escritorio, teclado, foco, contraste, movimiento reducido, campos largos y estados vacíos o de error. No cambies silenciosamente el formato institucional del PDF.

El flujo de GitHub Actions verifica el pull request y despliega `dist/` cuando se integra en `main`.
