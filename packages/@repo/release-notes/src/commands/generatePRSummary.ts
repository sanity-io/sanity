import path from 'node:path'

import {MONOREPO_ROOT} from '@repo/utils'
import {ConventionalChangelog} from 'conventional-changelog'

export async function generatePRSummary(args: {version?: string}) {
  const {version} = args

  const generator = new ConventionalChangelog()
    .readPackage(path.join(MONOREPO_ROOT, 'package.json'))
    .context({version})
    .options({
      outputUnreleased: true,
    })
    .loadPreset('conventionalcommits')

  for await (const details of generator.write(false)) {
    console.log(details)
  }
}
