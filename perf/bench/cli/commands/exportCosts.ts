/**
 * `bench export-costs` — what each runtime export of the `sanity` entries an auto-updating
 * studio loads costs on the login and authenticated steps (parser only; the implementation is
 * exportCost/run.ts, loaded lazily).
 */
import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {multiple, withDefault} from '@optique/core/modifiers'
import {type InferValue} from '@optique/core/parser'
import {command, constant, option} from '@optique/core/primitives'
import {integer, string} from '@optique/core/valueparser'

export const exportCostsCommand = command(
  'export-costs',
  object({
    action: constant('export-costs'),
    outDir: withDefault(
      option('--out-dir', string({metavar: 'DIR'}), {
        description: message`Where the builds and export-costs.md / export-costs.json go`,
      }),
      'perf/bench/.export-costs',
    ),
    verify: withDefault(
      option('--verify', integer({min: 0}), {
        description: message`Rebuild without each of the N costliest exports and measure every step end to end`,
      }),
      10,
    ),
    verifyName: multiple(
      option('--verify-name', string({metavar: 'ENTRY:NAME'}), {
        description: message`Also verify this export (repeatable; ENTRY defaults to index, the sanity entry)`,
      }),
    ),
    repeat: withDefault(
      option('--repeat', integer({min: 1}), {
        description: message`Measure the baseline and each rebuild N times and report the median and range`,
      }),
      1,
    ),
    top: withDefault(
      option('--top', integer({min: 1}), {
        description: message`Rows per entry in the markdown tables`,
      }),
      25,
    ),
    headed: option('--headed', {
      description: message`Show the browser`,
    }),
  }),
  {
    description: message`Attribute the JS an auto-updating studio loads at login and after auth to the runtime exports of each sanity entry`,
  },
)

export type ExportCostsArgs = InferValue<typeof exportCostsCommand>
