import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // 添加 rules 覆盖
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",      // 允许 any
      "@typescript-eslint/no-unused-vars": "off",       // 允许未用变量
      "react/no-unescaped-entities": "off",             // 允许直接用单引号
    }
  }
];

export default eslintConfig;