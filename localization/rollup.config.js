import { createRequire } from "module";
import {
  removeDirectives,
  createExternalChecker,
  handleWarning,
  babelConfig,
  resolveConfig,
  commonjsConfig,
  createTreeShakableOutputs,
} from "../../rollup.common.config.js";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");

// External modules configuration
const isExternal = createExternalChecker(pkg);

export default {
  input: "index.ts",
  output: createTreeShakableOutputs(),
  external: isExternal,
  plugins: [
    removeDirectives(),
    peerDepsExternal({
      includeDependencies: true,
    }),
    resolve({
      ...resolveConfig,
    }),
    json(),
    commonjs({
      ...commonjsConfig,
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "dist",
      rootDir: "./",
    }),
  ],
  onwarn: handleWarning,
};
