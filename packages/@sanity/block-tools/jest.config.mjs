import {createJestConfig, readPackageName, resolveDirName} from '@repo/test-config/jest'
export default createJestConfig({
  displayName: readPackageName(import.meta.url),
  testEnvironment: 'node',
  rootDir: resolveDirName(import.meta.url),
  setupFilesAfterEnv: ['./test/setup.ts'],
})
