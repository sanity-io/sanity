import {createJestConfig} from '@repo/test-config/jest'

export default createJestConfig({
  displayName: 'sanity/cli',
  testEnvironment: 'node',
})
