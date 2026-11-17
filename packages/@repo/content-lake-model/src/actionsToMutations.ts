import {ContentLakeError, documentNotFound} from './contentLakeError'
import {
  type ContentLakeAction,
  type CreateAction,
  type DocumentIndex,
  type EditAction,
  type MutationPayload,
} from './types'

const VERSION_ID_PREFIXES = ['drafts.', 'versions.']

type Exists = (id: string) => boolean

interface Translation {
  written: ReadonlySet<string>
  mutations: MutationPayload[]
}

function isVersionId(id: string): boolean {
  return VERSION_ID_PREFIXES.some((prefix) => id.startsWith(prefix))
}

function assertDecodable(action: ContentLakeAction, position: number): void {
  switch (action.actionType) {
    case 'sanity.action.document.edit':
      if ('ifRevisionID' in action.patch) {
        throw new ContentLakeError(400, {
          bodyTruncated: false,
          description: 'json: unknown field "ifRevisionID"',
          type: 'httpInvalidRequestBody',
        })
      }
      return
    case 'sanity.action.document.create':
      if (isVersionId(action.attributes._id)) return
      throw new ContentLakeError(400, {
        description: `action index ${position}: "attributes._id" must be prefixed with either "drafts." or "versions.{bundleId}"`,
        type: 'httpBadRequest',
      })
    default:
      throw new ContentLakeError(400, {
        description: `Unsupported action type: ${(action as {actionType: string}).actionType}`,
        type: 'httpBadRequest',
      })
  }
}

function systemBasePatch(draftId: string, path: string, value: unknown): MutationPayload {
  return {patch: {id: draftId, set: {[path]: value}, unsetIsEmpty: false}}
}

function editMutations(
  index: DocumentIndex,
  action: EditAction,
  exists: Exists,
): MutationPayload[] {
  const patch: MutationPayload = {patch: {id: action.draftId, ...action.patch, unsetIsEmpty: false}}
  if (exists(action.draftId)) return [patch]
  const published = index[action.publishedId]
  if (published === undefined) {
    throw new ContentLakeError(404, documentNotFound(action.publishedId))
  }
  return [
    {create: {...published, _id: action.draftId}},
    systemBasePatch(action.draftId, '_system.base.id', action.publishedId),
    systemBasePatch(action.draftId, '_system.base.rev', published._rev),
    patch,
  ]
}

function createMutations(action: CreateAction, exists: Exists): MutationPayload[] {
  const existingId = [
    action.attributes._id,
    `drafts.${action.publishedId}`,
    action.publishedId,
  ].find(exists)
  if (existingId === undefined) return [{createOrReplace: action.attributes}]
  if (action.ifExists === 'ignore') return []
  throw new ContentLakeError(409, {
    description: `there is already a version of a document for published ID "${action.publishedId}"`,
    id: existingId,
    type: 'documentAlreadyExistsError',
  })
}

function createdIdOf(mutation: MutationPayload): string[] {
  const id = mutation.create?._id ?? mutation.createOrReplace?._id
  return id === undefined ? [] : [id]
}

/**
 * Translates actions into the mutations Content Lake reports for them on the listener. Each action
 * sees the documents written by the actions before it in the same request.
 */
export function actionsToMutations(
  index: DocumentIndex,
  actions: ContentLakeAction[],
): MutationPayload[] {
  actions.forEach(assertDecodable)
  return actions.reduce<Translation>(
    ({written, mutations}, action) => {
      const exists: Exists = (id) => id in index || written.has(id)
      const next =
        action.actionType === 'sanity.action.document.edit'
          ? editMutations(index, action, exists)
          : createMutations(action, exists)
      return {
        written: new Set([...written, ...next.flatMap(createdIdOf)]),
        mutations: [...mutations, ...next],
      }
    },
    {written: new Set(), mutations: []},
  ).mutations
}
