import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';

export default [
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: './tsconfig.json'
            }
        },
        plugins: {
            'unused-imports': eslintPluginUnusedImports
        },
        rules: {
            'no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }]
        }
    }
]; 