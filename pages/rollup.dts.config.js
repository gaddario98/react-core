import { createTypeDeclarations } from "../../rollup.common.config.js";

// Definizione degli entry points (deve essere sincronizzata con rollup.config.js)
const entries = [
  { name: "index", input: "index.ts" },
    { name: "components", input: "components/index.ts" },
  { name: "config", input: "config/index.ts" },
  { name: "hooks", input: "hooks/index.ts" },
  { name: "utils", input: "utils/index.ts" },
];

// Configurazione per le dichiarazioni TypeScript
export default createTypeDeclarations(entries);
