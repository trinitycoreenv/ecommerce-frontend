/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFiles: ['<rootDir>/test/setup.ts'],
  verbose: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!@faker-js/faker)'
  ]
};