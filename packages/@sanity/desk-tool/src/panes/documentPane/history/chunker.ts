import {ChunkType, Chunk, Transaction, MendozaPatch} from './types'

function didDeleteDraft(type: ChunkType) {
  return type === 'delete' || type === 'discardDraft'
}

function canMergeEdit(type: ChunkType) {
  return type === 'create' || type === 'editDraft'
}

const CHUNK_WINDOW = 5 * 60 * 1000 // 5 minutes

function isWithinMergeWindow(a: Date, b: Date) {
  return b.valueOf() - a.valueOf() < CHUNK_WINDOW
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
    let authors = new Set<string>()
    for (let author of left.authors) authors.add(author)
    for (let author of right.authors) authors.add(author)

    return {
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

export function chunkFromTransaction(transaction: Transaction, pos: number): Chunk {
  let modifedDraft = transaction.draftEffect != null
  let modifedPublished = transaction.publishedEffect != null

  let draftDeleted = modifedDraft && isDeletePatch(transaction.draftEffect!.apply)
  let publishedDeleted = modifedPublished && isDeletePatch(transaction.publishedEffect!.apply)

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
    id: transaction.id,
    type,
    start: pos,
    end: pos + 1,
    startTimestamp: transaction.timestamp,
    endTimestamp: transaction.timestamp,
    authors: new Set([transaction.author]),
  }
}

function isDeletePatch(patch: MendozaPatch) {
  return patch[0] === 0 && patch[1] === null
}
