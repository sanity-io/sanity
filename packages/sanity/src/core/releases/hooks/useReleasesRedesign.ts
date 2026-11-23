/**
 * Whether the releases tool renders the redesigned overview and detail layout: the shared detail
 * layout with the top action rail, the document table with search in the command lane, the
 * floating activity panel and the release details dialog.
 *
 * These surfaces were built behind `beta.variants`. They ship to every project in Studio v6, so
 * this is now always on. Variant data (the variant column, variant lookups) stays behind
 * `beta.variants`; only layout reads this hook. The legacy branches it guards are removed once
 * v6 has shipped.
 *
 * @internal
 */
export function useReleasesRedesign(): boolean {
  return true
}
