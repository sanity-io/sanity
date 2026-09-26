import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {optional} from '@optique/core/modifiers'
import {command, constant, option} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'

export const devCommand = command(
  'dev',
  object({
    action: constant('dev'),
    customizations: option('--customizations', {
      description: message`Serve the customization studio (studio-customizations/) with every customization scenario's fixture seeded, instead of the pristine one`,
    }),
    scenario: optional(
      option('--scenario', string({metavar: 'NAME'}), {
        description: message`Seed and open one registered scenario, with its feature modules active (default: singleString)`,
      }),
    ),
  }),
  {
    description: message`Start the mock Content Lake plus sanity dev for interactive debugging (no auth needed)`,
  },
)
