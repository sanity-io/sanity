import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {combineLatest, scan} from 'rxjs'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {useDocumentVersionsObservable} from '../../releases/hooks/useDocumentVersions'
import {useReleasesStore} from '../../releases/store/useReleasesStore'
import {useAgentBundlesStore} from '../../store/agent/useAgentBundles'
import {useWorkspace} from '../../studio/workspace'
import {useVariantsStore} from '../../variants/store/useVariantsStore'
import {
  type Meta,
  metaHasError,
  metaIsSettled,
  type VariantSet,
} from '../machines/documentGroupInventoryMachine'
import {computeSets} from '../utils/computeSets'

/**
 * The state returned by {@link useDocumentGroupSets}.
 *
 */
interface DocumentGroupSetsState {
  /**
   * The document group's versions grouped into named sets. When variants are enabled, there is
   * one set per bundle (draft, published, each release); otherwise, a single set containing all
   * versions.
   */
  sets: VariantSet[]
  /**
   * Active releases keyed by release document id, for resolving release refs on version stubs.
   */
  releases: Map<string, ReleaseDocument>
  loading: boolean
  error: boolean
}

const INITIAL_STATE: DocumentGroupSetsState = {
  sets: [],
  releases: new Map(),
  loading: true,
  error: false,
}

/**
 * Computes the named sets of document versions (including variants, releases, draft/published,
 * and anonymous bundles) for a document group, using the same derivation as the document group
 * inventory, but without any of the inventory's action machinery.
 *
 */
export function useDocumentGroupSets({documentId}: {documentId: string}): DocumentGroupSetsState {
  const {t} = useTranslation(studioLocaleNamespace)
  const {beta} = useWorkspace()
  const variantsEnabled = beta?.variants?.enabled
  const versionState = useDocumentVersionsObservable({documentId})
  const {state$: releases} = useReleasesStore()
  const {state$: variants} = useVariantsStore()
  const {state$: agentBundles} = useAgentBundlesStore()

  const state$ = useMemo(
    () =>
      combineLatest({versionState, releases, variants, agentBundles}).pipe(
        scan(
          (previous: DocumentGroupSetsState, meta: Meta) => ({
            sets: computeSets({meta, current: previous.sets, t, variantsEnabled}),
            releases: meta.releases.releases,
            // Once settled, stay settled: later emissions (e.g. a version appearing) must not
            // flip the consumer back into a loading state. Mirrors the inventory machine.
            loading: previous.loading && !metaIsSettled(meta),
            error: metaHasError(meta),
          }),
          INITIAL_STATE,
        ),
      ),
    [versionState, releases, variants, agentBundles, t, variantsEnabled],
  )

  return useObservable(state$, INITIAL_STATE)
}
