/**
 * Fetches everything the Pokédex workspace holds from PokéAPI and turns it into documents.
 *
 * Besides the structured fields, every document gets a `summary`: a readable profile that joins
 * its structured data into sentences (type matchups, stats, evolution methods, moves), so that
 * semantic search can match natural-language queries such as "weak to fire" or "evolves with a
 * Moon Stone" against it.
 */
import {
  MOVE_CATEGORIES,
  POKEMON_ROLES,
  POKEMON_SHAPES,
  POKEMON_TYPE_COLORS,
  POKEMON_TYPE_NAMES,
  type PokemonTypeName,
  STAT_NAMES,
} from '../constants'
import {describeChain, evolutionFields, type ChainInfo} from './evolution'
import {type Doc, ids, reference} from './integrity'
import {
  API,
  type Ability,
  type ChainLink,
  type Generation,
  getJson,
  idFromUrl,
  mapConcurrent,
  type Move,
  type NamedResource,
  type Pokemon,
  type Species,
  type TypeResource,
  type Version,
  type VersionGroup,
} from './pokeapi'
import {
  cleanText,
  english,
  latestEnglish,
  listFormat,
  paragraph,
  titleCase,
  uniqueEnglishTexts,
  withArticle,
} from './text'
import {
  ABILITY_TYPE_IMMUNITIES,
  type DamageRelations,
  defensiveMatchups,
  formatMultiplier,
} from './typeChart'

export interface ImageSource {
  url: string
  /** Crops the image to its visible pixels, for sprites that are mostly transparent padding. */
  cropToContent: boolean
}

export interface BuildOptions {
  /** Only seed the first `limit` species, and the abilities and moves they use. */
  limit?: number
  concurrency: number
  log?: (message: string) => void
}

export interface BuiltDocuments {
  generationDocs: Doc[]
  typeDocs: Doc[]
  abilityDocs: Doc[]
  moveDocs: Doc[]
  pokemonDocs: Doc[]
  images: Map<string, ImageSource>
}

/** Moves that heal or cure allies, which make a Pokémon a healer rather than just self-sustaining. */
const SUPPORT_HEALING_MOVES = new Set([
  'heal-pulse',
  'wish',
  'life-dew',
  'floral-healing',
  'heal-bell',
  'aromatherapy',
  'healing-wish',
  'lunar-dance',
  'jungle-healing',
  'lunar-blessing',
  'pollen-puff',
  'pain-split',
])

/** Version groups whose learnsets are partial or follow other rules than the core series. */
const SIDE_VERSION_GROUP = /^(legends-|lets-go-|colosseum$|xd$|red-green-japan$|blue-japan$)/

const HABITAT_PHRASES: Record<string, string> = {
  'cave': 'lives in caves',
  'forest': 'lives in forests',
  'grassland': 'lives in grasslands',
  'mountain': 'lives in the mountains',
  'rare': 'is rarely seen in the wild',
  'rough-terrain': 'lives in rough terrain',
  'sea': 'lives in the sea',
  'urban': 'lives in urban areas',
  'waters-edge': "lives by the water's edge",
}

const optionTitle = (options: {title: string; value: string}[], value: string | undefined) =>
  options.find((option) => option.value === value)?.title

/** Battle roles derived from base stats and the moves a Pokémon learns by leveling up. */
export function deriveRoles(
  stats: Record<(typeof STAT_NAMES)[number]['name'], number>,
  levelUpMoves: string[],
): string[] {
  const roles: string[] = []
  const offense = Math.max(stats.attack, stats.specialAttack)
  if (stats.speed >= 110) roles.push('very-fast')
  else if (stats.speed >= 90) roles.push('fast')
  else if (stats.speed <= 45) roles.push('slow')
  if (offense >= 90) {
    if (Math.abs(stats.attack - stats.specialAttack) <= 10) roles.push('mixed-attacker')
    else roles.push(stats.attack > stats.specialAttack ? 'physical-attacker' : 'special-attacker')
  }
  if (stats.speed >= 95 && offense >= 95) roles.push('sweeper')
  if (stats.defense >= 110) roles.push('physical-wall')
  if (stats.specialDefense >= 110) roles.push('special-wall')
  if (stats.hp + stats.defense + stats.specialDefense >= 300) roles.push('tank')
  if (offense >= 110 && (stats.hp + stats.defense + stats.specialDefense) / 3 <= 60) {
    roles.push('glass-cannon')
  }
  if (levelUpMoves.some((move) => SUPPORT_HEALING_MOVES.has(move))) roles.push('healer')
  return roles
}

