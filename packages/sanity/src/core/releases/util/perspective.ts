/* eslint-disable @typescript-eslint/no-redeclare */
import {type Brand, make} from 'ts-brand'

import {ReleaseId} from './releaseId'

export type DraftsPerspective = Brand<'drafts', 'draftsPerspective'>
export type PublishedPerspective = Brand<'published', 'publishedPerspective'>
/** @internal */
export const DRAFTS_PERSPECTIVE = 'drafts' as DraftsPerspective
/** @internal */
export const PUBLISHED_PERSPECTIVE = 'published' as PublishedPerspective

export type ReleasePerspective = DraftsPerspective | PublishedPerspective | ReleaseId
export type SelectableReleasePerspective = PublishedPerspective | ReleaseId

export const SelectableReleasePerspective = make<SelectableReleasePerspective>((id) => {
  return id === DRAFTS_PERSPECTIVE ? id : ReleaseId(id)
})

export const ReleasePerspective = make<ReleasePerspective>((id) => {
  return id === DRAFTS_PERSPECTIVE || id === PUBLISHED_PERSPECTIVE ? id : ReleaseId(id)
})
