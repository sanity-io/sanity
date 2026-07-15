import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {command, constant} from '@optique/core/primitives'

export const devCommand = command('dev', object({action: constant('dev')}), {
  description: message`Start the mock Content Lake plus sanity dev for interactive debugging (no auth needed)`,
})
