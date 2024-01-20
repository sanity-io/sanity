/* eslint-disable tsdoc/syntax */
'use strict'

const path = require('path')
const globby = require('globby')
const yaml = require('js-yaml')
const fs = require('node:fs')

const workspaces = yaml.load(fs.readFileSync('./pnpm-workspace.yaml', 'utf8'))
const jestConfigFiles = globby.sync(
  workspaces.packages.map((workspace) => path.join(__dirname, workspace, '/jest.config.cjs')),
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
