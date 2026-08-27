import {type SchemaType} from '@sanity/types'
import {type Workspace} from 'sanity'

import {isLiveEditEnabled} from './components/paneItem/helpers'

export interface Context {
  workspace: {
    document: {
      drafts: Pick<Workspace['document']['drafts'], 'enabled'>
    }
  }
  schemaType: Pick<SchemaType, 'liveEdit'>
  ready: boolean
  draftExists: boolean
}

/**
 * Determine whether a document has an obsolete draft. This occurs if a document has a draft while
 * the draft model is inactive, or if a live-edit document has a draft (base or variant-scoped).
 */
export function hasObsoleteDraft({ready, draftExists, workspace, schemaType}: Context):
  | {
      result: true
      reason: 'LIVE_EDIT_ACTIVE' | 'DRAFT_MODEL_INACTIVE'
    }
  | {result: false}
  | {result: undefined} {
  if (!ready) {
    return {
      result: undefined,
    }
  }

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = workspace

  if (!draftExists) {
    return {
      result: false,
    }
  }

  if (!isDraftModelEnabled) {
    return {
      result: true,
      reason: 'DRAFT_MODEL_INACTIVE',
    }
  }

  if (isLiveEditEnabled(schemaType)) {
    return {
      result: true,
      reason: 'LIVE_EDIT_ACTIVE',
    }
  }

  return {
    result: false,
  }
}
