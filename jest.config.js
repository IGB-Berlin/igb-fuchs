// @ts-check
/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+.tsx?$': ['ts-jest',{
      diagnostics: {
        ignoreCodes: [ 'TS151001' ], // "esModuleInterop: true" is set, but tsconfig.json is in subdir
      },
    }],
  },
  collectCoverage: true,
}