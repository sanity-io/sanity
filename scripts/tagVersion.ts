import {tagVersion} from '@repo/bundle-manager'
import yargs from 'yargs'

const argv = yargs(process.argv.slice(2))
  .options({
    'tag': {type: 'string', demandOption: true},
    'target-version': {type: 'string', demandOption: true},
  })
  .parseSync()

tagVersion({tag: argv.tag, version: argv.targetVersion}).catch((err) => {
  console.error(err)
  process.exit(1)
})
