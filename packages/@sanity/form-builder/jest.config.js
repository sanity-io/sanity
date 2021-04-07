module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['src/**.js'],
  testRegex:
    '(src/(.*__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$)|(test/((.*\\.|/)(test|spec))\\.[jt]sx?$)',
  // Setup timezone
  globalSetup: '<rootDir>/test/setup/global.ts',
  setupFiles: ['<rootDir>/test/setup/environment.ts'],
  moduleNameMapper: {
    'react-refractor': '<rootDir>/test/mocks/empty.ts',
    '^part:@sanity/components/tooltip': '<rootDir>/test/mocks/tooltip.ts',
    '^part:@sanity/base/client': '<rootDir>/test/mocks/client.ts',
    '^part:@sanity/base/user': '<rootDir>/test/mocks/user-store.ts',
    '^part:@sanity/components/avatar': '<rootDir>/test/mocks/user-store.ts',
    '^part:@sanity/base/authentication-fetcher': '<rootDir>/test/mocks/authentication-fetcher.ts',
    '^part:.*': '<rootDir>/test/mocks/parts.ts',
    '.*.css$': '<rootDir>/test/mocks/css.ts',
    'sanity:css-custom-properties': '<rootDir>/test/mocks/empty.ts',
  },
}
