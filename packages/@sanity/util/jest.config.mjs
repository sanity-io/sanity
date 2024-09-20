import {createJestConfig, readPackageName} from '@repo/test-config/jest'
export default createJestConfig({
  displayName: readPackageName(import.meta.url),
})
