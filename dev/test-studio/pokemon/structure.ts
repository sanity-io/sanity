import {BoltIcon} from '@sanity/icons/Bolt'
import {EarthGlobeIcon} from '@sanity/icons/EarthGlobe'
import {StarIcon} from '@sanity/icons/Star'
import {type StructureBuilder, type StructureResolver} from 'sanity/structure'

import {PokeballIcon} from './PokeballIcon'

const BY_DEX_NUMBER = [{field: 'nationalDexNumber', direction: 'asc' as const}]

function pokemonList(S: StructureBuilder, title: string, filter: string, params = {}) {
  return S.documentList()
    .title(title)
    .schemaType('pokemon')
    .filter(`_type == "pokemon" && ${filter}`)
    .params(params)
    .defaultOrdering(BY_DEX_NUMBER)
}

export const pokemonStructure: StructureResolver = (S) =>
  S.list()
    .title('Pokédex')
    .items([
      S.listItem()
        .title('All Pokémon')
        .icon(PokeballIcon)
        .child(S.documentTypeList('pokemon').title('All Pokémon').defaultOrdering(BY_DEX_NUMBER)),
      S.listItem()
        .title('Pokémon by type')
        .icon(BoltIcon)
        .child(
          S.documentTypeList('pokemonType')
            .title('Pokémon by type')
            .child((typeId) =>
              pokemonList(S, 'Pokémon', '$typeId in types[]._ref', {typeId}).id(typeId),
            ),
        ),
      S.listItem()
        .title('Pokémon by generation')
        .icon(EarthGlobeIcon)
        .child(
          S.documentTypeList('pokemonGeneration')
            .title('Pokémon by generation')
            .defaultOrdering([{field: 'number', direction: 'asc'}])
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
      S.documentTypeListItem('pokemonType').title('Types'),
      S.documentTypeListItem('pokemonAbility').title('Abilities'),
      S.documentTypeListItem('pokemonGeneration').title('Generations'),
    ])
