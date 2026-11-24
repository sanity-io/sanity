import {EVOLUTION_TRIGGERS} from '../constants'
import {type ChainLink, type EvolutionDetail, type NamedResource} from './pokeapi'
import {listFormat, titleCase, withArticle as article} from './text'

type NameOf = (resource: NamedResource) => string

function conditions(detail: EvolutionDetail, nameOf: NameOf): string[] {
  const named = (resource: NamedResource | null | undefined) =>
    resource ? nameOf(resource) : undefined
  return [
    detail.gender === 1 && 'if female',
    detail.gender === 2 && 'if male',
    detail.held_item && `while holding ${article(named(detail.held_item)!)}`,
    detail.known_move && `while knowing ${named(detail.known_move)}`,
    detail.known_move_type &&
      `while knowing ${article(`${named(detail.known_move_type)}-type`)} move`,
    detail.location && `at ${named(detail.location)}`,
    detail.region && `in ${named(detail.region)}`,
    detail.near_special_rock && 'near a special rock',
    detail.min_happiness && 'with high friendship',
    detail.min_beauty && 'with high beauty',
    detail.min_affection && 'with high affection',
    detail.needs_overworld_rain && 'while it is raining',
    detail.party_species && `with ${named(detail.party_species)} in the party`,
    detail.party_type && `with ${article(`${named(detail.party_type)}-type`)} Pokémon in the party`,
    detail.relative_physical_stats === 1 && 'when its Attack is higher than its Defense',
    detail.relative_physical_stats === -1 && 'when its Defense is higher than its Attack',
    detail.relative_physical_stats === 0 && 'when its Attack equals its Defense',
    detail.time_of_day && `during the ${detail.time_of_day.replace(/-/g, ' ')}`,
    detail.trade_species && `when traded for ${named(detail.trade_species)}`,
    detail.turn_upside_down && 'while holding the console upside down',
    detail.min_steps && `after walking ${detail.min_steps.toLocaleString('en-US')} steps`,
    detail.needs_multiplayer && 'in a multiplayer session',
  ].filter((condition): condition is string => typeof condition === 'string' && condition !== '')
}

function method(detail: EvolutionDetail, nameOf: NameOf): string {
  const usedMove = detail.used_move ? nameOf(detail.used_move) : 'a certain move'
  const times = detail.min_move_count ? ` ${detail.min_move_count} times` : ''
  switch (detail.trigger.name) {
    case 'level-up':
      return detail.min_level ? `at level ${detail.min_level}` : 'when leveled up'
    case 'use-item':
      return detail.item ? `using ${article(nameOf(detail.item))}` : 'using an item'
    case 'trade':
      return 'when traded'
    case 'shed':
      return 'by shedding its shell, with a free party slot and a spare Poké Ball'
    case 'spin':
      return 'when its trainer spins around while it holds a Sweet'
    case 'tower-of-darkness':
      return 'by conquering the Tower of Darkness'
    case 'tower-of-waters':
      return 'by conquering the Tower of Waters'
    case 'three-critical-hits':
      return 'after landing three critical hits in one battle'
    case 'take-damage':
      return detail.min_damage_taken
        ? `after taking at least ${detail.min_damage_taken} damage without fainting`
        : 'after taking damage without fainting'
    case 'in-battle-level-up':
      return 'when leveled up during a battle'
    case 'agile-style-move':
      return `after using ${usedMove} in the Agile Style${times}`
    case 'strong-style-move':
      return `after using ${usedMove} in the Strong Style${times}`
    case 'recoil-damage':
      return 'after losing a lot of HP to recoil damage without fainting'
    case 'use-move':
      return `after using ${usedMove}${times}`
    case 'three-defeated-bisharp':
      return 'after defeating three Bisharp that lead packs of Pawniard'
    case 'gimmighoul-coins':
      return 'after collecting 999 Gimmighoul Coins'
    case 'meltan-candies':
      return 'when fed 400 Meltan Candy in Pokémon GO'
    default:
      return `by ${titleCase(detail.trigger.name).toLowerCase()}`
  }
}

/** A sentence fragment such as "at level 16" or "when traded while holding a Metal Coat". */
export function describeEvolutionMethod(detail: EvolutionDetail, nameOf: NameOf): string {
  return [method(detail, nameOf), ...conditions(detail, nameOf)].join(' ')
}

/** Every distinct way to evolve, across all games, joined with "or". */
export function describeEvolutionMethods(details: EvolutionDetail[], nameOf: NameOf): string {
  const methods = [...new Set(details.map((detail) => describeEvolutionMethod(detail, nameOf)))]
  return methods.length > 0 ? listFormat(methods, 'or') : 'by an unknown method'
}

/** The structured fields of a `pokemonEvolution` entry, from the main way to evolve. */
export function evolutionFields(details: EvolutionDetail[], nameOf: NameOf) {
  const detail = details.find((candidate) => candidate.is_default) ?? details[0]
  if (!detail) return {trigger: 'other'}
  const trigger = EVOLUTION_TRIGGERS.some((option) => option.value === detail.trigger.name)
    ? detail.trigger.name
    : 'other'
  const extra = conditions(detail, nameOf)
  return {
    trigger,
    ...(detail.min_level && {minLevel: detail.min_level}),
    ...(detail.item && {item: nameOf(detail.item)}),
    ...(extra.length > 0 && {condition: extra.join(', ')}),
    method: describeEvolutionMethods(details, nameOf),
  }
}

export interface ChainInfo {
  /** 1 for a Pokémon that does not evolve from anything, 2 for its evolution and so on. */
  stage: number
  /** How many stages the longest branch of the evolution line has. */
  stages: number
  /** The species that evolve into this one, and how. */
  from?: {species: string; method: string}
  /** The whole line, one sentence per evolution. */
  summary: string
}

/** Walks an evolution chain, describing it once for every species in it. */
export function describeChain(chain: ChainLink, nameOf: NameOf): Map<string, ChainInfo> {
  const sentences: string[] = []
  const nodes: {species: string; stage: number; from?: ChainInfo['from']}[] = []
  let stages = 1
  const walk = (link: ChainLink, stage: number, from?: ChainInfo['from']) => {
    nodes.push({species: link.species.name, stage, from})
    stages = Math.max(stages, stage)
    for (const next of link.evolves_to) {
      const how = describeEvolutionMethods(next.evolution_details, nameOf)
      sentences.push(`${nameOf(link.species)} evolves into ${nameOf(next.species)} ${how}.`)
      walk(next, stage + 1, {species: link.species.name, method: how})
    }
  }
  walk(chain, 1)
  const summary =
    sentences.length > 0 ? sentences.join(' ') : `${nameOf(chain.species)} does not evolve.`
  return new Map(nodes.map((node) => [node.species, {...node, stages, summary}]))
}
