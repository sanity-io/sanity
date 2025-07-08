import boxen from 'boxen'

import {type CliCommandContext} from '../types'

export function printNewMajorVersionMessage(context: CliCommandContext): void {
  const {chalk} = context

  const v4Message = chalk.yellow.bold(
    'The `sanity` package is moving to v4 on July 15 and will require Node.js 20+.',
  )
  const message = `${v4Message}
Learn what this means for your apps at https://www.sanity.io/blog/a-major-version-bump-for-a-minor-reason`

  const boxedMessage = boxen(message, {
    padding: 1,
    margin: 1,
  })

  // Print to stderr to prevent garbling command output
  console.warn(boxedMessage)
}
