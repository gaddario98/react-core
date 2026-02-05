import { createRequire } from "module";
import {
  createMultiEntryConfig,
  createTypeDeclarations
} from "../../rollup.common.config.js";
import { visualizer } from "rollup-plugin-visualizer";
import filesize from "rollup-plugin-filesize";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

// Definizione degli entry points
const entries = [
  { name: "index", input: "index.ts" },
  { name: "components", input: "components/index.ts" },
  { name: "config", input: "config/index.ts" },
  { name: "hooks", input: "hooks/index.ts" },
  { name: "utils", input: "utils/index.ts" },
];

// Configurazione per i file JavaScript con bundle size monitoring
const configs = createMultiEntryConfig(pkg, entries, {
  isReactNative: false,
});

// Add bundle size monitoring plugins to the main index build
// These plugins help track bundle size during development and CI/CD
configs[0].plugins.push(
  visualizer({
    filename: "dist/stats.html",
    open: false,
    gzipSize: true,
    brotliSize: true,
  }),
  filesize({
    showGzippedSize: true,
    showBrotliSize: false,
    showMinifiedSize: false,
  })
);

// Code splitting is handled by multiple entry points defined above:
// - index: Main entry (includes everything)
// - components: Component exports only
// - hooks: Hook exports only
// - config: Configuration singleton
// - utils: Utility functions
//
// Each entry point is built separately, enabling tree-shaking in consumer bundles.
// Consumers can import from specific entry points to reduce bundle size:
//   import { lazyWithPreload } from '@gaddario98/react-pages/utils';

export default configs;
