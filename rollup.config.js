import { createRequire } from "module";
import { createMultiEntryConfig } from "../../rollup.common.config.js";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Definizione degli entry points
const entries = [
  { name: "index", input: "index.ts" },
  { name: "auth", input: "auth/index.ts" },
  { name: "form", input: "form/index.ts" },
  { name: "localization", input: "localization/index.ts" },
  { name: "notifications", input: "notifications/index.ts" },
  { name: "pages", input: "pages/index.ts" },
  { name: "providers", input: "providers/index.ts" },
  { name: "queries", input: "queries/index.ts" },
  { name: "state", input: "state/index.ts" },
  { name: "utiles", input: "utiles/index.ts" },
];

// Mappa: path assoluto di ogni entry -> nome entry
const entryAbsPaths = new Map(
  entries.map((e) => [path.resolve(__dirname, e.input), e.name])
);

// Subdirectory che sono sub-package (con proprio package.json)
const subPackageDirs = entries
  .filter((e) => e.name !== "index")
  .map((e) => e.name);

// Mappa @gaddario98/* -> path relativo dell'entry corrispondente
const packageMap = {
  "@gaddario98/react-form": "form/index.ts",
  "@gaddario98/react-state": "state/index.ts",
  "@gaddario98/react-queries": "queries/index.ts",
  "@gaddario98/react-localization": "localization/index.ts",
  "@gaddario98/react-pages": "pages/index.ts",
};

// Plugin per risolvere import @gaddario98/* e relativi come external
// con il path assoluto dell'entry, così il paths mapping li riscrive a path relativi
const resolveToEntryPaths = (currentAbsPath) => ({
  name: "resolve-to-entry-paths",
  resolveId(source, importer) {
    // Import come @gaddario98/react-form -> external con path assoluto
    if (packageMap[source]) {
      const absPath = path.resolve(__dirname, packageMap[source]);
      // Se è l'entry corrente, non marcarlo come external
      if (absPath === currentAbsPath) return null;
      return { id: absPath, external: true };
    }

    // Import relativi che puntano a directory sub-package
    // Es: ../queries da config/useCoreConfig.ts
    // Ma NON: ./state da auth/index.ts (che deve restare auth/state.ts)
    if (importer && source.startsWith(".")) {
      const importerDir = path.dirname(importer);
      const resolved = path.resolve(importerDir, source);
      const relative = path.relative(__dirname, resolved);

      for (const dir of subPackageDirs) {
        if (relative === dir) {
          const absPath = path.resolve(__dirname, dir, "index.ts");
          if (absPath === currentAbsPath) return null;
          return { id: absPath, external: true };
        }
      }
    }

    return null;
  },
});

// Calcola il path relativo di output tra due entry
function getOutputRelativePath(fromEntry, toEntry, format) {
  const ext = format === "esm" ? ".mjs" : ".js";
  const fromDir =
    fromEntry.name === "index" ? "dist" : `dist/${fromEntry.name}`;
  const toFile =
    toEntry.name === "index"
      ? `dist/index${ext}`
      : `dist/${toEntry.name}/index${ext}`;
  let rel = path.relative(fromDir, toFile);
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel;
}

const configs = createMultiEntryConfig(pkg, entries, {
  isReactNative: false,
});

// Post-process: ogni entry tratta gli ALTRI entry come external
export default configs.map((config, index) => {
  const currentEntry = entries[index];
  const currentAbsPath = path.resolve(__dirname, currentEntry.input);
  const originalExternal = config.external;

  // Paths mapping per gli output (riscrive i path assoluti ai path relativi corretti)
  const esmPaths = {};
  const cjsPaths = {};
  entries.forEach((entry) => {
    const absPath = path.resolve(__dirname, entry.input);
    if (absPath !== currentAbsPath) {
      esmPaths[absPath] = getOutputRelativePath(currentEntry, entry, "esm");
      cjsPaths[absPath] = getOutputRelativePath(currentEntry, entry, "cjs");
    }
  });

  return {
    ...config,
    output: config.output.map((out) => ({
      ...out,
      paths: out.format === "esm" ? esmPaths : cjsPaths,
    })),
    plugins: [resolveToEntryPaths(currentAbsPath), ...config.plugins],
    external: (id, parentId, isResolved) => {
      // Blocca l'external checker originale per i @gaddario98/* interni
      // (il plugin resolveId li gestisce con external: true e il path corretto)
      if (packageMap[id]) {
        return false;
      }
      // Se l'id è un altro entry point (già risolto), marcalo come external
      if (entryAbsPaths.has(id) && id !== currentAbsPath) {
        return true;
      }
      return originalExternal(id, parentId, isResolved);
    },
  };
});
