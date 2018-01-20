module.exports = {
  env: { node: true },
  extends: 'eslint-config-brigade/node',
  parserOptions: { ecmaVersion: 9 },
  rules: {
    'no-unused-vars': [2, { argsIgnorePattern: '^_' }],
    'max-len': [2, {
      code: 100,
      ignoreComments: true,
      ignoreUrls: true,
      ignoreTemplateLiterals: true,
      ignoreStrings: true,
    }],
    'func-style': [2, 'expression', { allowArrowFunctions: true }],
    'import/prefer-default-export': 2,
    'import/named': 2,
    'import/newline-after-import': 2,
    'import/no-duplicates': 2,
    'import/no-mutable-exports': 2,
    'import/imports-first': 2,
    'max-nested-callbacks': [2, 6],
    'comma-dangle': [2, 'always-multiline'],
  },
};
