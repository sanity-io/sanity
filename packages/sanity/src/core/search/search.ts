import {type SearchStrategy} from '@sanity/types'

import {isReleasePerspective, RELEASES_STUDIO_CLIENT_OPTIONS} from '../releases/util/releasesClient'
import {versionedClient} from '../studioClient'
import {variantApiVersion} from '../variants/util/variantApiVersion'
import {
  type Groq2024SearchResults,
  type SearchStrategyFactory,
  type WeightedSearchResults,
} from './common/types'
import {EXCLUDE_AGENT_VERSIONS_FILTER} from './constants'
import {createGroq2024Search} from './groq2024'
import {createWeightedSearch} from './weighted'

const searchStrategies = {
  groqLegacy: createWeightedSearch,
  groq2024: createGroq2024Search,
} satisfies Record<
  SearchStrategy,
  SearchStrategyFactory<WeightedSearchResults | Groq2024SearchResults>
>

const DEFAULT_SEARCH_STRATEGY: SearchStrategy = 'groqLegacy'

/** @internal */
export const createSearch: SearchStrategyFactory<WeightedSearchResults | Groq2024SearchResults> = (
  searchableTypes,
  client,
  options,
) => {
  const factory = searchStrategies[options.strategy ?? DEFAULT_SEARCH_STRATEGY]

  const apiVersion = variantApiVersion(
    options?.variant,
    isReleasePerspective(options?.perspective)
      ? RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion
      : undefined,
  )

  const search = factory(searchableTypes, versionedClient(client, apiVersion), options)

  return (searchTerms, searchOptions) => {
    const {perspective, filter} = {...options, ...searchOptions}

    // The `raw` perspective returns every version of every document, including Content Agent
    // versions. Those are only readable by their author, so for everyone else they surface as
    // duplicate search hits that open an empty document. No studio search should show them, so
    // they are excluded here — the one place every search strategy and caller passes through.
    if (perspective !== 'raw') {
      return search(searchTerms, searchOptions)
    }

    return search(searchTerms, {
      ...searchOptions,
      filter: filter
        ? `(${filter}) && ${EXCLUDE_AGENT_VERSIONS_FILTER}`
        : EXCLUDE_AGENT_VERSIONS_FILTER,
    })
  }
}
