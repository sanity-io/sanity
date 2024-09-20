import {createJestConfig, readPackageName, resolveDirName} from '@repo/test-config/jest'

export default createJestConfig({
  // ignore performance tests
  testPathIgnorePatterns: ['tests'],
  displayName: 'sanity-perf-tests',
})
