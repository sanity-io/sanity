import {type ClientPerspective, type ReleaseDocument} from '@sanity/client'
// eslint-disable-next-line no-restricted-imports -- fine-grained control needed
import {type MenuItem} from '@sanity/ui'
import {type ComponentProps} from 'react'

import {type SystemBundle} from '../util/draftUtils'

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
export type TargetPerspective = ReleaseDocument | SystemBundle

/**
 * @beta
 * @deprecated Use `TargetPerspective` instead.
 */
export type SelectedPerspective = TargetPerspective

/**
 * @beta
 */
export type PerspectiveStack = ExtractArray<ClientPerspective>

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
}

/**
 * @internal
 */
export type RawPerspectiveContextValue = Pick<
  PerspectiveContextValue,
  'selectedPerspective' | 'selectedPerspectiveName' | 'selectedReleaseId'
>

type ExtractArray<Union> = Union extends unknown[] ? Union : never

/**
 * @internal
 */
export type ReleasesNavMenuItemPropsGetter = (content: {
  perspective: TargetPerspective
}) => Partial<ComponentProps<typeof MenuItem>>
