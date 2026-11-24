import {BoltIcon} from '@sanity/icons/Bolt'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {StarIcon} from '@sanity/icons/Star'
import {TargetIcon} from '@sanity/icons/Target'
import {type StructureBuilder, type StructureResolver} from 'sanity/structure'

import {PokeballIcon} from './PokeballIcon'

const BY_DEX_NUMBER = [{field: 'nationalDexNumber', direction: 'asc' as const}]
const BY_NUMBER = [{field: 'number', direction: 'asc' as const}]
const BY_NAME = [{field: 'name', direction: 'asc' as const}]

function pokemonList(S: StructureBuilder, title: string, filter: string, params = {}) {
  return S.documentList()
    .title(title)
    .schemaType('pokemon')
    .filter(`_type == "pokemon" && ${filter}`)
    .params(params)
    .apiVersion('2025-02-19')
    .defaultOrdering(BY_DEX_NUMBER)
}

/**
 * Counts only appear on items whose child lists every document of the item's schema type (see
 * `showCount()`), so the grouping items count what their child pane lists: 18 types, 9
 * generations. Filtered lists, like the legendary Pokémon or the Pokémon of one type, get none.
 */
export const pokemonStructure: StructureResolver = (S) =>
  S.list()
    .title('Pokédex')
    .items([
      S.listItem()
        .title('All Pokémon')
        .icon(PokeballIcon)
        .schemaType('pokemon')
        .showCount()
        .child(S.documentTypeList('pokemon').title('All Pokémon').defaultOrdering(BY_DEX_NUMBER)),
      S.listItem()
        .title('Pokémon by type')
        .icon(BoltIcon)
        .schemaType('pokemonType')
        .showCount()
        .child(
          S.documentTypeList('pokemonType')
            .title('Pokémon by type')
            .defaultOrdering(BY_NAME)
            .child((typeId) =>
              pokemonList(S, 'Pokémon', '$typeId in types[]._ref', {typeId}).id(typeId),
            ),
        ),
      S.listItem()
        .title('Pokémon by generation')
        .icon(EarthGlobeIcon)
        .schemaType('pokemonGeneration')
        .showCount()
        .child(
          S.documentTypeList('pokemonGeneration')
            .title('Pokémon by generation')
            .defaultOrdering(BY_NUMBER)
            .child((generationId) =>
              pokemonList(S, 'Pokémon', 'generation._ref == $generationId', {generationId}).id(
                generationId,
              ),
            ),
        ),
      S.listItem()
        .title('Legendary & mythical')
        .icon(StarIcon)
        .child(pokemonList(S, 'Legendary & mythical', '(isLegendary || isMythical)')),
      S.divider(),
      S.documentTypeListItem('pokemonType').title('Types').icon(BoltIcon).showCount(),
      S.documentTypeListItem('pokemonAbility').title('Abilities').icon(SparklesIcon).showCount(),
      S.documentTypeListItem('pokemonMove').title('Moves').icon(TargetIcon).showCount(),
      S.documentTypeListItem('pokemonGeneration')
        .title('Generations')
        .icon(EarthGlobeIcon)
        .showCount(),
    ])
