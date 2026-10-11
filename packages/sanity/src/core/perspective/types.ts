import {type ClientPerspective, type ReleaseDocument} from '@sanity/client'
// oxlint-disable-next-line no-restricted-imports -- fine-grained control needed
import {type MenuItem} from '@sanity/ui/menu'
import {type ComponentProps} from 'react'

import {type SystemBundle} from '../util/draftUtils'
import {type SystemVariant} from '../variants/types'

/**
 * @beta
 */
// todo: replace with branded type from @sanity/id-utils
export type ReleaseId = string

/**
 * A value representing a perspective, including the data describing it. This is either the name of a
 * system bundle, or a document describing a release.
 *
 * @public
 */
export type TargetPerspective = ReleaseDocument | SystemBundle | string

/**
 * @beta
 * @deprecated Use `TargetPerspective` instead.
 */
export type SelectedPerspective = TargetPerspective

/**
 * @beta
 */
export type PerspectiveStack = ExtractArray<ClientPerspective>

export type PerspectiveBundle = 'published' | 'drafts' | (string & {})
/**
 * @beta
 */
export interface PerspectiveContextValue {
  /* The selected perspective name, it could be a release or Published */
  selectedPerspectiveName: 'published' | ReleaseId | undefined
  /**
   * The releaseId as `r<string>`; it will be undefined if the selected perspective is `published` or `drafts`
   */
  selectedReleaseId: ReleaseId | undefined

  /* Return the current global release */
  selectedPerspective: TargetPerspective
  /**
   * The stacked array of perspectives ids ordered chronologically to represent the state of documents at the given point in time.
   * It can be used as the perspective param in the client to get the correct view of the documents.
   * @returns ["published"] | ["drafts"] | ["releaseId2", "releaseId1", "drafts"]
   */
  perspectiveStack: PerspectiveStack
  /* The excluded perspectives */
  excludedPerspectives: string[]
  /**
   * Short ids requested via the `variant` sticky param, in param order.
   * Empty when no variant is requested. A bare id is type `variant`.
   * Each id is available synchronously, before its definition has resolved.
   * Document editing uses the first id only until multi variants are supported.
   * @beta
   * @internal
   */
  selectedVariantNames: string[]
  /**
   * Resolved definitions aligned with {@link PerspectiveContextValue.selectedVariantNames}.
   * An entry is undefined while definitions are loading (see `useAllVariants().loading`) or
   * when that id matches no definition.
   * Document editing uses the first entry only until multi variants are supported.
   * @beta
   * @internal
   */
  selectedVariants: (SystemVariant | undefined)[]
  /**
   * The first `selectedVariantNames` entry.
   * Undefined when no variant is requested.
   *
   * @deprecated Use `selectedVariantNames`. This is the first selected id.
   * @beta
   * @internal
   */
  selectedVariantName: string | undefined
  /**
   * The first `selectedVariants` entry.
   * Undefined when no variant is requested, while definitions are loading, or when the first id
   * matches no definition.
   *
   * @deprecated Use `selectedVariants`. This is the first selected definition.
   * @beta
   * @internal
   */
  selectedVariant: SystemVariant | undefined
  /**
   * The selected bundle, either `published`, `drafts` or a release id or the bundle id for anonymous bundles like agent documents.
   */
  bundle: PerspectiveBundle
}

/**
 * @internal
 */
type ExtractArray<Union> = Union extends unknown[] ? Union : never

/**
 * @internal
 */
export type ReleasesNavMenuItemPropsGetter = (content: {
  perspective: TargetPerspective
}) => Partial<ComponentProps<typeof MenuItem>>
