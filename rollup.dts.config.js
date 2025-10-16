import { createTypeDeclarations } from "../../rollup.common.config.js";

// Definizione degli entry points (deve essere sincronizzata con rollup.config.js)
const entries = [
  { name: "index", input: "index.ts" },
    { name: "auth", input: "auth/index.ts" },
  { name: "form", input: "form/index.ts" },
  { name: "localization", input: "localization/index.ts" },
  { name: "pages", input: "pages/index.ts" },
  { name: "providers", input: "providers/index.ts" },
  { name: "queries", input: "queries/index.ts" },
  { name: "state", input: "state/index.ts" },
  { name: "utiles", input: "utiles/index.ts" },
];

// Configurazione per le dichiarazioni TypeScript
export default createTypeDeclarations(entries);
