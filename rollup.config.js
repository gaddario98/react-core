import { createRequire } from "module";
import { 
  createMultiEntryConfig, 
  createTypeDeclarations 
} from "../../rollup.common.config.js";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

// Definizione degli entry points
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

// Configurazione per i file JavaScript
export default createMultiEntryConfig(pkg, entries, { 
  isReactNative: false,
});
