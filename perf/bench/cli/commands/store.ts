import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {optional} from '@optique/core/modifiers'
import {argument, command, constant} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'

export const storeCommand = command(
  'store',
  object({
    action: constant('store'),
    file: optional(
      argument(string({metavar: 'FILE'}), {
        description: message`Merged result document (default: perf/bench/results/merged.json)`,
      }),
    ),
  }),
  {
    description: message`Store a merged run as a benchRun document in the metrics-studio project (requires BENCH_METRICS_WRITE_TOKEN)`,
  },
)
