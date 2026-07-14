import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {optional} from '@optique/core/modifiers'
import {argument, command, constant} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'

export const reportCommand = command(
  'report',
  object({
    action: constant('report'),
    dir: optional(
      argument(string({metavar: 'DIR'}), {
        description: message`Results directory to merge (default: perf/bench/results)`,
      }),
    ),
  }),
  {
    description: message`Merge shard result JSON files into one document and render the markdown report`,
  },
)
