import {type SanityDocument} from '@sanity/types'

import {type EditStateFor} from './document-pair/editState'

/**
 * Given an `EditState` object targeting the upstream version, select the first relevant document
 * that exists.
 *
 * - This is the version document itself if it exists.
 * - Otherwise, it is the published document.
 * - If neither documents exist, there is no existent upstream version.
 *
 * Unlike in other parts of the codebase, draft versions are never relevant here, because they
 * cannot be the upstream version of another document.
 *
 * @internal
 */
export function selectUpstreamVersion(upstreamEditState: EditStateFor): SanityDocument | null {
  return upstreamEditState.version ?? upstreamEditState.published
}
