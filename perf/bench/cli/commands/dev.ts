import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {command, constant, option} from '@optique/core/primitives'

export const devCommand = command(
  'dev',
  object({
    action: constant('dev'),
    customizations: option('--customizations', {
      description: message`Serve the customization studio (studio-customizations/) with every customization scenario's fixture seeded, instead of the pristine one`,
    }),
  }),
  {
    description: message`Start the mock Content Lake plus sanity dev for interactive debugging (no auth needed)`,
  },
)
