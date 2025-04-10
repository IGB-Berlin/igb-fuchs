// @ts-check
/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  // Jest uses *.test.ts and *.spec.ts, so we configure Playwright to use *.play.ts
  testRegex: '[^/]+\\.(test|spec)\\.ts$',  // https://jestjs.io/docs/configuration#testregex-string--arraystring
  testEnvironment: 'jsdom',
  transform: {
    '^.+.tsx?$': ['ts-jest', {
      diagnostics: {
        ignoreCodes: [  ]
      },
    }],
  },
  collectCoverage: true,
}