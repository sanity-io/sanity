import {
  pokemon,
  pokemonAbilitySlot,
  pokemonBaseStats,
  pokemonEvolution,
  pokemonEvYields,
  pokemonLearnedMove,
  pokemonTypeMatchup,
  pokemonVariety,
} from './pokemon'
import {pokemonAbility} from './pokemonAbility'
import {pokemonGeneration} from './pokemonGeneration'
import {pokemonMove, pokemonStatChange} from './pokemonMove'
import {pokemonType} from './pokemonType'
import {pokemonFlavorTextEntry} from './shared'

export const pokemonSchemaTypes = [
  pokemon,
  pokemonType,
  pokemonAbility,
  pokemonMove,
  pokemonGeneration,
  pokemonBaseStats,
  pokemonEvYields,
  pokemonTypeMatchup,
  pokemonAbilitySlot,
  pokemonLearnedMove,
  pokemonEvolution,
  pokemonVariety,
  pokemonStatChange,
  pokemonFlavorTextEntry,
]
