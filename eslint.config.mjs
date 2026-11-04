import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';

export default defineConfig(
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/out',
      '**/release',
      'src-tauri/target',
      'src-tauri/gen',
      // 외부에서 가져온 스킬은 원본 그대로 둔다
      '.agents',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,

  // 설정 파일: Node 환경
  {
    files: ['*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // renderer: 브라우저 + React
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    ...eslintPluginReact.configs.flat.recommended,
    ...eslintPluginReact.configs.flat['jsx-runtime'],
    languageOptions: {
      ...eslintPluginReact.configs.flat.recommended.languageOptions,
      globals: globals.browser,
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      react: eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh,
    },
    rules: {
      ...eslintPluginReact.configs.flat.recommended.rules,
      ...eslintPluginReact.configs.flat['jsx-runtime'].rules,
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,
      // R3F의 three 속성(args, intensity 등)을 DOM 속성으로 오인한다. JSX 속성은 TypeScript가 검사한다
      'react/no-unknown-property': 'off',
    },
  },

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Prettier와 충돌하는 포맷 관련 규칙 비활성화 (항상 마지막에 위치)
  eslintConfigPrettier,
);
