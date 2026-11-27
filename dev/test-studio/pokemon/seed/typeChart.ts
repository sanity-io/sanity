import {type DamageRelation, type NamedResource} from './pokeapi'

export type DamageRelations = Record<DamageRelation, NamedResource[]>

export interface Matchup {
  type: string
  multiplier: number
}

export interface DefensiveMatchups {
  /** Attacking types that deal more than 1× damage, most effective first. */
  weaknesses: Matchup[]
  /** Attacking types that deal less than 1× but more than 0× damage, least effective first. */
  resistances: Matchup[]
  /** Attacking types that deal no damage. */
  immunities: string[]
}

/** How much damage a move of `attacking` deals to a Pokémon of `defending` types. */
export function damageMultiplier(
  attacking: string,
  defending: string[],
  relations: Map<string, DamageRelations>,
): number {
  let multiplier = 1
  for (const type of defending) {
    const relation = relations.get(type)
    if (!relation) continue
    const has = (key: DamageRelation) => relation[key].some((entry) => entry.name === attacking)
    if (has('no_damage_from')) multiplier *= 0
    else if (has('double_damage_from')) multiplier *= 2
    else if (has('half_damage_from')) multiplier *= 0.5
  }
  return multiplier
}

export function defensiveMatchups(
  defending: string[],
  attackingTypes: readonly string[],
  relations: Map<string, DamageRelations>,
): DefensiveMatchups {
  const all = attackingTypes.map((type) => ({
    type,
    multiplier: damageMultiplier(type, defending, relations),
  }))
  return {
    weaknesses: all.filter((m) => m.multiplier > 1).toSorted((a, b) => b.multiplier - a.multiplier),
    resistances: all
      .filter((m) => m.multiplier > 0 && m.multiplier < 1)
      .toSorted((a, b) => a.multiplier - b.multiplier),
    immunities: all.filter((m) => m.multiplier === 0).map((m) => m.type),
  }
}

/** Abilities that make a Pokémon immune to moves of a type, regardless of its own types. */
export const ABILITY_TYPE_IMMUNITIES: Record<string, string> = {
  'levitate': 'ground',
  'earth-eater': 'ground',
  'flash-fire': 'fire',
  'well-baked-body': 'fire',
  'volt-absorb': 'electric',
  'lightning-rod': 'electric',
  'motor-drive': 'electric',
  'water-absorb': 'water',
  'storm-drain': 'water',
  'dry-skin': 'water',
  'sap-sipper': 'grass',
}

export function formatMultiplier(multiplier: number): string {
  if (multiplier === 0.5) return '½×'
  if (multiplier === 0.25) return '¼×'
  return `${multiplier}×`
}
