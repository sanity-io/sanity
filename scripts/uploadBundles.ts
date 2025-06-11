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

    // JS files are cached for 1y, so only use this for development/testing purposes
    'as-version': {
      hidden: true,
      type: 'string',
      demandOption: false,

      description: `Specify the version to upload bundles as. !!Only for development purposes!!`,
    },
  })
  .parseSync()

uploadBundles({cwd, tag: argv.tag, asVersion: argv.asVersion}).catch((err) => {
  console.error(err)
  process.exit(1)
})
