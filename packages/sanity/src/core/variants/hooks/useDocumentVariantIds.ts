import {useMemo} from 'react'

import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'

/**
 * The ids of every variant a document already has a version in.
 *
 * A variant version is identified by `_system.variant`, not by anything in its id — see
 * `getVariantVersionInfo`. Shared rather than derived per call site because two surfaces render the
 * same distinction and have to agree on it: the variant menu splits its list into the variants a
 * document has and the ones it does not, and the perspective bar's variant pill fills or outlines
 * its diamond on the same question. Computed twice, they drift, and the bar starts claiming the
 * document has content the menu says it does not.
 *
 * @internal
 */
export function useDocumentVariantIds(documentId: string): ReadonlySet<string> {
  const {versions} = useDocumentVersions({documentId})

  return useMemo(() => {
    const refs = versions
      .map((version) => version._system.variant?._ref)
      .filter((ref): ref is string => typeof ref === 'string')
    return new Set(refs)
  }, [versions])
}
