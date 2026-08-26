import {type ClientPerspective} from '@sanity/client'
import {RELEASES_STUDIO_CLIENT_OPTIONS, VARIANTS_STUDIO_CLIENT_OPTIONS} from 'sanity'

import {type VisionLocaleResourceKeys} from '../i18n/resources'
import {isApiVersionBelow} from './compareApiVersion'

const NAMED_PERSPECTIVES = new Set(['raw', 'published', 'drafts', 'previewDrafts'])

export interface ApiVersionCapabilityContext {
  statusCode: number | undefined
  apiVersion: string
  perspective: ClientPerspective | undefined
  variant: string | undefined
}

export interface ApiVersionCapabilityRequirement {
  id: string
  requiredApiVersion: string
  explanationKey: VisionLocaleResourceKeys
  applies: (context: ApiVersionCapabilityContext) => boolean
}

/**
 * Capability floors for Vision error copy. Order is precedence: the first
 * unsatisfied entry wins.
 *
 * Variant before releases matches `variantApiVersion()` in
 * `packages/sanity/src/core/variants/util/variantApiVersion.ts` — a variant
 * requirement takes precedence over the releases version for stacked
 * perspectives.
 *
 * Add a capability by appending an entry. Do not add a branch in the error
 * dialog.
 */
export const API_VERSION_CAPABILITIES: readonly ApiVersionCapabilityRequirement[] = [
  {
    id: 'variants',
    // `query.error.unsupported-variant` names the experimental API; reword it if this floor becomes dated.
    requiredApiVersion: VARIANTS_STUDIO_CLIENT_OPTIONS.apiVersion,
    explanationKey: 'query.error.unsupported-variant',
    applies: ({variant}) => Boolean(variant),
  },
  {
    id: 'releases',
    requiredApiVersion: RELEASES_STUDIO_CLIENT_OPTIONS.apiVersion,
    explanationKey: 'query.error.unsupported-release-perspective',
    applies: ({perspective}) => hasReleaseInPerspective(perspective),
  },
]

export function hasReleaseInPerspective(perspective: ClientPerspective | undefined): boolean {
  if (!Array.isArray(perspective)) {
    return false
  }

  return perspective.some((entry) => !NAMED_PERSPECTIVES.has(entry))
}

export function getUnsatisfiedApiVersionCapability(
  context: ApiVersionCapabilityContext,
  capabilities: readonly ApiVersionCapabilityRequirement[] = API_VERSION_CAPABILITIES,
): ApiVersionCapabilityRequirement | undefined {
  if (context.statusCode !== 400) {
    return undefined
  }

  return capabilities.find(
    (capability) =>
      capability.applies(context) &&
      isApiVersionBelow(context.apiVersion, capability.requiredApiVersion),
  )
}
