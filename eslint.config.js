// @ts-check
/** This file is part of IGB-FUCHS.
 *
 * Copyright © 2024-2025 Hauke Dämpfling (haukex@zero-g.net)
 * at the Leibniz Institute of Freshwater Ecology and Inland Fisheries (IGB),
 * Berlin, Germany, <https://www.igb-berlin.de/>
 *
 * IGB-FUCHS is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * IGB-FUCHS is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * IGB-FUCHS. If not, see <https://www.gnu.org/licenses/>.
 */
import eslint from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig([
  globalIgnores(['./dist/**', './coverage/**']),
  {
    files: ['./*.js', '**/*.ts', '**/*.tsx'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
      {
        languageOptions: {
          parserOptions: {
            // https://typescript-eslint.io/troubleshooting/typed-linting/#i-get-errors-telling-me--was-not-found-by-the-project-service-consider-either-including-it-in-the-tsconfigjson-or-including-it-in-allowdefaultproject
            projectService: {
              allowDefaultProject: ['*.js'],
            },
          },
        },
      },
    ],
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      'linebreak-style': [ 'error', 'unix' ],
      'semi': [ 'warn', 'never' ],
      'indent': [ 'warn', 2 ],
      'quotes': [ 'warn', 'single' ],
      '@stylistic/arrow-parens': [ 'warn', 'as-needed' ],
      '@typescript-eslint/switch-exhaustiveness-check': 'warn',
      '@typescript-eslint/no-confusing-void-expression': [ 'error', { 'ignoreArrowShorthand': true } ],
      '@typescript-eslint/restrict-template-expressions': [ 'warn', { 'allowNumber': true, 'allowBoolean': true } ],
      '@typescript-eslint/no-misused-promises': [ 'error', { 'checksVoidReturn': false } ],
      '@typescript-eslint/no-unnecessary-condition': [ 'error', { 'allowConstantLoopConditions': 'only-allowed-literals' } ],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'prefer-promise-reject-errors': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      // https://stackoverflow.com/a/78734642
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_[^_].*$|^_$',
          'varsIgnorePattern': '^_[^_].*$|^_$',
          'caughtErrorsIgnorePattern': '^_[^_].*$|^_$'
        }
      ]
    },
  }])