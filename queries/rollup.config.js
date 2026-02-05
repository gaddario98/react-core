import { createRequire } from "module";
import { createMultiEntryConfig } from "../../rollup.common.config.js";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

// Definizione degli entry points
const entries = [{ name: "index", input: "index.ts" }];

// Configurazione per i file JavaScript
export default createMultiEntryConfig(pkg, entries, {
  isReactNative: false,
});
