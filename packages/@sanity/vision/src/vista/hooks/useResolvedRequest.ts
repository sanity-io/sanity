import {type ClientPerspective, type ReleaseDocument, type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {
  getDefaultVariant,
  getReleaseIdFromReleaseDocumentId,
  isCardinalityOneRelease,
  type PerspectiveContextValue,
  type PerspectiveStack,
  sortReleases,
  useActiveReleases,
  useClient,
  usePerspective,
  useScheduledDraftsEnabled,
  useWorkspace,
} from 'sanity'

import {DEFAULT_API_VERSION, VARIANTS_API_VERSION} from '../../apiVersions'
import {getActivePerspective} from '../../perspectives'
import {isApiVersionBelow} from '../../util/compareApiVersion'
import {prefixApiVersion} from '../../util/prefixApiVersion'
import {validateApiVersion} from '../../util/validateApiVersion'
import {type VistaPerspective, type VistaTabOptions} from '../store/types'
import {useVistaSelector} from '../store/VistaActorContext'
import {selectWorkspaceDataset} from '../store/vistaMachine'
import {SYNC_TAGS_API_VERSION} from '../util/syncTags'
import {getTabDataset} from '../util/tabDataset'
import {getEffectivePerspective} from '../util/tabPerspective'

export interface ResolvedRequest {
  /** The dataset requests go to: the workspace's while the tab follows it, else the pinned one */
  dataset: string
  /**
   * The tab's perspective option as it applies in this workspace: `scheduledDrafts` counts as
   * `global` where the workspace does not offer scheduled drafts
   */
  tabPerspective: VistaPerspective
  /** The API version requests are sent with, `vX` while a variant is selected */
  apiVersion: string
  /** Whether the tab's API version is usable (the "Other" input may hold an unfinished one) */
  isValidApiVersion: boolean
  /** The API version is forced to `vX` because the navbar has a variant selected */
  isApiVersionLocked: boolean
  perspective: ClientPerspective | undefined
  variant: string | undefined
  /** Queries go through the API CDN: the tab asks for it, and the perspective is one it serves */
  useCdn: boolean
  /** The tab asks for the API CDN, but it serves neither the drafts perspective nor a stack */
  isCdnBlockedByPerspective: boolean
  /**
   * The studio signs in with a cookie, which the API CDN never receives, so it answers queries
   * as it would an anonymous visitor's
   */
  isCdnAnonymous: boolean
  /** Sync tags (and therefore automatic refetching) need a modern API version */
  supportsSyncTags: boolean
  /** Client configured for the tab: API version, dataset, perspective and variant */
  client: SanityClient
}

/** The studio state a tab's options are resolved against; the same for every tab */
export interface RequestEnvironment {
  workspaceDataset: string
  perspectiveStack: PerspectiveContextValue['perspectiveStack']
  selectedVariantNames: PerspectiveContextValue['selectedVariantNames']
  /** The stack the `scheduledDrafts` perspective stands for, where the workspace offers it */
  scheduledDraftsStack: PerspectiveStack | undefined
  isScheduledDraftsEnabled: boolean
}

/** The part of a resolved request that follows from the options alone, without a client */
export type ResolvedRequestOptions = Omit<
  ResolvedRequest,
  'supportsSyncTags' | 'client' | 'isCdnAnonymous'
>

/**
 * Whether the API CDN serves a perspective. It rejects `drafts` and stacks, so `@sanity/client`
 * sends those to the API even with `useCdn`; Vision does the same, and shows it
 */
function isServedByCdn(perspective: ClientPerspective | undefined): boolean {
  if (Array.isArray(perspective)) return perspective.length === 0
  return perspective !== 'drafts' && perspective !== 'previewDrafts'
}

/** Reads the studio state every tab's options are resolved against */
export function useRequestEnvironment(): RequestEnvironment {
  const {perspectiveStack, selectedVariantNames} = usePerspective()
  const workspaceDataset = useVistaSelector(selectWorkspaceDataset)
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

  return useMemo(
    () => ({
      workspaceDataset,
      perspectiveStack,
      selectedVariantNames,
      scheduledDraftsStack,
      isScheduledDraftsEnabled,
    }),
    [
      isScheduledDraftsEnabled,
      perspectiveStack,
      scheduledDraftsStack,
      selectedVariantNames,
      workspaceDataset,
    ],
  )
}

/**
 * Resolves a tab's options against the studio state: a followed workspace dataset, the `global`
 * and `scheduledDrafts` perspectives becoming real perspective stacks, and the navbar variant,
 * which locks the API version to the experimental one.
 */
export function resolveRequestOptions(
  options: VistaTabOptions,
  environment: RequestEnvironment,
): ResolvedRequestOptions {
  const {workspaceDataset, perspectiveStack, selectedVariantNames, scheduledDraftsStack} =
    environment
  const dataset = getTabDataset(options, workspaceDataset)

  // Queries take one variant until the studio supports editing several at once
  const variant = options.variant === 'global' ? getDefaultVariant(selectedVariantNames) : undefined
  const isValidApiVersion = validateApiVersion(options.apiVersion)
  // An unfinished "Other" version still needs a client to exist; requests are refused meanwhile
  const userApiVersion = isValidApiVersion
    ? prefixApiVersion(options.apiVersion)
    : DEFAULT_API_VERSION
  const apiVersion = variant ? VARIANTS_API_VERSION : userApiVersion

  // `global` is what the classic tool calls the pinned release: the navbar's perspective stack
  const tabPerspective = getEffectivePerspective(
    options.perspective,
    environment.isScheduledDraftsEnabled,
  )
  const perspective = getActivePerspective({
    visionPerspective: tabPerspective === 'global' ? 'pinnedRelease' : tabPerspective,
    perspectiveStack,
    scheduledDraftsStack,
  })

  const servedByCdn = isServedByCdn(perspective)

  return {
    dataset,
    tabPerspective,
    apiVersion,
    isValidApiVersion: Boolean(variant) || isValidApiVersion,
    isApiVersionLocked: Boolean(variant),
    perspective,
    variant,
    useCdn: options.useCdn && servedByCdn,
    isCdnBlockedByPerspective: options.useCdn && !servedByCdn,
  }
}

/**
 * Resolves the effective request configuration for a tab's options against studio state (see
 * `resolveRequestOptions`), with a client configured for it.
 */
export function useResolvedRequest(options: VistaTabOptions): ResolvedRequest {
  const environment = useRequestEnvironment()
  const resolved = useMemo(
    () => resolveRequestOptions(options, environment),
    [environment, options],
  )
  const {apiVersion, dataset, perspective, variant} = resolved

  const baseClient = useClient({apiVersion})
  const client = useMemo(
    () =>
      baseClient.withConfig({
        apiVersion,
        dataset,
        perspective,
        variant,
        allowReconfigure: true,
      }),
    [baseClient, apiVersion, dataset, perspective, variant],
  )

  return useMemo(() => {
    const {token, withCredentials} = client.config()
    return {
      ...resolved,
      isCdnAnonymous: resolved.useCdn && !token && Boolean(withCredentials),
      supportsSyncTags: !isApiVersionBelow(apiVersion, SYNC_TAGS_API_VERSION),
      client,
    }
  }, [apiVersion, client, resolved])
}