/** Names an alternate form from its PokéAPI name, for example `vulpix-alola` → "Alolan Vulpix". */
export function describeVariety(varietyName: string, speciesName: string, displayName: string) {
  const suffix = varietyName.startsWith(`${speciesName}-`)
    ? varietyName.slice(speciesName.length + 1)
    : varietyName
  const tokens = suffix.split('-')
  const take = (token: string) => {
    const index = tokens.indexOf(token)
    if (index === -1) return false
    tokens.splice(index, 1)
    return true
  }
  let kind = 'other'
  let name = displayName
  if (tokens.includes('cap')) {
    // Pikachu's caps, like the Alola Cap, are not regional forms
  } else if (take('mega')) {
    kind = 'mega'
    name = `Mega ${displayName}`
  } else if (take('gmax')) {
    kind = 'gigantamax'
    name = `Gigantamax ${displayName}`
  } else if (take('primal')) {
    kind = 'primal'
    name = `Primal ${displayName}`
  } else {
    for (const [token, regional] of [
      ['alola', 'alolan'],
      ['galar', 'galarian'],
      ['hisui', 'hisuian'],
      ['paldea', 'paldean'],
    ] as const) {
      if (take(token)) {
        kind = regional
        name = `${titleCase(regional)} ${displayName}`
        break
      }
    }
  }
  const rest = tokens.filter(Boolean)
  if (kind === 'mega' && rest.length === 1 && rest[0].length === 1) {
    return {kind, name: `${name} ${rest[0].toUpperCase()}`}
  }
  const label = titleCase(rest.join('-')).replace(/\bPhd\b/, 'PhD')
  return {kind, name: rest.length > 0 ? `${name} (${label})` : name}
}

function replaceEffectChance(text: string | undefined, chance: number | null) {
  return text?.replace(/\$effect_chance/g, String(chance ?? ''))
}

