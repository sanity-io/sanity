import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {withDefault} from '@optique/core/modifiers'
import {command, constant, option} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'

export const devCommand = command(
  'dev',
  object({
    action: constant('dev'),
    scenario: withDefault(
      option('--scenario', string({metavar: 'NAME'}), {
        description: message`Scenario to seed and open (default: singleString)`,
      }),
      'singleString',
    ),
  }),
  {
    description: message`Start the mock Content Lake plus sanity dev for interactive debugging (no auth needed)`,
  },
)
