/**
 * `bench bundle-steps` — the JS a first visit loads at each step (the login
 * screen, the return from the login provider, and a reload with valid auth),
 * as raw, gzip and brotli bytes (runner/bundleSteps.ts). The chunk sets are
 * exact for a build, so a single pass is the measurement: no sampling, no
 * throttling.
 */
import path from 'node:path'

import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {optional, withDefault} from '@optique/core/modifiers'
import {type InferValue} from '@optique/core/parser'
import {command, constant, option} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'

import {BENCH_ROOT} from '../benchRoot'

export const bundleStepsCommand = command(
  'bundle-steps',
  object({
    action: constant('bundle-steps'),
    dist: withDefault(
      option('--dist', string({metavar: 'DIR'}), {
        description: message`Path to the built studio (sanity build output)`,
      }),
      path.join(BENCH_ROOT, 'dist'),
    ),
    jsonOut: optional(
      option('--json-out', string({metavar: 'FILE'}), {
        description: message`Write the report (chunk paths and sizes per step) as JSON`,
      }),
    ),
    compare: optional(
      option('--compare', string({metavar: 'FILE'}), {
        description: message`A previous --json-out report to print a before/after table against`,
      }),
    ),
    headed: option('--headed', {description: message`Show the browser`}),
  }),
  {
    description: message`Measure the JS (raw, gzip, brotli) a first visit loads at the login screen, after logging in, and on a reload with valid auth`,
  },
)

export type BundleStepsArgs = InferValue<typeof bundleStepsCommand>
