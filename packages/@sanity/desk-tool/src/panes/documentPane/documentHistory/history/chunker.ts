import {ChunkType, Chunk} from '@sanity/field/diff'
import {Transaction, MendozaPatch} from './types'

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

export function mergeChunk(left: Chunk, right: Chunk): Chunk | [Chunk, Chunk] {
  if (left.end !== right.start) throw new Error('chunks are not next to each other')

  // TODO: How to detect first squash/create

  if (didDeleteDraft(left.type) && right.type === 'editDraft') {
    return [left, {...right, type: 'create'}]
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
      id: left.id,
      type: left.type,
      start: left.start,
      end: right.end,
      startTimestamp: left.startTimestamp,
      endTimestamp: right.endTimestamp,
      authors
    }
  }

  return [left, right]
}

export function chunkFromTransaction(transaction: Transaction): Chunk {
  const modifedDraft = transaction.draftEffect != null
  const modifedPublished = transaction.publishedEffect != null

  const draftDeleted = modifedDraft && isDeletePatch(transaction.draftEffect!.apply)
  const publishedDeleted = modifedPublished && isDeletePatch(transaction.publishedEffect!.apply)

  let type: ChunkType = 'editDraft'

  if (draftDeleted) {
    if (publishedDeleted) {
      type = 'delete'
    } else if (modifedPublished) {
      type = 'publish'
    } else {
      type = 'discardDraft'
    }
  } else if (publishedDeleted) {
    type = 'unpublish'
  }

  return {
    index: 0,
    id: transaction.id,
    type,
    start: transaction.index,
    end: transaction.index + 1,
    startTimestamp: transaction.timestamp,
    endTimestamp: transaction.timestamp,
    authors: new Set([transaction.author])
  }
}

function isDeletePatch(patch: MendozaPatch) {
  return patch[0] === 0 && patch[1] === null
}