export async function buildDocuments({
  limit,
  concurrency,
  log = console.log,
}: BuildOptions): Promise<BuiltDocuments> {
  const all = <T, R>(items: T[], fn: (item: T, index: number) => Promise<R>) =>
    mapConcurrent(items, concurrency, fn)

  /* Generations, games and types -------------------------------------------------------------- */

  const {results: generationList} = await getJson<{results: NamedResource[]}>(
    `${API}/generation?limit=100`,
  )
  const generations = await all(generationList, (g) => getJson<Generation>(g.url))
  const versionGroups = await all(
    generations.flatMap((generation) => generation.version_groups),
    (group) => getJson<VersionGroup>(group.url),
  )
  const versions = await all(
    versionGroups.flatMap((group) => group.versions),
    (version) => getJson<Version>(version.url),
  )
  const versionNames = new Map(
    versions.map((version) => [version.name, english(version.names)?.name ?? version.name]),
  )
  const versionGroupByName = new Map(versionGroups.map((group) => [group.name, group]))
  const versionGroupName = (name: string) => {
    const group = versionGroupByName.get(name)
    return group
      ? group.versions.map((version) => versionNames.get(version.name) ?? version.name).join(' / ')
      : titleCase(name)
  }
  const generationIds = new Map(generations.map((g) => [g.id, ids.generation(g.id)]))
  const generationTitle = (resource: NamedResource) => {
    const generation = generations.find((g) => g.id === idFromUrl(resource.url))
    return generation ? (english(generation.names)?.name ?? `Generation ${generation.id}`) : ''
  }
  const generationRef = (resource: NamedResource) =>
    reference(generationIds.get(idFromUrl(resource.url))!)

  const types = await all([...POKEMON_TYPE_NAMES], (name) =>
    getJson<TypeResource>(`${API}/type/${name}`),
  )
  const typeNames = new Set<string>(POKEMON_TYPE_NAMES)
  const typeTitles = new Map(
    types.map((t) => [t.name, english(t.names)?.name ?? titleCase(t.name)]),
  )
  const typeTitle = (name: string) => typeTitles.get(name) ?? titleCase(name)
  const relations = new Map<string, DamageRelations>(types.map((t) => [t.name, t.damage_relations]))

  /* Species and their forms ------------------------------------------------------------------- */

  const {results: speciesList} = await getJson<{results: NamedResource[]}>(
    `${API}/pokemon-species?limit=100000`,
  )
  const selectedSpecies = speciesList
    .toSorted((a, b) => idFromUrl(a.url) - idFromUrl(b.url))
    .slice(0, limit)
  log(`Fetching ${selectedSpecies.length} Pokémon species from PokéAPI…`)
  const species = await all(selectedSpecies, (s) => getJson<Species>(s.url))
  const speciesNames = new Set(species.map((s) => s.name))
  const speciesTitles = new Map(
    species.map((s) => [s.name, english(s.names)?.name ?? titleCase(s.name)]),
  )

  const varietyList = species.flatMap((s) =>
    s.varieties.map((variety) => ({species: s.name, ...variety})),
  )
  log(`Fetching ${varietyList.length} Pokémon forms…`)
  const varietyData = await all(varietyList, (v) => getJson<Pokemon>(v.pokemon.url))
  const varietiesBySpecies = new Map<string, {isDefault: boolean; pokemon: Pokemon}[]>()
  const speciesOfPokemon = new Map<string, string>()
  varietyList.forEach((variety, index) => {
    const list = varietiesBySpecies.get(variety.species) ?? []
    list.push({isDefault: variety.is_default, pokemon: varietyData[index]})
    varietiesBySpecies.set(variety.species, list)
    speciesOfPokemon.set(variety.pokemon.name, variety.species)
  })
  const defaultPokemon = (s: Species) => {
    const list = varietiesBySpecies.get(s.name)!
    return (list.find((v) => v.isDefault) ?? list[0]).pokemon
  }

  /* Moves ------------------------------------------------------------------------------------- */

  const moveUrls =
    limit === undefined
      ? (await getJson<{results: NamedResource[]}>(`${API}/move?limit=100000`)).results.map(
          (move) => move.url,
        )
      : [...new Set(varietyData.flatMap((pokemon) => pokemon.moves.map((entry) => entry.move.url)))]
  log(`Fetching ${moveUrls.length} moves…`)
  const moves = (await all(moveUrls, (url) => getJson<Move>(url))).filter((move) =>
    typeNames.has(move.type.name),
  )
  const moveByName = new Map(moves.map((move) => [move.name, move]))
  const moveTitle = (name: string) => {
    const move = moveByName.get(name)
    return move ? (english(move.names)?.name ?? titleCase(name)) : titleCase(name)
  }
  /** The species that learn a move, or `undefined` when a learner is outside the seeded set. */
  const learnersOf = (move: Move) => {
    const learners = new Set<string>()
    let complete = true
    for (const pokemon of move.learned_by_pokemon) {
      const speciesName = speciesOfPokemon.get(pokemon.name)
      if (speciesName) learners.add(speciesName)
      else complete = false
    }
    return {learners: [...learners], complete}
  }
  const signatureMovesBySpecies = new Map<string, string[]>()
  for (const move of moves) {
    const {learners, complete} = learnersOf(move)
    if (complete && learners.length === 1) {
      signatureMovesBySpecies.set(learners[0], [
        ...(signatureMovesBySpecies.get(learners[0]) ?? []),
        move.name,
      ])
    }
  }

  /* Abilities --------------------------------------------------------------------------------- */

  const abilityUrls = [
    ...new Map(
      varietyData.flatMap((pokemon) =>
        pokemon.abilities.map((entry) => [entry.ability.name, entry.ability.url]),
      ),
    ),
  ]
  log(`Fetching ${abilityUrls.length} abilities…`)
  const abilities = await all(abilityUrls, ([, url]) => getJson<Ability>(url))
  const abilityTitles = new Map(
    abilities.map((ability) => [
      ability.name,
      english(ability.names)?.name ?? titleCase(ability.name),
    ]),
  )
  const abilityTitle = (name: string) => abilityTitles.get(name) ?? titleCase(name)
  const abilityShortEffects = new Map<string, string | undefined>()

  /* Evolution chains -------------------------------------------------------------------------- */

  const chainUrls = [...new Set(species.flatMap((s) => s.evolution_chain?.url ?? []))]
  log(`Fetching ${chainUrls.length} evolution chains…`)
  const chains = await all(chainUrls, (url) => getJson<{chain: ChainLink}>(url))

  /** English names for anything an evolution condition can mention. */
  const nameOf = (resource: NamedResource) => {
    if (resource.url.includes('/pokemon-species/')) {
      return speciesTitles.get(resource.name) ?? titleCase(resource.name)
    }
    if (resource.url.includes('/move/')) return moveTitle(resource.name)
    if (resource.url.includes('/type/')) return typeTitle(resource.name)
    return titleCase(resource.name)
  }
  const chainInfo = new Map<string, ChainInfo>()
  const evolutionsBySpecies = new Map<string, ChainLink[]>()
  for (const {chain} of chains) {
    for (const [name, info] of describeChain(chain, nameOf)) chainInfo.set(name, info)
    const walk = (link: ChainLink) => {
      evolutionsBySpecies.set(link.species.name, link.evolves_to)
      link.evolves_to.forEach(walk)
    }
    walk(chain)
  }

  /* Documents --------------------------------------------------------------------------------- */

  const images = new Map<string, ImageSource>()
  const flavorTextEntries = (entries: {text: string; games: string[]}[]) =>
    entries.map((entry, index) => ({
      _type: 'pokemonFlavorTextEntry',
      _key: `entry${index}`,
      text: entry.text,
      games: entry.games,
    }))

  const abilityDocs: Doc[] = abilities.map((ability) => {
    const effect = english(ability.effect_entries)
    const flavorTexts = uniqueEnglishTexts(
      ability.flavor_text_entries,
      (entry) => entry.flavor_text,
      (entry) => entry.version_group && versionGroupName(entry.version_group.name),
    )
    const latestFlavorText = cleanText(latestEnglish(ability.flavor_text_entries)?.flavor_text)
    const shortEffect = cleanText(effect?.short_effect) ?? latestFlavorText
    abilityShortEffects.set(ability.name, shortEffect)
    const holders = species.flatMap((s) => {
      const slot = defaultPokemon(s).abilities.find((entry) => entry.ability.name === ability.name)
      return slot ? [{name: speciesTitles.get(s.name)!, hidden: slot.is_hidden}] : []
    })
    const name = abilityTitle(ability.name)
    const regular = holders.filter((holder) => !holder.hidden).map((holder) => holder.name)
    const hidden = holders.filter((holder) => holder.hidden).map((holder) => holder.name)
    return {
      _id: ids.ability(ability.name),
      _type: 'pokemonAbility',
      name,
      slug: {_type: 'slug', current: ability.name},
      generation: generationRef(ability.generation),
      isMainSeries: ability.is_main_series,
      shortEffect,
      effect: cleanText(effect?.effect),
      flavorText: latestFlavorText,
      flavorTextEntries: flavorTextEntries(flavorTexts),
      pokemonCount: holders.length,
      summary: paragraph([
        `${name} is a Pokémon ability introduced in ${generationTitle(ability.generation)}`,
        cleanText(effect?.effect) ?? shortEffect,
        latestFlavorText && latestFlavorText !== shortEffect && `In-game: “${latestFlavorText}”`,
        regular.length > 0 && `Pokémon that can have it: ${listFormat(regular)}`,
        hidden.length > 0 && `Pokémon that can have it as a hidden ability: ${listFormat(hidden)}`,
      ]),
    }
  })

  const moveDocs: Doc[] = moves.map((move) => {
    const effect = english(move.effect_entries)
    const flavorTexts = uniqueEnglishTexts(
      move.flavor_text_entries,
      (entry) => entry.flavor_text,
      (entry) => entry.version_group && versionGroupName(entry.version_group.name),
    )
    const name = moveTitle(move.name)
    const {learners} = learnersOf(move)
    const learnerNames = learners
      .map((learner) => species.find((s) => s.name === learner)!)
      .toSorted((a, b) => a.id - b.id)
      .map((s) => speciesTitles.get(s.name)!)
    const meta = move.meta
    const ailment = meta && meta.ailment.name !== 'none' ? meta.ailment.name : undefined
    const shortEffect = cleanText(replaceEffectChance(effect?.short_effect, move.effect_chance))
    const fullEffect = cleanText(replaceEffectChance(effect?.effect, move.effect_chance))
    const flavorText = cleanText(latestEnglish(move.flavor_text_entries)?.flavor_text)
    const damageClass = move.damage_class?.name
    return {
      _id: ids.move(move.name),
      _type: 'pokemonMove',
      name,
      slug: {_type: 'slug', current: move.name},
      type: reference(ids.type(move.type.name)),
      damageClass,
      power: move.power ?? undefined,
      accuracy: move.accuracy ?? undefined,
      pp: move.pp ?? undefined,
      priority: move.priority,
      target: move.target.name,
      generation: generationRef(move.generation),
      effectChance: move.effect_chance ?? undefined,
      shortEffect,
      effect: fullEffect,
      flavorText,
      flavorTextEntries: flavorTextEntries(flavorTexts),
      category: meta?.category.name,
      ailment,
      ailmentChance: meta?.ailment_chance || undefined,
      critRate: meta?.crit_rate || undefined,
      drain: meta?.drain || undefined,
      healing: meta?.healing || undefined,
      flinchChance: meta?.flinch_chance || undefined,
      statChance: meta?.stat_chance || undefined,
      minHits: meta?.min_hits ?? undefined,
      maxHits: meta?.max_hits ?? undefined,
      statChanges: move.stat_changes.map((change) => ({
        _type: 'pokemonStatChange',
        _key: change.stat.name,
        stat: change.stat.name,
        change: change.change,
      })),
      learnedByCount: learners.length,
      summary: paragraph([
        `${name} is ${damageClass === 'physical' ? 'a physical' : damageClass === 'special' ? 'a special' : 'a status'} ${typeTitle(move.type.name)}-type move introduced in ${generationTitle(move.generation)}`,
        [
          move.power && `power ${move.power}`,
          move.accuracy && `accuracy ${move.accuracy}%`,
          move.pp && `${move.pp} PP`,
          move.priority !== 0 && `priority ${move.priority > 0 ? '+' : ''}${move.priority}`,
        ]
          .filter(Boolean)
          .join(', ')
          .replace(/^./, (first) => first.toUpperCase()),
        fullEffect ?? shortEffect,
        flavorText && `In-game: “${flavorText}”`,
        meta &&
          optionTitle(MOVE_CATEGORIES, meta.category.name) &&
          `Category: ${optionTitle(MOVE_CATEGORIES, meta.category.name)}`,
        ailment && `It can inflict ${titleCase(ailment).toLowerCase()}`,
        learnerNames.length === 1 && `It is the signature move of ${learnerNames[0]}`,
        learnerNames.length > 1 &&
          `${learnerNames.length} Pokémon can learn it, including ${listFormat(learnerNames.slice(0, 12))}`,
      ]),
    }
  })

  const pokemonCountByType = new Map<string, string[]>()
  for (const s of species) {
    for (const {type} of defaultPokemon(s).types) {
      pokemonCountByType.set(type.name, [
        ...(pokemonCountByType.get(type.name) ?? []),
        speciesTitles.get(s.name)!,
      ])
    }
  }
  const typeRefs = (list: NamedResource[]) =>
    list
      .filter((relation) => typeNames.has(relation.name))
      .map((relation) => reference(ids.type(relation.name), relation.name))
  const typeList = (list: NamedResource[]) =>
    listFormat(list.filter((r) => typeNames.has(r.name)).map((r) => typeTitle(r.name)))
  const typeDocs: Doc[] = types.map((type) => {
    const icon =
      type.sprites['generation-ix']?.['scarlet-violet']?.symbol_icon ??
      Object.values(type.sprites['generation-ix'] ?? {}).find((sprite) => sprite?.symbol_icon)
        ?.symbol_icon
    const id = ids.type(type.name)
    if (icon) images.set(`${id}:icon`, {url: icon, cropToContent: false})
    const name = typeTitle(type.name)
    const r = type.damage_relations
    const holders = pokemonCountByType.get(type.name) ?? []
    const typeMoves = moves.filter((move) => move.type.name === type.name)
    return {
      _id: id,
      _type: 'pokemonType',
      name,
      slug: {_type: 'slug', current: type.name},
      color: POKEMON_TYPE_COLORS[type.name as PokemonTypeName],
      generation: generationRef(type.generation),
      moveDamageClass: type.move_damage_class?.name,
      pokemonCount: holders.length,
      moveCount: typeMoves.length,
      strongAgainst: typeRefs(r.double_damage_to),
      notVeryEffectiveAgainst: typeRefs(r.half_damage_to),
      noEffectAgainst: typeRefs(r.no_damage_to),
      weakTo: typeRefs(r.double_damage_from),
      resistantTo: typeRefs(r.half_damage_from),
      immuneTo: typeRefs(r.no_damage_from),
      summary: paragraph([
        `${name} is one of the ${POKEMON_TYPE_NAMES.length} Pokémon types, introduced in ${generationTitle(type.generation)}`,
        r.double_damage_to.length > 0 &&
          `${name}-type moves are super effective against ${typeList(r.double_damage_to)} Pokémon`,
        r.half_damage_to.length > 0 &&
          `They are not very effective against ${typeList(r.half_damage_to)} Pokémon`,
        r.no_damage_to.length > 0 && `They have no effect on ${typeList(r.no_damage_to)} Pokémon`,
        r.double_damage_from.length > 0 &&
          `${name}-type Pokémon are weak to ${typeList(r.double_damage_from)} moves`,
        r.half_damage_from.length > 0 && `They resist ${typeList(r.half_damage_from)} moves`,
        r.no_damage_from.length > 0 && `They are immune to ${typeList(r.no_damage_from)} moves`,
        type.move_damage_class &&
          `Before Generation IV, every ${name}-type move was ${type.move_damage_class.name}`,
        holders.length > 0 &&
          `${holders.length} Pokémon have the ${name} type, including ${listFormat(holders.slice(0, 15))}`,
        typeMoves.length > 0 &&
          `${typeMoves.length} moves are ${name}-type, including ${listFormat(
            typeMoves
              .filter((move) => move.power)
              .toSorted((a, b) => (b.power ?? 0) - (a.power ?? 0))
              .slice(0, 10)
              .map((move) => moveTitle(move.name)),
          )}`,
      ]),
    }
  })

  const pokemonDocs: Doc[] = species.map((s) => {
    const p = defaultPokemon(s)
    const id = ids.pokemon(s.name)
    const name = speciesTitles.get(s.name)!
    const stat = (apiName: string, key: 'base_stat' | 'effort' = 'base_stat') =>
      p.stats.find((entry) => entry.stat.name === apiName)?.[key] ?? 0
    const baseStats = Object.fromEntries(
      STAT_NAMES.map((entry) => [entry.name, stat(entry.apiName)]),
    ) as Record<(typeof STAT_NAMES)[number]['name'], number>
    const statTotal = Object.values(baseStats).reduce((total, value) => total + value, 0)
    const bestStat = STAT_NAMES.toSorted((a, b) => baseStats[b.name] - baseStats[a.name])[0]
    const evYields = STAT_NAMES.filter((entry) => stat(entry.apiName, 'effort') > 0).map(
      (entry) => {
        const effort = stat(entry.apiName, 'effort')
        return `${effort} ${entry.title} ${effort === 1 ? 'EV' : 'EVs'}`
      },
    )

    const artwork =
      p.sprites.other['official-artwork'].front_default ?? p.sprites.other.home.front_default
    const icon = p.sprites.front_default ?? p.sprites.other.home.front_default ?? artwork
    if (artwork) images.set(`${id}:artwork`, {url: artwork, cropToContent: false})
    if (icon) images.set(`${id}:icon`, {url: icon, cropToContent: true})

    const typeNamesOfPokemon = p.types.toSorted((a, b) => a.slot - b.slot).map((t) => t.type.name)
    const typeLabel = typeNamesOfPokemon.map(typeTitle).join('/')
    const matchups = defensiveMatchups(typeNamesOfPokemon, POKEMON_TYPE_NAMES, relations)
    const matchupList = (list: {type: string; multiplier: number}[]) =>
      listFormat(list.map((m) => `${typeTitle(m.type)} (${formatMultiplier(m.multiplier)})`))
    const abilityImmunities = p.abilities
      .map((slot) => ({
        ability: slot.ability.name,
        type: ABILITY_TYPE_IMMUNITIES[slot.ability.name],
      }))
      .filter((entry) => entry.type && !matchups.immunities.includes(entry.type))
    const typeEffectiveness = paragraph([
      matchups.weaknesses.length > 0 && `Weak to ${matchupList(matchups.weaknesses)}`,
      matchups.resistances.length > 0 && `Resistant to ${matchupList(matchups.resistances)}`,
      matchups.immunities.length > 0 &&
        `Immune to ${listFormat(matchups.immunities.map(typeTitle))}`,
      ...abilityImmunities.map(
        (entry) =>
          `With ${abilityTitle(entry.ability)} it can also be immune to ${typeTitle(entry.type)}-type moves`,
      ),
    ])

    const learnable = new Set(
      p.moves.map((entry) => entry.move.name).filter((m) => moveByName.has(m)),
    )
    const levelUp = p.moves.flatMap((entry) =>
      entry.version_group_details
        .filter((detail) => detail.move_learn_method.name === 'level-up')
        .map((detail) => ({
          move: entry.move.name,
          level: detail.level_learned_at,
          group: detail.version_group.name,
        })),
    )
    // The most recent core-series game, falling back to any game for Pokémon only in side games
    const groupsByRecency = [...new Set(levelUp.map((entry) => entry.group))].toSorted(
      (a, b) => (versionGroupByName.get(b)?.order ?? 0) - (versionGroupByName.get(a)?.order ?? 0),
    )
    const latestGroup =
      groupsByRecency.find((group) => !SIDE_VERSION_GROUP.test(group)) ?? groupsByRecency[0]
    const levelUpMoves = [
      ...new Map(
        levelUp
          .filter((entry) => entry.group === latestGroup && moveByName.has(entry.move))
          .toSorted((a, b) => a.level - b.level || a.move.localeCompare(b.move))
          .map((entry) => [`${entry.move}_${entry.level}`, entry]),
      ).values(),
    ]
    const signatureMoves = signatureMovesBySpecies.get(s.name) ?? []
    const roles = deriveRoles(
      baseStats,
      levelUpMoves.map((entry) => entry.move),
    )

    const pokedexEntries = uniqueEnglishTexts(
      s.flavor_text_entries,
      (entry) => entry.flavor_text,
      (entry) => entry.version && versionNames.get(entry.version.name),
    )
    const latestEntry = latestEnglish(s.flavor_text_entries)
    const formDescription = cleanText(english(s.form_descriptions)?.description)

    const chain = chainInfo.get(s.name)
    const evolutions = (evolutionsBySpecies.get(s.name) ?? [])
      .filter((link) => speciesNames.has(link.species.name))
      .map((link) => ({
        _type: 'pokemonEvolution',
        _key: link.species.name,
        pokemon: reference(ids.pokemon(link.species.name)),
        ...evolutionFields(link.evolution_details, nameOf),
      }))

    const otherForms = (varietiesBySpecies.get(s.name) ?? [])
      .filter((variety) => !variety.isDefault)
      .map(({pokemon: form}) => {
        const {kind, name: formName} = describeVariety(form.name, s.name, name)
        const formTypes = form.types.toSorted((a, b) => a.slot - b.slot).map((t) => t.type.name)
        return {
          _type: 'pokemonVariety',
          _key: form.name,
          name: formName,
          slug: form.name,
          kind,
          types: formTypes
            .filter((type) => typeNames.has(type))
            .map((type) => reference(ids.type(type), type)),
          abilities: [...new Set(form.abilities.map((slot) => slot.ability.name))].map((ability) =>
            reference(ids.ability(ability), ability),
          ),
          baseStatTotal: form.stats.reduce((total, entry) => total + entry.base_stat, 0),
          height: form.height / 10,
          weight: form.weight / 10,
          typeLabel: formTypes.map(typeTitle).join('/'),
        }
      })
    // Forms that only look different (Pikachu's caps, Vivillon's patterns) are summarized as a count
    const isCosmetic = (form: (typeof otherForms)[number]) =>
      form.kind === 'other' && form.typeLabel === typeLabel && form.baseStatTotal === statTotal
    const distinctForms = otherForms.filter((form) => !isCosmetic(form))
    const cosmeticForms = otherForms.filter(isCosmetic)
    const heldItems = [...new Set(p.held_items.map((entry) => titleCase(entry.item.name)))]

    const abilitySentence = (() => {
      const slots = p.abilities.toSorted((a, b) => a.slot - b.slot)
      const describe = (slot: (typeof slots)[number]) => {
        const effect = abilityShortEffects.get(slot.ability.name)
        return `${abilityTitle(slot.ability.name)}${effect ? ` (${effect.replace(/\.$/, '')})` : ''}`
      }
      const regular = slots.filter((slot) => !slot.is_hidden).map(describe)
      const hidden = slots.filter((slot) => slot.is_hidden).map(describe)
      return [
        regular.length > 0 && `Abilities: ${listFormat(regular, 'or')}`,
        hidden.length > 0 && `Hidden ability: ${hidden.join(', ')}`,
      ]
    })()

    const status = s.is_legendary
      ? 'a legendary Pokémon'
      : s.is_mythical
        ? 'a mythical Pokémon'
        : s.is_baby
          ? 'a baby Pokémon'
          : undefined
    const genus = english(s.genera)?.genus
    const region = generations.find((g) => g.id === idFromUrl(s.generation.url))?.main_region.name
    const description = paragraph([...pokedexEntries.map((entry) => entry.text), formDescription])
    const levelUpGame = latestGroup ? versionGroupName(latestGroup) : undefined

    const summary = paragraph([
      `${name} (National Pokédex #${String(s.id).padStart(4, '0')}) is ${genus ? `the ${genus}, ` : ''}${
        typeLabel ? `${withArticle(`${typeLabel}-type`)} Pokémon` : 'a Pokémon'
      } introduced in ${generationTitle(s.generation)}${region ? ` (${titleCase(region)} region)` : ''}`,
      status && `It is ${status}`,
      (s.color || s.shape || s.habitat) &&
        `It ${listFormat(
          [
            s.color && `is ${s.color.name}`,
            s.shape &&
              `has ${withArticle(optionTitle(POKEMON_SHAPES, s.shape.name)?.toLowerCase() ?? s.shape.name)} body shape`,
            s.habitat && (HABITAT_PHRASES[s.habitat.name] ?? `lives in ${s.habitat.name}`),
          ].filter((part): part is string => Boolean(part)),
        )}`,
      `It is ${p.height / 10} m tall and weighs ${p.weight / 10} kg`,
      typeEffectiveness,
      `Base stats: ${STAT_NAMES.map((entry) => `${entry.title} ${baseStats[entry.name]}`).join(', ')} (total ${statTotal}); its highest stat is ${bestStat.title}`,
      roles.length > 0 &&
        `Battle roles: ${listFormat(roles.map((role) => optionTitle(POKEMON_ROLES, role)!.toLowerCase()))}`,
      ...abilitySentence,
      signatureMoves.length > 0 &&
        `Signature ${signatureMoves.length === 1 ? 'move' : 'moves'}: ${listFormat(signatureMoves.map(moveTitle))}`,
      levelUpMoves.length > 0 &&
        `Moves learned by leveling up${levelUpGame ? ` in ${levelUpGame}` : ''}: ${listFormat([
          ...new Set(levelUpMoves.map((entry) => moveTitle(entry.move))),
        ])}`,
      chain?.summary,
      chain &&
        chain.stages > 1 &&
        `${name} is stage ${chain.stage} of ${chain.stages} in its evolution line`,
      distinctForms.length > 0 &&
        `Other forms: ${listFormat(distinctForms.map((form) => `${form.name} (${form.typeLabel}-type)`))}`,
      cosmeticForms.length > 0 &&
        `It also has ${cosmeticForms.length} cosmetic ${cosmeticForms.length === 1 ? 'variant' : 'variants'}, such as ${listFormat(cosmeticForms.slice(0, 3).map((form) => form.name))}`,
      s.egg_groups.length > 0 &&
        `Egg groups: ${listFormat(s.egg_groups.map((group) => titleCase(group.name)))}`,
      s.gender_rate === -1
        ? 'It is genderless'
        : `${(s.gender_rate / 8) * 100}% of them are female`,
      `Catch rate ${s.capture_rate}${s.base_happiness === null ? '' : `, base friendship ${s.base_happiness}`}${
        s.growth_rate ? `, ${titleCase(s.growth_rate.name).toLowerCase()} growth rate` : ''
      }`,
      evYields.length > 0 && `Defeating it yields ${listFormat(evYields)}`,
      heldItems.length > 0 && `It may be found holding ${listFormat(heldItems, 'or')}`,
      latestEntry && `Pokédex: ${cleanText(latestEntry.flavor_text)}`,
    ])

    return {
      _id: id,
      _type: 'pokemon',
      name,
      slug: {_type: 'slug', current: s.name},
      nationalDexNumber: s.id,
      genus,
      types: typeNamesOfPokemon.map((type) => reference(ids.type(type), type)),
      generation: generationRef(s.generation),
      isBaby: s.is_baby,
      isLegendary: s.is_legendary,
      isMythical: s.is_mythical,
      summary,
      flavorText: cleanText(latestEntry?.flavor_text),
      flavorTextGame: latestEntry?.version ? versionNames.get(latestEntry.version.name) : undefined,
      description,
      pokedexEntries: pokedexEntries.map((entry, index) => ({
        _type: 'pokemonFlavorTextEntry',
        _key: `entry${index}`,
        text: entry.text,
        games: entry.games,
      })),
      height: p.height / 10,
      weight: p.weight / 10,
      color: s.color?.name,
      shape: s.shape?.name,
      habitat: s.habitat?.name,
      baseStats: {_type: 'pokemonBaseStats', ...baseStats, total: statTotal},
      evYields: {
        _type: 'pokemonEvYields',
        ...Object.fromEntries(
          STAT_NAMES.map((entry) => [entry.name, stat(entry.apiName, 'effort')]),
        ),
      },
      baseExperience: p.base_experience ?? undefined,
      roles,
      weaknesses: matchups.weaknesses.map((m) => ({
        _type: 'pokemonTypeMatchup',
        _key: m.type,
        type: reference(ids.type(m.type)),
        multiplier: m.multiplier,
      })),
      resistances: matchups.resistances.map((m) => ({
        _type: 'pokemonTypeMatchup',
        _key: m.type,
        type: reference(ids.type(m.type)),
        multiplier: m.multiplier,
      })),
      immunities: matchups.immunities.map((type) => reference(ids.type(type), type)),
      typeEffectiveness,
      abilities: p.abilities
        .toSorted((a, b) => a.slot - b.slot)
        .map((a) => ({
          _type: 'pokemonAbilitySlot',
          _key: a.ability.name,
          ability: reference(ids.ability(a.ability.name)),
          isHidden: a.is_hidden,
        })),
      signatureMoves: signatureMoves.map((move) => reference(ids.move(move), move)),
      levelUpMoves: levelUpMoves.map((entry) => ({
        _type: 'pokemonLearnedMove',
        _key: `${entry.move}_${entry.level}`,
        move: reference(ids.move(entry.move)),
        level: entry.level,
      })),
      levelUpMovesGame: levelUpGame,
      moveCount: learnable.size,
      evolvesFrom:
        s.evolves_from_species && speciesNames.has(s.evolves_from_species.name)
          ? reference(ids.pokemon(s.evolves_from_species.name))
          : undefined,
      evolutionMethod: chain?.from?.method,
      evolutions,
      evolutionStage: chain?.stage,
      evolutionChain: chain?.summary,
      varieties: otherForms.map(({typeLabel: _typeLabel, ...form}) => form),
      captureRate: s.capture_rate,
      baseHappiness: s.base_happiness ?? undefined,
      growthRate: s.growth_rate?.name,
      eggGroups: s.egg_groups.map((group) => group.name),
      hatchCounter: s.hatch_counter ?? undefined,
      genderRate: s.gender_rate,
      genderless: s.gender_rate === -1,
      femaleRatio: s.gender_rate === -1 ? undefined : (s.gender_rate / 8) * 100,
      hasGenderDifferences: s.has_gender_differences,
      formsSwitchable: s.forms_switchable,
      heldItems,
      cry: p.cries.latest ?? p.cries.legacy ?? undefined,
      cryLegacy: p.cries.legacy ?? undefined,
      ...(artwork && {artwork: {_type: 'image', alt: `Official artwork of ${name}`}}),
      ...(icon && {icon: {_type: 'image'}}),
    }
  })

  const generationDocs: Doc[] = generations.map((generation) => {
    const name = english(generation.names)?.name ?? `Generation ${generation.id}`
    const region = titleCase(generation.main_region.name)
    const games = [
      ...new Set(
        generation.version_groups.flatMap(
          (group) =>
            versionGroupByName
              .get(group.name)
              ?.versions.map((version) => versionNames.get(version.name) ?? version.name) ?? [],
        ),
      ),
    ]
    const newTypes = generation.types
      .filter((type) => typeNames.has(type.name))
      .map((type) => typeTitle(type.name))
    const special = species
      .filter(
        (s) => idFromUrl(s.generation.url) === generation.id && (s.is_legendary || s.is_mythical),
      )
      .map((s) => speciesTitles.get(s.name)!)
    return {
      _id: ids.generation(generation.id),
      _type: 'pokemonGeneration',
      name,
      number: generation.id,
      region,
      games,
      versionGroups: generation.version_groups.map((group) => versionGroupName(group.name)),
      pokemonCount: generation.pokemon_species.length,
      moveCount: generation.moves.length,
      abilityCount: generation.abilities.length,
      newTypes,
      summary: paragraph([
        `${name} is set in the ${region} region and spans ${listFormat(games)}`,
        `It introduced ${listFormat(
          [
            `${generation.pokemon_species.length} Pokémon`,
            `${generation.moves.length} moves`,
            generation.abilities.length > 0 && `${generation.abilities.length} abilities`,
          ].filter((part): part is string => Boolean(part)),
        )}`,
        newTypes.length > 0 &&
          `${newTypes.length === 1 ? 'The type' : 'Types'} introduced: ${listFormat(newTypes)}`,
        special.length > 0 && `Its legendary and mythical Pokémon: ${listFormat(special)}`,
      ]),
    }
  })

  return {generationDocs, typeDocs, abilityDocs, moveDocs, pokemonDocs, images}
}
