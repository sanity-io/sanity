#!/usr/bin/env node
/**
 * Symlinks this monorepo's packages into a target studio's node_modules.
 *
 * Runs directly in node (22.18+ strips types and detects ESM syntax
 * natively): `node scripts/symlinkDependencies.ts <targetDir>`
 */
import fs from 'node:fs'
import path from 'node:path'

import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {withDefault} from '@optique/core/modifiers'
import {argument, negatableFlag} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'
import {run} from '@optique/run'
import {rimrafSync} from 'rimraf'

const flags = run(
  object(
    {
      all: withDefault(
        negatableFlag(
          {positive: '--all', negative: '--no-all'},
          {
            description: message`symlink every monorepo package, not just the ones declared in the target's package.json`,
          },
        ),
        false,
      ),
      targetDir: argument(string({metavar: 'DIR'}), {
        description: message`the studio directory to symlink into ("." for the current dir)`,
      }),
    },
    {
      errors: {
        endOfInput: message`Target directory must be specified ("." for the current dir).`,
      },
    },
  ),
  {
    programName: 'symlinkDependencies',
    brief: message`Symlink this monorepo's packages into a target studio's node_modules`,
    help: {option: {names: ['-h', '--help']}},
    aboveError: 'usage',
  },
)

const notSanity = (dir: string) => dir !== '@sanity'
const prefix = (name: string) => `@sanity/${name}`
const normalize = (dir: string) => dir.replace(/@sanity\//g, `@sanity${path.sep}`)

const pkgPath = path.join(import.meta.dirname, '..', 'packages')
const rootPackages = fs.readdirSync(pkgPath).filter(notSanity)
const sanityPackages = fs.readdirSync(path.join(pkgPath, '@sanity')).map(prefix)
const packages = [...rootPackages, ...sanityPackages]

const targetPath = path.resolve(path.relative(process.cwd(), flags.targetDir))
const targetDepsPath = path.join(targetPath, 'node_modules')

let targetDeps = packages
if (!flags.all) {
  const targetPkg = JSON.parse(fs.readFileSync(path.join(targetPath, 'package.json'), 'utf8'))
  const targetDeclared = Object.assign({}, targetPkg.dependencies, targetPkg.devDependencies)
  targetDeps = Object.keys(targetDeclared)
}

// make sure node_modules/@sanity directory exists (e.g. in case it's ran in a project without a prior node_modules)
fs.mkdirSync(path.join(targetDepsPath, '@sanity'), {recursive: true})

const targetRootPackages = fs.readdirSync(targetDepsPath).filter(notSanity)
const targetSanityPackages = fs.readdirSync(path.join(targetDepsPath, '@sanity')).map(prefix)

if (targetDeps.includes('sanity')) {
  // in v3 studios, we'll want to explicitly link/keep `@sanity/cli`,
  // since it has the `sanity` cli binary
  targetDeps.push('@sanity/cli')
}

// All the dependencies in the root of node_modules and node_modules/@sanity
const targetPackages = [...targetRootPackages, ...targetSanityPackages, ...targetDeps]
const sharedPackages = flags.all
  ? packages
  : packages.filter((pkgName) => targetPackages.indexOf(pkgName) > -1)

const sharedDeclared = flags.all
  ? packages
  : packages.filter((pkgName) => targetDeps.indexOf(pkgName) > -1)

const removeFolders = sharedPackages
  .map(normalize)
  .map((dir) => path.join(targetDepsPath, dir))
  .filter((dir) => fs.existsSync(dir))

// First, remove all locally installed dependencies that exists as a package in our monorepo
console.log('Removing dependencies from node_modules:')
console.log(`\n  ${sharedPackages.join('\n  ')}\n`)

removeFolders.forEach((dir) => rimrafSync(dir))

// Secondly, symlink into node_modules, but only the dependencies declared in package.json
console.log('Symlinking dependencies to node_modules:\n')
sharedDeclared.forEach((dep) => {
  const sourceDepDir = path.join(pkgPath, normalize(dep))
  const targetDepDir = path.join(targetDepsPath, normalize(dep))

  console.log(`  ${sourceDepDir} -> ${targetDepDir}`)
  fs.symlinkSync(sourceDepDir, targetDepDir, 'dir')
})

console.log('\nDone!')
