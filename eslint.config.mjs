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
  {
    // Ignore generated, build, and auxiliary folders completely
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "prisma/**",
      "scripts/**",
      "*.config.*",
      "next-env.d.ts",
    ],
    // Project-wide rule overrides to silence noisy/irrelevant rules for now.
    rules: {
      // TypeScript complaints that are not actionable during large migrations
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      // Allow console.* uses used widely for debugging
      'no-console': 'off'
    }
  },
];

export default eslintConfig;
