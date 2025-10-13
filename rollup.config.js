import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";
import babel from "@rollup/plugin-babel";

export default {
  input: "index.ts",
  output: [
    {
      file: "dist/index.mjs",
      format: "esm",
      sourcemap: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" }),
    babel({
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      plugins: ["babel-plugin-react-compiler"],
      babelHelpers: "bundled",
    }),
    json(),
  ],
};
