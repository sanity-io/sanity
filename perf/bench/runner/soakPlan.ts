import {DEFAULT_SOAK_SETTLE_MINUTE, soakSettleMinute} from '@repo/utils/soak-settle'

import {type BenchScenario, type InteractionTarget} from '../scenarios/types'
import {mulberry32} from '../stats/rng'

/** The field a soak types into: the plan's `target`, else `interactions[0]`. */
export function soakTypingTarget(scenario: BenchScenario): InteractionTarget {
  const targetPath = scenario.soak?.target
  const target = targetPath
    ? scenario.interactions.find((interaction) => interaction.fieldPath === targetPath)
    : scenario.interactions[0]
  if (target === undefined) {
    throw new Error(
      targetPath
        ? `Scenario "${scenario.name}" soak target "${targetPath}" is not one of its interactions`
        : `Scenario "${scenario.name}" has no interaction target to soak`,
    )
  }
  return target
}

/** The minute a scenario's soak of `minutes` reaches steady state. */
export function soakSettleMinuteFor(scenario: BenchScenario, minutes: number): number {
  return soakSettleMinute(minutes, scenario.soak?.settleMinute ?? DEFAULT_SOAK_SETTLE_MINUTE)
}

function seededPermutation(count: number, random: () => number): number[] {
  return Array.from({length: count}, (_, index) => ({index, sortKey: random()}))
    .toSorted((first, second) => first.sortKey - second.sortKey)
    .map((entry) => entry.index)
}

/**
 * The excursion index for each of `cycles` soak cycles: rounds of a seeded
 * shuffle, so every excursion runs once per round in an order that is the
 * same on every run with the same seed.
 */
export function soakExcursionSchedule(
  excursionCount: number,
  seed: number,
  cycles: number,
): number[] {
  if (excursionCount === 0) return []
  const random = mulberry32(seed)
  const rounds = Math.ceil(cycles / excursionCount)
  return Array.from({length: rounds}, () => seededPermutation(excursionCount, random))
    .flat()
    .slice(0, cycles)
}
