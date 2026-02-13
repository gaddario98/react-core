import { createTypeDeclarations } from "../../rollup.common.config.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Definizione degli entry points (deve essere sincronizzata con rollup.config.js)
const entries = [
  { name: "index", input: "index.ts" },
  { name: "auth", input: "auth/index.ts" },
  { name: "form", input: "form/index.ts" },
  { name: "localization", input: "localization/index.ts" },
  { name: "notifications", input: "notifications/index.ts" },
  { name: "pages", input: "pages/index.ts" },
  { name: "queries", input: "queries/index.ts" },
  { name: "state", input: "state/index.ts" },
  { name: "utiles", input: "utiles/index.ts" },
  { name: "providers", input: "providers/index.ts" },
];

// Mappa @gaddario98/* -> path relativo dell'entry corrispondente
const packageMap = {
  "@gaddario98/react-form": "form/index.ts",
  "@gaddario98/react-state": "state/index.ts",
  "@gaddario98/react-queries": "queries/index.ts",
  "@gaddario98/react-localization": "localization/index.ts",
  "@gaddario98/react-pages": "pages/index.ts",
  "@gaddario98/react-auth": "auth/index.ts",
  "@gaddario98/react-notifications": "notifications/index.ts",
  "@gaddario98/react-providers": "providers/index.ts",
  "@gaddario98/react-utiles": "utiles/index.ts",
};

// Subdirectory che sono sub-package (con proprio package.json)
const subPackageDirs = entries
  .filter((e) => e.name !== "index")
  .map((e) => e.name);

// Mappa: path assoluto di ogni entry -> nome entry
const entryAbsPaths = new Map(
  entries.map((e) => [path.resolve(__dirname, e.input), e.name]),
);

// Calcola il path relativo di output tra due entry per i .d.ts
function getDtsOutputRelativePath(fromEntry, toEntry) {
  const fromDir =
    fromEntry.name === "index" ? "dist" : `dist/${fromEntry.name}`;
  const toFile =
    toEntry.name === "index"
      ? `dist/index.d.ts`
      : `dist/${toEntry.name}/index.d.ts`;
  let rel = path.relative(fromDir, toFile);
  if (!rel.startsWith(".")) rel = "./" + rel;
  // Rimuovi .d.ts per compatibilità con TypeScript import
  return rel.replace(/\.d\.ts$/, "");
}

// Plugin per risolvere import @gaddario98/* nei .d.ts
const resolveToEntryPathsDts = (currentAbsPath, currentEntry, entries) => ({
  name: "resolve-to-entry-paths-dts",
  resolveId(source, importer) {
    // Import come @gaddario98/react-form -> external con path assoluto
    if (packageMap[source]) {
      const absPath = path.resolve(__dirname, packageMap[source]);
      // Se è l'entry corrente, non marcarlo come external
      if (absPath === currentAbsPath) return null;
      return { id: absPath, external: true };
    }

    // Import relativi che puntano a directory sub-package
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

// Configurazione per le dichiarazioni TypeScript
const baseConfigs = createTypeDeclarations(entries);

// Post-process: aggiungi il plugin e i paths per ogni entry
export default baseConfigs.map((config, index) => {
  const currentEntry = entries[index];
  const currentAbsPath = path.resolve(__dirname, currentEntry.input);

  // Paths mapping per i .d.ts (riscrive i path assoluti ai path relativi corretti)
  const dtsPaths = {};
  entries.forEach((entry) => {
    const absPath = path.resolve(__dirname, entry.input);
    if (absPath !== currentAbsPath) {
      dtsPaths[absPath] = getDtsOutputRelativePath(currentEntry, entry);
    }
  });

  return {
    ...config,
    output: {
      ...config.output,
      paths: dtsPaths,
    },
    plugins: [
      resolveToEntryPathsDts(currentAbsPath, currentEntry, entries),
      ...config.plugins,
    ],
    external: (id, parentId, isResolved) => {
      // I package @gaddario98/* vengono gestiti dal plugin resolveId
      if (packageMap[id]) {
        return false;
      }
      // Se l'id è un altro entry point (già risolto), marcalo come external
      if (entryAbsPaths.has(id) && id !== currentAbsPath) {
        return true;
      }
      return false;
    },
  };
});
