import {createJestConfig, readPackageName, resolveDirName} from '@repo/test-config/jest'

export default createJestConfig({
  displayName: readPackageName(import.meta.url),
  globalSetup: '<rootDir>/test/shared/globalSetup.ts',
  globalTeardown: '<rootDir>/test/shared/globalTeardown.ts',
  rootDir: resolveDirName(import.meta.url),
  setupFilesAfterEnv: ['<rootDir>/test/shared/setupAfterEnv.ts'],
  slowTestThreshold: 60000,
  testEnvironment: 'node',
})
