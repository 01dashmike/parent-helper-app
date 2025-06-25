const js = await import('@eslint/js');
const next = await import('eslint-config-next');
const noUnusedImports = await import('eslint-plugin-no-unused-imports');

export default Promise.resolve([
  js.configs.recommended,
  ...next.default,
  {
    plugins: {
      'no-unused-imports': noUnusedImports.default,
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-unused-imports/no-unused-imports': 'warn',
    },
  },
]); 