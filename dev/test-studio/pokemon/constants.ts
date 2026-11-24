/**
 * Every document the seed script writes has an id in this namespace, so it never collides with
 * other documents in the dataset. Ids use underscores as separators: a dot in a document id makes
 * it path-scoped (private), which the studio and the public API treat differently.
 */
export const POKEMON_ID_PREFIX = 'pokemon_'

export const POKEMON_TYPE_NAMES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const

export type PokemonTypeName = (typeof POKEMON_TYPE_NAMES)[number]

/** The type colors used across the games' UI and most Pokédex sites. */
export const POKEMON_TYPE_COLORS: Record<PokemonTypeName, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
}

export const EVOLUTION_TRIGGERS = [
  {title: 'Level up', value: 'level-up'},
  {title: 'Trade', value: 'trade'},
  {title: 'Use item', value: 'use-item'},
  {title: 'Shed', value: 'shed'},
  {title: 'Spin', value: 'spin'},
  {title: 'Tower of Darkness', value: 'tower-of-darkness'},
  {title: 'Tower of Waters', value: 'tower-of-waters'},
  {title: 'Three critical hits', value: 'three-critical-hits'},
  {title: 'Take damage', value: 'take-damage'},
  {title: 'Level up in battle', value: 'in-battle-level-up'},
  {title: 'Agile style move', value: 'agile-style-move'},
  {title: 'Strong style move', value: 'strong-style-move'},
  {title: 'Recoil damage', value: 'recoil-damage'},
  {title: 'Use move', value: 'use-move'},
  {title: 'Defeat three Bisharp', value: 'three-defeated-bisharp'},
  {title: 'Gimmighoul coins', value: 'gimmighoul-coins'},
  {title: 'Meltan candies', value: 'meltan-candies'},
  {title: 'Unclassified', value: 'unclassified'},
  {title: 'Other', value: 'other'},
]

export const MOVE_DAMAGE_CLASSES = [
  {title: 'Physical', value: 'physical'},
  {title: 'Special', value: 'special'},
  {title: 'Status', value: 'status'},
]

export const MOVE_TARGETS = [
  {title: 'Selected Pokémon', value: 'selected-pokemon'},
  {title: 'Selected Pokémon (Me First)', value: 'selected-pokemon-me-first'},
  {title: 'Specific move', value: 'specific-move'},
  {title: 'Ally', value: 'ally'},
  {title: 'User or ally', value: 'user-or-ally'},
  {title: 'User', value: 'user'},
  {title: "User's side of the field", value: 'users-field'},
  {title: 'User and allies', value: 'user-and-allies'},
  {title: 'All allies', value: 'all-allies'},
  {title: 'Random opponent', value: 'random-opponent'},
  {title: 'All opponents', value: 'all-opponents'},
  {title: "Opponents' side of the field", value: 'opponents-field'},
  {title: 'All other Pokémon', value: 'all-other-pokemon'},
  {title: 'All Pokémon', value: 'all-pokemon'},
  {title: 'Entire field', value: 'entire-field'},
  {title: 'Fainting Pokémon', value: 'fainting-pokemon'},
]

export const MOVE_CATEGORIES = [
  {title: 'Damage', value: 'damage'},
  {title: 'Status condition', value: 'ailment'},
  {title: 'Raises stats', value: 'net-good-stats'},
  {title: 'Heals', value: 'heal'},
  {title: 'Damage and status condition', value: 'damage-ailment'},
  {title: 'Confuses and raises stats', value: 'swagger'},
  {title: 'Damage and lowers stats', value: 'damage-lower'},
  {title: 'Damage and raises stats', value: 'damage-raise'},
  {title: 'Damage and heals', value: 'damage-heal'},
  {title: 'One-hit KO', value: 'ohko'},
  {title: 'Whole field effect', value: 'whole-field-effect'},
  {title: 'Field effect', value: 'field-effect'},
  {title: 'Forces a switch', value: 'force-switch'},
  {title: 'Unique', value: 'unique'},
]

export const STAT_NAMES = [
  {name: 'hp', apiName: 'hp', title: 'HP'},
  {name: 'attack', apiName: 'attack', title: 'Attack'},
  {name: 'defense', apiName: 'defense', title: 'Defense'},
  {name: 'specialAttack', apiName: 'special-attack', title: 'Sp. Atk'},
  {name: 'specialDefense', apiName: 'special-defense', title: 'Sp. Def'},
  {name: 'speed', apiName: 'speed', title: 'Speed'},
] as const

