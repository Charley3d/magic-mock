import prettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
var t = 'ok'

export default defineConfig(
  // Ignore patterns
  {
    ignores: ['dist/', 'node_modules/', '*.config.js', 'coverage/'],
  },

  // Config files - no type checking
  {
    files: ['eslint.config.ts'],
    languageOptions: {
      parserOptions: {
        project: null, // ⛔ skip TS project for this file
      },
    },
  },

  // Main config - with type checking
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['eslint.config.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked, prettier],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
)
