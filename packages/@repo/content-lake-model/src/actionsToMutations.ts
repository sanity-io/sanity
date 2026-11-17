import {ContentLakeError} from './contentLakeError'
import {
  type ContentLakeAction,
  type ContentLakeDocument,
  type DocumentIndex,
  type EditAction,
  type MutationPayload,
} from './types'

const UNKNOWN_TYPE = 'contentLakeModel.unknown'

function withoutSystemFields(document: ContentLakeDocument): ContentLakeDocument {
  const {_rev, _createdAt, _updatedAt, ...rest} = document
  return rest
}

// A first edit of a brand-new document carries its type in `set`; the fallback type fails readback loudly.
function typeFromPatch(action: EditAction): string {
  const set = action.patch.set as Record<string, unknown> | undefined
  return typeof set?._type === 'string' ? set._type : UNKNOWN_TYPE
}

function draftBase(index: DocumentIndex, action: EditAction): ContentLakeDocument {
  const published = index[action.publishedId]
  return published
    ? {...withoutSystemFields(published), _id: action.draftId}
    : {_id: action.draftId, _type: typeFromPatch(action)}
}

function editMutations(index: DocumentIndex, action: EditAction): MutationPayload[] {
  const patch: MutationPayload = {patch: {id: action.draftId, ...action.patch}}
  return action.draftId in index ? [patch] : [{createIfNotExists: draftBase(index, action)}, patch]
}

export function actionsToMutations(
  index: DocumentIndex,
  actions: ContentLakeAction[],
): MutationPayload[] {
  return actions.flatMap((action): MutationPayload[] => {
    switch (action.actionType) {
      case 'sanity.action.document.create': {
        if (action.ifExists === 'fail' && action.attributes._id in index) {
          throw new ContentLakeError(409, `Document "${action.attributes._id}" already exists`)
        }
        return [{createIfNotExists: action.attributes}]
      }
      case 'sanity.action.document.edit':
        return editMutations(index, action)
      default:
        throw new ContentLakeError(
          400,
          `Unsupported action type: ${(action as {actionType: string}).actionType}`,
        )
    }
  })
}
