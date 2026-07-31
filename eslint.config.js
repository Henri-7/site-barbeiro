import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['artifacts/**', 'dist/**', 'node_modules/**', 'index.html', 'package-lock.json']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['client/src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        HTMLElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLDivElement: 'readonly',
        KeyboardEvent: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        RequestInit: 'readonly',
        Response: 'readonly',
        URLSearchParams: 'readonly',
        HTMLAnchorElement: 'readonly'
      }
    }
  },
  {
    files: ['server/src/**/*.js', 'scripts/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        URLSearchParams: 'readonly'
      }
    }
  }
];