/** Kinds of alternate forms, derived from the suffix of the variety's PokéAPI name. */
export const VARIETY_KINDS = [
  {title: 'Mega Evolution', value: 'mega'},
  {title: 'Gigantamax', value: 'gigantamax'},
  {title: 'Alolan form', value: 'alolan'},
  {title: 'Galarian form', value: 'galarian'},
  {title: 'Hisuian form', value: 'hisuian'},
  {title: 'Paldean form', value: 'paldean'},
  {title: 'Primal Reversion', value: 'primal'},
  {title: 'Other form', value: 'other'},
]

/** Tags derived from base stats and moves, to make battle roles searchable. */
export const POKEMON_ROLES = [
  {title: 'Very fast', value: 'very-fast'},
  {title: 'Fast', value: 'fast'},
  {title: 'Slow', value: 'slow'},
  {title: 'Physical attacker', value: 'physical-attacker'},
  {title: 'Special attacker', value: 'special-attacker'},
  {title: 'Mixed attacker', value: 'mixed-attacker'},
  {title: 'Sweeper', value: 'sweeper'},
  {title: 'Physical wall', value: 'physical-wall'},
  {title: 'Special wall', value: 'special-wall'},
  {title: 'Tank', value: 'tank'},
  {title: 'Healer', value: 'healer'},
  {title: 'Glass cannon', value: 'glass-cannon'},
]

export const GROWTH_RATES = [
  {title: 'Slow', value: 'slow'},
  {title: 'Medium', value: 'medium'},
  {title: 'Fast', value: 'fast'},
  {title: 'Medium slow', value: 'medium-slow'},
  {title: 'Erratic', value: 'slow-then-very-fast'},
  {title: 'Fluctuating', value: 'fast-then-very-slow'},
]

export const EGG_GROUPS = [
  {title: 'Monster', value: 'monster'},
  {title: 'Water 1', value: 'water1'},
  {title: 'Bug', value: 'bug'},
  {title: 'Flying', value: 'flying'},
  {title: 'Field', value: 'ground'},
  {title: 'Fairy', value: 'fairy'},
  {title: 'Grass', value: 'plant'},
  {title: 'Human-Like', value: 'humanshape'},
  {title: 'Water 3', value: 'water3'},
  {title: 'Mineral', value: 'mineral'},
  {title: 'Amorphous', value: 'indeterminate'},
  {title: 'Water 2', value: 'water2'},
  {title: 'Ditto', value: 'ditto'},
  {title: 'Dragon', value: 'dragon'},
  {title: 'Undiscovered', value: 'no-eggs'},
]

export const POKEMON_COLORS = [
  'black',
  'blue',
  'brown',
  'gray',
  'green',
  'pink',
  'purple',
  'red',
  'white',
  'yellow',
].map((value) => ({title: value[0].toUpperCase() + value.slice(1), value}))

export const POKEMON_SHAPES = [
  {title: 'Ball', value: 'ball'},
  {title: 'Squiggle', value: 'squiggle'},
  {title: 'Fish', value: 'fish'},
  {title: 'Arms', value: 'arms'},
  {title: 'Blob', value: 'blob'},
  {title: 'Upright', value: 'upright'},
  {title: 'Legs', value: 'legs'},
  {title: 'Quadruped', value: 'quadruped'},
  {title: 'Wings', value: 'wings'},
  {title: 'Tentacles', value: 'tentacles'},
  {title: 'Heads', value: 'heads'},
  {title: 'Humanoid', value: 'humanoid'},
  {title: 'Bug wings', value: 'bug-wings'},
  {title: 'Armor', value: 'armor'},
]

export const POKEMON_HABITATS = [
  {title: 'Cave', value: 'cave'},
  {title: 'Forest', value: 'forest'},
  {title: 'Grassland', value: 'grassland'},
  {title: 'Mountain', value: 'mountain'},
  {title: 'Rare', value: 'rare'},
  {title: 'Rough terrain', value: 'rough-terrain'},
  {title: 'Sea', value: 'sea'},
  {title: 'Urban', value: 'urban'},
  {title: "Water's edge", value: 'waters-edge'},
]
