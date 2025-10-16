import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

// Plugin to remove 'use client' and 'use server' directives
const removeDirectives = () => ({
  name: 'remove-directives',
  transform(code, id) {
    if (id.includes('node_modules')) {
      const newCode = code.replace(/['"]use (client|server)['"];?\s*/g, '');
      if (newCode !== code) {
        return { code: newCode, map: null };
      }
    }
    return null;
  }
});

const dependencyNames = [
  ...Object.keys(pkg.peerDependencies ?? {}),
];

const isExternal = (id) => {
  // External: peer dependencies
  if (dependencyNames.some(
    (depName) => id === depName || id.startsWith(`${depName}/`)
  )) {
    return true;
  }
  
  // External: react internals
  if (id.startsWith('react/') || id === 'react' || id.startsWith('react-dom/')) {
    return true;
  }
  
  // External: internal @gaddario98 packages (sono dependencies)
  if (id.startsWith('@gaddario98/')) {
    return true;
  }
  
  return false;
};

export default {
  input: "index.ts",
  output: [
    // ESM build
    {
      file: "dist/index.mjs",
      format: "esm",
      sourcemap: true,
      exports: "named",
    },
    // CommonJS build
    {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
  ],
  external: isExternal,
  plugins: [
    removeDirectives(),
    peerDepsExternal(),
    resolve({ 
      preferBuiltins: false,
      browser: true,
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
    }),
    json(),
    commonjs(),
    typescript({ 
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "dist",
    }),
    babel({
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      plugins: ["babel-plugin-react-compiler"],
      babelHelpers: "bundled",
      exclude: "node_modules/**",
    }),
  ],
};
