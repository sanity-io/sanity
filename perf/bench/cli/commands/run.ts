/**
 * `bench run` — the benchmark runner (parser only; the implementation loads
 * lazily from runImpl.ts so CLI commands that don't need the runner — e.g.
 * prepare-reference and report in CI — never resolve its workspace imports
 * such as @sanity/mutator, which may not be built in those jobs).
 * - Absolute mode: `bench run --scenario singleString` (one build).
 * - A/B mode: add `--reference-dist <path>` — interleaved sampling with
 *   dynamic stopping and bootstrap CIs (runner/orchestrator.ts). For a local
 *   self-test (compare the build against itself), build the reference
 *   config from the same tree first:
 *   `pnpm --filter bench build:reference-config`, then pass
 *   `--reference-dist perf/bench/.reference/dist` (through the `pnpm bench`
 *   script chain, relative paths resolve against the repo root — not
 *   perf/bench).
 */
import path from 'node:path'

import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {map, multiple, optional, withDefault} from '@optique/core/modifiers'
import {type InferValue} from '@optique/core/parser'
import {command, constant, option} from '@optique/core/primitives'
import {choice, integer, string} from '@optique/core/valueparser'

import {BENCH_ROOT} from '../benchRoot'

export const runCommand = command(
  'run',
  object({
    action: constant('run'),
    scenario: multiple(
      option('--scenario', string({metavar: 'NAME'}), {
        description: message`Scenario to run, repeatable (default: all — see the scenarios command)`,
      }),
    ),
    mode: withDefault(
      option('--mode', choice(['interaction', 'pageload', 'soak', 'inp']), {
        description: message`What to measure`,
      }),
      'interaction' as const,
    ),
    minutes: withDefault(
      option('--minutes', integer({min: 1}), {
        description: message`Soak duration in minutes (soak mode: sustained editing, every series should stay flat)`,
      }),
      10,
    ),
    sessions: withDefault(
      option('--sessions', integer({min: 1}), {
        description: message`Sessions per scenario (absolute mode) / min sessions per side (A/B)`,
      }),
      6,
    ),
    maxSessions: withDefault(
      option('--max-sessions', integer({min: 1}), {
        description: message`Max sessions per side (A/B)`,
      }),
      20,
    ),
    budget: withDefault(
      option('--budget', integer({min: 1}), {
        description: message`Per-scenario wall-clock cap in seconds (A/B)`,
      }),
      8 * 60,
    ),
    dist: withDefault(
      option('--dist', string({metavar: 'DIR'}), {
        description: message`Path to the built experiment studio (sanity build output)`,
      }),
      path.join(BENCH_ROOT, 'dist'),
    ),
    referenceDist: optional(
      option('--reference-dist', string({metavar: 'DIR'}), {
        description: message`Path to the built reference studio — enables A/B mode`,
      }),
    ),
    seed: withDefault(
      option('--seed', integer(), {
        description: message`PRNG seed (same seed → identical bootstrap intervals)`,
      }),
      1,
    ),
    headed: option('--headed', {description: message`Run the browser headed`}),
    networkEmulation: map(
      option('--no-network-emulation', {
        description: message`Disable the Fast-4G network emulation in pageLoad mode`,
      }),
      (disabled) => !disabled,
    ),
    jsonOut: optional(
      option('--json-out', string({metavar: 'FILE'}), {
        description: message`Write the run result as a BenchRunDocument JSON file`,
      }),
    ),
    failOnVerdict: option('--fail-on-verdict', {
      description: message`Exit non-zero unless every comparison gates neutral (used by the self-test)`,
    }),
    throttle: withDefault(
      option('--throttle', integer({min: 1}), {
        description: message`CPU throttling rate (1 = none)`,
      }),
      4,
    ),
  }),
  {
    description: message`Run benchmarks against the built studio (interaction, pageload, soak, or inp)`,
  },
)

export type RunArgs = InferValue<typeof runCommand>
