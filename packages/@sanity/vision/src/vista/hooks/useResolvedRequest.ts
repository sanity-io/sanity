import {type ClientPerspective, type ReleaseDocument, type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  isCardinalityOneRelease,
  type PerspectiveStack,
  sortReleases,
  useActiveReleases,
  useClient,
  usePerspective,
  useScheduledDraftsEnabled,
  useWorkspace,
  VARIANTS_STUDIO_CLIENT_OPTIONS,
} from 'sanity'

import {getActivePerspective, getActiveVariant} from '../../perspectives'
import {isApiVersionBelow} from '../../util/compareApiVersion'
import {prefixApiVersion} from '../../util/prefixApiVersion'
import {validateApiVersion} from '../../util/validateApiVersion'
import {type VistaTabOptions} from '../store/types'
import {SYNC_TAGS_API_VERSION} from '../util/syncTags'

export const VARIANTS_API_VERSION = prefixApiVersion(VARIANTS_STUDIO_CLIENT_OPTIONS.apiVersion)

export interface ResolvedRequest {
  /** The API version requests are sent with, `vX` while a variant is selected */
  apiVersion: string
  /** Whether the "Other" API version input holds a usable version */
  isValidApiVersion: boolean
  /** The API version is forced to `vX` because the navbar has a variant selected */
  isApiVersionLocked: boolean
  perspective: ClientPerspective | undefined
  variant: string | undefined
  /** Sync tags (and therefore automatic refetching) need a modern API version */
  supportsSyncTags: boolean
  /** Client configured for the tab: API version, dataset, perspective and variant */
  client: SanityClient
}

/**
 * Resolves the effective request configuration for a tab's options against studio state: the
 * virtual `pinnedRelease` and `scheduledDrafts` perspectives become real perspective stacks, and a
 * navbar variant locks the API version to the experimental one.
 */
export function useResolvedRequest(options: VistaTabOptions): ResolvedRequest {
  const {perspectiveStack, selectedVariantName} = usePerspective()
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()
  const {data: releases = []} = useActiveReleases()
  const workspace = useWorkspace()
  const isDraftModelEnabled = workspace.document.drafts.enabled

  const scheduledDraftsStack = useMemo((): PerspectiveStack | undefined => {
    if (!isScheduledDraftsEnabled) return undefined

    const scheduledDraftReleases = releases.filter(
      (release: ReleaseDocument) =>
        isCardinalityOneRelease(release) && release.state === 'scheduled',
    )
    const releaseIds = sortReleases(scheduledDraftReleases).map((release: ReleaseDocument) =>
      getReleaseIdFromReleaseDocumentId(release._id),
    )
    const defaultPerspective = isDraftModelEnabled ? ['drafts'] : ['published']
    return [...releaseIds, ...defaultPerspective] as PerspectiveStack
  }, [releases, isDraftModelEnabled, isScheduledDraftsEnabled])

  const variant = getActiveVariant(options.perspective, selectedVariantName)
  const isValidCustomApiVersion = options.customApiVersion
    ? validateApiVersion(options.customApiVersion)
    : true
  const userApiVersion =
    options.customApiVersion && isValidCustomApiVersion
      ? prefixApiVersion(options.customApiVersion)
      : options.apiVersion
  const apiVersion = variant ? VARIANTS_API_VERSION : userApiVersion

  const perspective = getActivePerspective({
    visionPerspective: options.perspective,
    perspectiveStack,
    scheduledDraftsStack,
  })

  const baseClient = useClient({apiVersion})
  const client = useMemo(
    () =>
      baseClient.withConfig({
        apiVersion,
        dataset: options.dataset,
        perspective,
        variant,
        allowReconfigure: true,
      }),
    [baseClient, apiVersion, options.dataset, perspective, variant],
  )

  return {
    apiVersion,
    isValidApiVersion: Boolean(variant) || isValidCustomApiVersion,
    isApiVersionLocked: Boolean(variant),
    perspective,
    variant,
    supportsSyncTags: !isApiVersionBelow(apiVersion, SYNC_TAGS_API_VERSION),
    client,
  }
}
