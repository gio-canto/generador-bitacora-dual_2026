import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const workflow=readFileSync(".github/workflows/pages.yml","utf8");

describe("0.60.8 · publicación de GitHub Pages",()=>{
  it("serializa las ejecuciones de main incluso cuando cambie el SHA",()=>{
    expect(workflow).toContain('group: pages-${{ github.ref }}');
    expect(workflow).not.toContain('group: pages-${{ github.ref }}-${{ github.sha }}');
    expect(workflow).toContain("cancel-in-progress: false");
  });
  it("verifica que el commit esté vigente después del build y antes del artefacto",()=>{
    const tests=workflow.indexOf("      - run: npm test");
    const build=workflow.indexOf("      - run: npm run build");
    const verify=workflow.indexOf("      - name: Confirmar versión antes de publicar");
    const upload=workflow.indexOf("      - uses: actions/upload-pages-artifact@v3");
    expect(tests).toBeGreaterThan(-1);
    expect(build).toBeGreaterThan(tests);
    expect(verify).toBeGreaterThan(build);
    expect(upload).toBeGreaterThan(verify);
    expect(workflow).toContain('latest="$(git ls-remote origin refs/heads/main | cut -f1)"');
    expect(workflow).toContain('if [[ "$latest" == "$GITHUB_SHA" ]]; then');
    expect(workflow).toContain('if: steps.publish.outputs.ok == \'true\'');
  });
  it("no despliega pull requests y conserva la ejecución manual",()=>{
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("branches: [main]");
    expect(workflow).toContain("publish: ${{ steps.publish.outputs.ok }}");
    expect(workflow).toContain("needs.build.outputs.publish == 'true'");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("actions/configure-pages@v5");
    expect(workflow).toContain("actions/deploy-pages@v4");
  });
});
