/* eslint-disable tsdoc/syntax */

const path = require('node:path')
const globby = require('globby')

const jestConfigFiles = globby.sync('**/*/jest.config.cjs', {
  ignore: ['**/node_modules'],
})

const IGNORE_PROJECTS = []

/** @type {import("jest").Config} */
module.exports = {
  projects: jestConfigFiles
    .map((file) => path.relative(__dirname, path.dirname(file)))
    .filter((projectPath) => !IGNORE_PROJECTS.includes(projectPath))
    .map((projectPath) => `<rootDir>/${projectPath}`),
  // Ignore e2e tests
  modulePathIgnorePatterns: ['<rootDir>/test/'],
}
