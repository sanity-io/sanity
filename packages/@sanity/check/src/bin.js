#!/usr/bin/env node
/* eslint-disable no-console, no-process-env, no-process-exit */
import path from 'path'
import chalk from 'chalk'
import fsp from 'fs-promise'
import sanityCheck from './sanityCheck'
import pkg from '../package.json'
import publish from 'in-publish'

const tag = '[sanity-check]'
const args = process.argv.slice(2)
const relativeDir = args.filter(arg => arg[0] !== '-')[0]
const dir = path.resolve(process.cwd(), relativeDir || '.')
const manifestDir = path.join(dir, 'sanity.json')
const showHelp = args.includes('-h') || args.includes('--help')
const showVersion = args.includes('-v') || args.includes('--version')
const productionMode = (
  process.env.NODE_ENV === 'production'
  || publish.inPublish()
  || args.includes('-p')
  || args.includes('--production')
)

if (showHelp) {
  console.log('Usage: sanity-check [DIRECTORY]')
  console.log(`${pkg.description}.\n`)

  console.log('-p, --production  check production (compiled) paths')
  console.log('-v, --version     output version information and exit')
  console.log('-h, --help        display this help and exit\n')

  console.log('With no DIRECTORY, checks current directory.')
  process.exit(1)
}

if (showVersion) {
  console.log(`sanity-check ${pkg.version}`)
  process.exit()
}

fsp.readJson(manifestDir)
  .catch(err => {
    console.error(chalk.red(
      `${tag} Failed to read "${manifestDir}":\n${err.message}`
    ))

    process.exit(1)
  })
  .then(() => sanityCheck({dir, productionMode}))
  .catch(err => {
    console.error(chalk.red(
      err.sanityCheck ? `${tag}\n\n${err.message}` : err.stack
    ))

    process.exit(1)
  })
