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
    '^part:@sanity/base/arrow-drop-down': '<rootDir>/test/mocks/PassThrough.tsx',
    '^part:@sanity/components/labels/default': '<rootDir>/test/mocks/PassThrough.tsx',
    '^part:@sanity/components/validation/status': '<rootDir>/test/mocks/PassThrough.tsx',
    '^part:@sanity/components/fieldsets/default': '<rootDir>/test/mocks/Fieldset.ts',
    '^part:@sanity/components/formfields/default': '<rootDir>/test/mocks/FormField.ts',
    '^part:@sanity/base/user': '<rootDir>/test/mocks/user-store.ts',
    '^part:@sanity/components/avatar': '<rootDir>/test/mocks/user-store.ts',
    '^part:@sanity/base/authentication-fetcher': '<rootDir>/test/mocks/authentication-fetcher.ts',
    '^part:.*': '<rootDir>/test/mocks/parts.ts',
    '^all:part:.*': '<rootDir>/test/mocks/parts.ts',
    '.*.css$': '<rootDir>/test/mocks/css.ts',
    'config:@sanity/form-builder': '<rootDir>/test/mocks/form-builder-config.ts',
    'sanity:css-custom-properties': '<rootDir>/test/mocks/empty.ts',
  },
}
