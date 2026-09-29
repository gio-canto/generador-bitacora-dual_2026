import schools from "../data/schools.json";
import companies from "../data/companies.json";

const DOMAIN_TERMS = [
  // Programación, web y desarrollo de software.
  "backend", "frontend", "fullstack", "framework", "frameworks", "JavaScript",
  "TypeScript", "React", "Vite", "Node", "Nodejs", "npm", "GitHub", "GitLab",
  "Git", "DevOps", "Docker", "Kubernetes", "localhost", "endpoint", "endpoints",
  "middleware", "microservicio", "microservicios", "microfrontend",
  "repositorio", "repositorios", "commit", "commits", "branch", "branches",
  "merge", "pull", "request", "requests", "deploy", "deployment", "build",
  "bundle", "bundler", "runtime", "script", "scripts", "debug", "debugging",
  "bug", "bugs", "hotfix", "refactor", "refactorización", "refactorizar",
  "callback", "hook", "hooks", "webhook", "webhooks", "payload", "payloads",
  "token", "tokens", "cache", "caché", "localStorage", "sessionStorage",
  "serviceworker", "serviceworkers", "responsive", "desktop", "mobile",
  "tablet", "iOS", "Android", "macOS", "Windows", "Linux", "PowerShell",
  "HTML", "CSS", "JSX", "DOM", "API", "REST", "GraphQL", "JSON", "XML",
  "CSV", "PDF", "SVG", "PNG", "JPG", "JPEG", "QR", "DataMatrix",
  "Data", "Matrix", "Blobatar", "Sileo",

  // Bases de datos, datos y nube.
  "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Supabase", "Firebase",
  "Redis", "NoSQL", "SQL", "query", "queries", "schema", "schemas",
  "dataset", "datasets", "dashboard", "dashboards", "KPI", "KPIs",
  "ETL", "pipeline", "pipelines", "PowerBI", "Tableau", "BigQuery",
  "Azure", "AWS", "Cloudflare", "Vercel", "Netlify", "hosting", "cloud",
  "backup", "backups", "snapshot", "snapshots", "log", "logs",

  // Inteligencia artificial y ciencia de datos.
  "IA", "AI", "LLM", "LLMs", "prompt", "prompts", "prompting",
  "chatbot", "chatbots", "embedding", "embeddings", "transformer",
  "transformers", "tokenización", "tokenizador", "tokenizadores",
  "inferencia", "finetuning", "multimodal", "multimodalidad", "RAG",
  "OCR", "NLP", "machine", "learning", "deep", "neural", "OpenAI",
  "ChatGPT", "Gemini", "Claude", "Copilot", "TensorFlow", "PyTorch",
  "scikit", "pandas", "NumPy",

  // Ciberseguridad, redes y soporte.
  "ciberseguridad", "firewall", "firewalls", "malware", "phishing",
  "ransomware", "antivirus", "VPN", "DNS", "DHCP", "TCP", "IP", "LAN",
  "WAN", "WiFi", "Ethernet", "router", "routers", "switch", "switches",
  "proxy", "proxies", "servidor", "servidores", "firmware", "hardware",
  "software", "driver", "drivers", "ticket", "tickets", "helpdesk",
  "troubleshooting", "credencial", "credenciales", "autenticación",
  "autorización", "MFA", "OAuth", "captcha", "CAPTCHA", "hash", "hashing",
  "cifrado",

  // Contabilidad, administración y finanzas.
  "CFDI", "ISR", "IVA", "IMSS", "INFONAVIT", "SAT", "DIOT", "devengado",
  "devengamiento", "amortización", "depreciación", "conciliación",
  "conciliaciones", "póliza", "pólizas", "balanza", "subcuenta",
  "subcuentas", "costeo", "PEPS", "UEPS", "inventario", "inventarios",
  "facturación", "facturable", "finiquito", "finiquitos", "nómina",
  "nóminas", "provisión", "provisiones", "retención", "retenciones",
  "deducible", "deducibles", "acreedor", "acreedores", "deudor",
  "deudores", "presupuestación", "presupuestario", "presupuestaria",
  "cashflow", "liquidez", "rentabilidad", "markup", "POS", "ERP", "CRM",

  // Recursos Humanos.
  "RH", "RRHH", "onboarding", "offboarding", "headcount", "reclutamiento",
  "reclutador", "reclutadora", "vacante", "vacantes", "postulación",
  "postulaciones", "currículum", "curriculum", "CV", "incidencia",
  "incidencias", "ausentismo", "rotación", "capacitación", "inducción",
  "organigrama", "organigramas", "retroalimentación", "feedback",
  "softskills", "hardskills",

  // Comercio electrónico, ventas y marketing digital.
  "ecommerce", "eCommerce", "marketplace", "marketplaces", "checkout",
  "carrito", "carritos", "SKU", "SKUs", "stock", "fulfillment",
  "dropshipping", "pasarela", "pasarelas", "merchant", "merchants",
  "Shopify", "WooCommerce", "MercadoLibre", "Amazon", "Stripe", "PayPal",
  "Conekta", "Openpay", "SEO", "SEM", "CTR", "CPC", "CPA", "ROAS",
  "conversiones", "remarketing", "retargeting", "lead", "leads",
  "prospecto", "prospectos", "newsletter", "landing", "copywriting",
  "branding", "engagement", "analytics",

  // Diseño, producto y gestión de proyectos.
  "UI", "UX", "wireframe", "wireframes", "mockup", "mockups", "Figma",
  "Canva", "Photoshop", "Illustrator", "prototipo", "prototipos",
  "usabilidad", "accesibilidad", "roadmap", "roadmaps", "backlog",
  "sprint", "sprints", "Scrum", "Kanban", "stakeholder", "stakeholders",
  "benchmark", "benchmarking", "brainstorming", "workflow", "workflows",
  "brief", "briefing", "milestone", "milestones", "release", "releases",

  // Ofimática y trabajo administrativo.
  "ofimática", "Microsoft", "Office", "Excel", "Word", "PowerPoint",
  "Outlook", "OneDrive", "SharePoint", "Teams", "Google", "Drive", "Docs",
  "Sheets", "Slides", "Workspace", "digitalización", "digitalizado",
  "escaneo", "escanear", "escáner",

  // Educación Dual y términos propios del proyecto.
  "CBTis", "DGETI", "SEMS", "TecNM", "UAGro", "COCYTIEG", "COCyTEG",
  "DataMatrix", "bitácora", "bitácoras", "dual", "Vinculación",
  "vinculación", "instructor", "instructora", "plantel", "planteles",
  "Ausbildungsnachweis", "Berichtsheft", "Auszubildende",
  "Ausbildungsbetrieb", "Berufsschule", "Berufsausbildung",
];

function collectStrings(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output));
    return output;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, output));
  }
  return output;
}

export function wordsFromText(value) {
  return String(value || "").match(/\p{L}[\p{L}\p{M}]*/gu) || [];
}

export function buildProjectDictionaryWords() {
  const words = new Set();

  const add = (value) => {
    for (const word of wordsFromText(value)) {
      if (word.length < 2 || word.length > 60) continue;
      words.add(word);
      words.add(word.toLocaleLowerCase("es-MX"));
    }
  };

  DOMAIN_TERMS.forEach(add);
  collectStrings(schools).forEach(add);
  collectStrings(companies).forEach(add);

  return [...words].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );
}

export const PROJECT_DICTIONARY_WORDS = buildProjectDictionaryWords();

export function applyProjectDictionary(spell) {
  for (const word of PROJECT_DICTIONARY_WORDS) spell.add(word);
  return spell;
}
