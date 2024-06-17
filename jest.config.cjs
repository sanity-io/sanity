/* eslint-disable tsdoc/syntax */
'use strict'

const path = require('path')
const globby = require('globby')
const yaml = require('js-yaml')
const fs = require('node:fs')

const workspacesPath = path.join(__dirname, 'pnpm-workspace.yaml')
const workspaces = yaml.load(fs.readFileSync(workspacesPath, 'utf8'))

const jestConfigFiles = globby.sync(
  workspaces.packages.map((workspace) => {
    return path.posix.join('.', workspace, 'jest.config.cjs')
  }),
)

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
