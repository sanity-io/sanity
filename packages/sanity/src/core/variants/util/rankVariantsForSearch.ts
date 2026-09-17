import {getVariantTitle} from '../tool/util'
import {type SystemVariant} from '../types'

/**
 * How well a term matches a variant's title, lower being better. `Infinity` means no match.
 *
 * Unlike `filterVariantsForSearch`, only the title is considered: the id and condition values
 * are not something a person filtering the variant dropdown is looking for, and matching them
 * would surface variants whose displayed title gives no clue why they appeared.
 */
function getSearchRank(variant: SystemVariant, normalizedSearchTerm: string): number {
  const title = getVariantTitle(variant).toLowerCase()

  if (title === normalizedSearchTerm) return 0
  if (title.startsWith(normalizedSearchTerm)) return 1
  if (title.includes(normalizedSearchTerm)) return 2

  return Infinity
}

/**
 * The variants a term matches against their title, best match first.
 *
 * Mirrors `rankReleasesForSearch`, minus its id tier: variant ids are not searchable here, so a
 * term that only matches the id is treated the same as no match at all. Equal matches keep their
 * input order, so the sequence the rest of the menu reads in survives inside each tier.
 *
 * @internal
 */
export function rankVariantsForSearch(
  variants: SystemVariant[],
  searchTerm: string,
): SystemVariant[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  if (!normalizedSearchTerm) return variants

  return variants
    .map((variant) => ({variant, rank: getSearchRank(variant, normalizedSearchTerm)}))
    .filter(({rank}) => rank !== Infinity)
    .sort((a, b) => a.rank - b.rank)
    .map(({variant}) => variant)
}
