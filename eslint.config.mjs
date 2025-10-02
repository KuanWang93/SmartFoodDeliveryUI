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
      "@typescript-eslint/no-explicit-any": "off",  // 关闭 any 检查
      // 如果还需要，可以加其它的禁用（比如 unused-vars）
      // "@typescript-eslint/no-unused-vars": "warn",
    }
  }  
];

export default eslintConfig;