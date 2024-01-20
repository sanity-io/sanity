#!/usr/bin/env node
/* eslint-disable import/no-dynamic-require, no-process-env */
import chalk from 'chalk'
import depcheck, {type Node} from 'depcheck'
import fs from 'fs'
import path from 'path'

const cwd = path.resolve(process.cwd(), process.argv[2] || '.')

const manifest = JSON.parse(fs.readFileSync(`${cwd}/package.json`, 'utf-8'))

const options: depcheck.Options = {
  ignoreMatches: ['@types/jest', '@types/webpack-env', 'ts-node', ...getProjectIgnores(cwd)],
  ignoreDirs: ['lib', ...getProjectIgnoresDirs(cwd)],
  detectors: [
    depcheck.detector.exportDeclaration,
    depcheck.detector.extract,
    depcheck.detector.importCallExpression,
    depcheck.detector.importDeclaration,
    depcheck.detector.requireCallExpression,
    depcheck.detector.requireResolveCallExpression,
    depcheck.detector.typescriptImportEqualsDeclaration,
    depcheck.detector.typescriptImportType,
    typeScriptReferencesDirective,
  ],
  specials: [
    depcheck.special.bin,
    depcheck.special.babel,
    depcheck.special.webpack,
    depcheck.special.jest,
    implicitDepsParser,
  ],
  package: manifest,
}

depcheck(cwd, options).then((unused) => {
  const hasUnusedDeps = unused.dependencies.length > 0 || unused.devDependencies.length > 0
  const missing = Object.keys(unused.missing).map((dep) => ({
    name: dep,
    usages: unused.missing[dep],
  }))
  const hasMissingDeps = missing.length > 0
  const hasInvalidFiles = unused.invalidFiles.length > 0
  const hasInvalidDirs = unused.invalidDirs.length > 0
  if (hasUnusedDeps) {
    console.error(
      [
        chalk.bold('Unused dependencies'),
        ...unused.dependencies.map((dep) => `- ${dep}`),
        ...unused.devDependencies.map((dep) => `- ${dep} (dev)`),
      ].join('\n'),
    )
  }
  if (hasMissingDeps) {
    console.error(
      [
        chalk.bold('Missing dependencies'),
        ...missing.flatMap((dep) => [
          `- ${dep.name}`,
          '  used by',
          ...dep.usages.map((u) => `    -- ${path.relative(cwd, u)}`),
        ]),
      ].join('\n'),
    )
  }
  if (hasInvalidFiles) {
    console.error(
      [
        chalk.bold('Invalid files'),
        ...Object.entries(unused.invalidFiles).map(([file]) => `- ${file}`),
      ].join('\n'),
    )
  }
  if (hasInvalidDirs) {
    console.error(
      [
        chalk.bold('Invalid dirs'),
        ...Object.entries(unused.invalidDirs).map(([file]) => `- ${file}`),
      ].join('\n'),
    )
  }
  if (hasMissingDeps || hasUnusedDeps || hasInvalidFiles) {
    process.exit(1)
  }
})

const IMPLICIT_DEPS: Record<string, string | string[]> = {
  sanity: ['styled-components', 'react'],
  recast: '@babel/parser', // recast/parsers/typescript implicitly requires @babel/parser
}

function implicitDepsParser(filePath: string, deps: ReadonlyArray<string>) {
  return deps.flatMap((dep) => IMPLICIT_DEPS[dep] || [])
}

function getProjectIgnores(baseDir: string) {
  try {
    return JSON.parse(fs.readFileSync(`${baseDir}/.depcheckignore.json`, 'utf-8'))?.ignore || []
  } catch {
    return []
  }
}

function getProjectIgnoresDirs(baseDir: string) {
  try {
    return JSON.parse(fs.readFileSync(`${baseDir}/.depcheckignore.json`, 'utf-8'))?.ignoreDirs || []
  } catch (e) {
    return []
  }
}

function typeScriptReferencesDirective(node: Node): ReadonlyArray<string> | string {
  let match
  if (node.type === 'CommentLine' && (match = node.value.match(/\/<reference types="(.+)" \/>/))) {
    return [match[1]]
  }
  return []
}

function sanityJSONParser(filePath: string, deps: ReadonlyArray<string>) {
  const filename = path.basename(filePath)
  if (filename === 'sanity.json') {
    const sanityConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const allPlugins = sanityConfig.plugins.concat(
      Object.keys(sanityConfig.env || {}).flatMap((env) => sanityConfig.env[env].plugins || []),
    )
    return deps
      .concat(allPlugins.filter(isLocalPlugin(filePath)))
      .filter((dep) =>
        allPlugins.some((plugin: string) => plugin === dep || dep === `sanity-plugin-${plugin}`),
      )
  }
  return []
}

function isLocalPlugin(basePath: string) {
  return (pluginName: string) => {
    try {
      fs.accessSync(path.join(basePath, pluginName, 'sanity.json'), fs.constants.R_OK)
      return true
    } catch {
      return false
    }
  }
}
