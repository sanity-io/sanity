/* eslint-disable no-nested-ternary */
import {Transaction, MendozaPatch, ChunkType, Chunk} from './types'

function didDeleteDraft(type: ChunkType) {
  return type === 'delete' || type === 'discardDraft'
}

function canMergeEdit(type: ChunkType) {
  return type === 'create' || type === 'editDraft'
}

const CHUNK_WINDOW = 5 * 60 * 1000 // 5 minutes

function isWithinMergeWindow(a: string, b: string) {
  return Date.parse(b) - Date.parse(a) < CHUNK_WINDOW
}

// eslint-disable-next-line complexity
export function mergeChunk(left: Chunk, right: Chunk): Chunk | [Chunk, Chunk] {
  if (left.end !== right.start) throw new Error('chunks are not next to each other')

  // TODO: How to detect first squash/create

  const draftState = combineState(left.draftState, right.draftState)
  const publishedState = combineState(left.publishedState, right.publishedState)

  if (left.type === 'delete' && right.type === 'editDraft') {
    return [left, {...right, type: 'create', draftState, publishedState}]
  }

  // Convert deletes into either discardDraft or unpublish depending on what's been deleted.
  if (right.type === 'delete') {
    if (draftState === 'missing' && publishedState === 'present') {
      return [left, {...right, type: 'discardDraft', draftState, publishedState}]
    }

    if (draftState === 'present' && publishedState === 'missing') {
      return [left, {...right, type: 'unpublish', draftState, publishedState}]
    }
  }

  if (
    canMergeEdit(left.type) &&
    right.type === 'editDraft' &&
    isWithinMergeWindow(left.endTimestamp, right.startTimestamp)
  ) {
    const authors = new Set<string>()
    for (const author of left.authors) authors.add(author)
    for (const author of right.authors) authors.add(author)

    return {
      index: 0,
      id: right.id,
      type: left.type,
      start: left.start,
      end: right.end,
      startTimestamp: left.startTimestamp,
      endTimestamp: right.endTimestamp,
      authors,
      draftState,
      publishedState,
    }
  }

  return [left, {...right, draftState, publishedState}]
}

export function chunkFromTransaction(transaction: Transaction): Chunk {
  const modifedDraft = transaction.draftEffect != null
  const modifedPublished = transaction.publishedEffect != null

  const draftDeleted = modifedDraft && isDeletePatch(transaction.draftEffect!.apply)
  const publishedDeleted = modifedPublished && isDeletePatch(transaction.publishedEffect!.apply)

  let type: ChunkType = 'editDraft'

  if (draftDeleted && modifedPublished && !publishedDeleted) {
    type = 'publish'
  } else if (draftDeleted || publishedDeleted) {
    // We don't really know anything more at this point since the actual
    // behavior depends on the earlier state.
    type = 'delete'
  }

  return {
    index: 0,
    id: transaction.id,
    type,
    start: transaction.index,
    end: transaction.index + 1,
    startTimestamp: transaction.timestamp,
    endTimestamp: transaction.timestamp,
    authors: new Set([transaction.author]),
    draftState: modifedDraft ? (draftDeleted ? 'missing' : 'present') : 'unknown',
    publishedState: modifedPublished ? (publishedDeleted ? 'missing' : 'present') : 'unknown',
  }
}

function combineState(
  left: 'present' | 'missing' | 'unknown',
  right: 'present' | 'missing' | 'unknown'
) {
  return right === 'unknown' ? left : right
}

export function isDeletePatch(patch: MendozaPatch) {
  return patch[0] === 0 && patch[1] === null
}
