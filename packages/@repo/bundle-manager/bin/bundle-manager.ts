#!/usr/bin/env -S pnpm tsx

import yargs from 'yargs'

import {tagVersion, uploadBundles} from '../src'
import {verify} from '../src/commands/verify'

// oxlint-disable-next-line no-unused-expressions
yargs(process.argv.slice(2))
  .usage('$0 <command>')
  .command({
    command: 'publish',
    describe: 'Publish package bundles from dist folders',
    builder: (cmd) =>
      cmd.options({
        'tag': {type: 'string', demandOption: false},
        // !!WARNING!! JS files are cached for 1y, so only use this only for development/testing purposes
        'as-version': {
          hidden: true,
          type: 'string',
          demandOption: false,
          description: `Specify the version to upload bundles as. !!WARNING!! Only for development purposes!`,
        },
      }),
    handler: (args) => {
      uploadBundles({tag: args.tag, asVersion: args.asVersion}).catch((err) => {
        console.error(err)
        process.exit(1)
      })
    },
  })
  .command({
    command: 'tag',
    describe: 'Tag a version',
    builder: (cmd) =>
      cmd.options({
        'tag': {type: 'string', demandOption: true},
        'target-version': {type: 'string', demandOption: true},
      }),
    handler: (args) => {
      tagVersion({tag: args.tag, version: args.targetVersion}).catch((err) => {
        console.error(err)
        process.exit(1)
      })
    },
  })
  .command({
    command: 'verify',
    describe: 'Verify read/write access to bucket',
    handler: () => verify(),
  })
  .demandCommand(1, 'must provide a valid command')
  .help('h')
  .alias('h', 'help').argv
