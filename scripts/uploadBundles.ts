import path from 'node:path'

import {uploadBundles} from '@repo/bundle-manager'
import {readPackageUpSync as readPackageUp} from 'read-package-up'
import yargs from 'yargs'

const ROOT_PACKAGE = readPackageUp({cwd: path.dirname(new URL(import.meta.url).pathname)})

if (ROOT_PACKAGE?.packageJson.name !== 'sanity-root') {
  throw new Error('Script must be run from within the Sanity monorepo')
}

const cwd = path.dirname(ROOT_PACKAGE.path)

const argv = yargs(process.argv.slice(2))
  .options({
    'tag': {type: 'string', demandOption: true},
    'target-version': {type: 'string', demandOption: true},
  })
  .parseSync()

uploadBundles({cwd, tag: argv.tag, version: argv.targetVersion}).catch((err) => {
  console.error(err)
  process.exit(1)
})
