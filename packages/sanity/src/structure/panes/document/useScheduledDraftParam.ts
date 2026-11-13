import {useMemo} from 'react'
import {getPublishedId, useDocumentVersions, usePerspective} from 'sanity'

import {getDefaultVariant} from '../../../core/perspective/getDefaultVariant'
import {type VersionInfoDocumentStub} from '../../../core/releases/store/types'
import {getDocumentVersionVariantId} from '../../../core/util/getDocumentVersionVariant'
import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'

/**
 * The scheduled draft (release name) the pane opens for the selected variant: the `scheduledDraft`
 * param, or `undefined` when the release holds a version of another variant or of the base
 * document. A cardinality-one release holds a single version, so a version of it outside the
 * selected variant means the param crossed variants, and the selected variant wins.
 *
 * The param is kept whenever that cannot be told yet: while the versions or the variant load, and
 * when no version of the release is known (it was just scheduled, or the release is archived).
 *
 * @internal
 */
export function getScheduledDraftForLane(options: {
  scheduledDraft: string | undefined
  versions: VersionInfoDocumentStub[]
  versionsLoading: boolean
  /** Whether a variant is requested in the router, resolved or not. */
  variantRequested: boolean
  /** The selected variant document id (`_.variants.<name>`), `undefined` for Default or while it resolves. */
  variantId: string | undefined
}): string | undefined {
  const {scheduledDraft, versions, versionsLoading, variantRequested, variantId} = options

  if (!scheduledDraft) return undefined
  if (versionsLoading || (variantRequested && !variantId)) return scheduledDraft

  const version = versions.find((stub) => stub._system.bundleId === scheduledDraft)
  if (!version) return scheduledDraft

  return getDocumentVersionVariantId(version) === variantId ? scheduledDraft : undefined
}

/**
 * The pane's `scheduledDraft` param, validated against the selected variant with
 * {@link getScheduledDraftForLane}.
 *
 * @internal
 */
export function useScheduledDraftParam(documentId: string): string | undefined {
  const {params} = usePaneRouter()
  const scheduledDraft = params?.scheduledDraft
  const {versions, loading: versionsLoading} = useDocumentVersions({
    documentId: getPublishedId(documentId),
  })
  const {selectedVariantNames, selectedVariants} = usePerspective()
  const variantRequested = Boolean(getDefaultVariant(selectedVariantNames))
  const variantId = variantRequested ? getDefaultVariant(selectedVariants)?._id : undefined

  return useMemo(
    () =>
      getScheduledDraftForLane({
        scheduledDraft,
        versions,
        versionsLoading,
        variantRequested,
        variantId,
      }),
    [scheduledDraft, versions, versionsLoading, variantRequested, variantId],
  )
}
