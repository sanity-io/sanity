/**
 * This tells jest which projects exists
 */
import path from 'node:path'
import globby from 'globby'
import {resolveDirName} from '@repo/test-config/jest'

const jestConfigFiles = globby.sync('*/**/jest.config.mjs', {ignore: ['**/node_modules']})

/** @type {import("jest").Config} */
export default {
  projects: jestConfigFiles
    .map((file) => path.relative(resolveDirName(import.meta.url), path.dirname(file)))
    .map((projectPath) => `<rootDir>/${projectPath}`),
  // Ignore e2e tests
  modulePathIgnorePatterns: ['<rootDir>/test/'],
}
