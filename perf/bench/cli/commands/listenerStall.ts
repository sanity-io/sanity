/**
 * `bench listener-stall` — Studio tabs over one HTTP/2 connection capped at the API's 100
 * concurrent streams, asserting on the `Studio Listener Stall Detected` telemetry each stall
 * fires (runner/session/listenerStall.ts). Pass/fail, not a measurement: nothing is reported or
 * stored. Runs against the customization build, which holds the listener tool workspace.
 */
import path from 'node:path'

import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {withDefault} from '@optique/core/modifiers'
import {type InferValue} from '@optique/core/parser'
import {command, constant, option} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'

import {BENCH_ROOT} from '../benchRoot'

export const listenerStallCommand = command(
  'listener-stall',
  object({
    action: constant('listener-stall'),
    dist: withDefault(
      option('--dist', string({metavar: 'DIR'}), {
        description: message`Path to the built customization studio (pnpm --filter bench build:customizations)`,
      }),
      path.join(BENCH_ROOT, 'dist-customizations'),
    ),
    headed: option('--headed', {description: message`Run the browser headed`}),
  }),
  {
    description: message`Check the listener stall telemetry over a connection capped at 100 HTTP/2 streams`,
  },
)

export type ListenerStallArgs = InferValue<typeof listenerStallCommand>
