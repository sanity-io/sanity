/* eslint-disable no-nested-ternary */
import type {MendozaEffectPair, MendozaPatch} from '@sanity/types'
import {Chunk, ChunkType} from '../../../../field'
import type {Transaction} from './types'

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

type ChunkState = 'unedited' | 'deleted' | 'upsert'
function getChunkState(effect?: MendozaEffectPair): ChunkState {
  const modified = Boolean(effect)
  const deleted = effect && isDeletePatch(effect?.apply)

  if (deleted) {
    return 'deleted'
  }

  if (modified) {
    return 'upsert'
  }

  return 'unedited'
}

/*
 * getChunkType tries to determine what effect the given transaction had on the document
 * More information about the logic can be found here https://github.com/sanity-io/sanity/pull/2633#issuecomment-886461812
 *
 * |                    | draft unedited | draft deleted | draft upsert |
 * |--------------------|----------------|---------------|--------------|
 * | published unedited | X              | delete        | editDraft    |
 * | published deleted  | delete         | delete        | delete       |
 * | published upsert   | liveEdit       | publish       | liveEdit     |
 */
function getChunkType(transaction: Transaction): ChunkType {
  const draftState = getChunkState(transaction.draftEffect)
  const publishedState = getChunkState(transaction.publishedEffect)

  if (publishedState === 'unedited') {
    if (draftState === 'deleted') {
      return 'delete'
    }

    if (draftState === 'upsert') {
      return 'editDraft'
    }
  }

  if (publishedState === 'deleted') {
    return 'delete'
  }

  if (publishedState === 'upsert') {
    if (draftState === 'unedited') {
      return 'editLive'
    }

    if (draftState === 'deleted') {
      return 'publish'
    }

    if (draftState === 'upsert') {
      return 'editLive'
    }
  }

  return 'editLive'
}

export function chunkFromTransaction(transaction: Transaction): Chunk {
  const modifiedDraft = Boolean(transaction.draftEffect)
  const modifiedPublished = Boolean(transaction.publishedEffect)

  const draftDeleted = transaction.draftEffect && isDeletePatch(transaction.draftEffect.apply)
  const publishedDeleted =
    transaction.publishedEffect && isDeletePatch(transaction.publishedEffect.apply)

  const type = getChunkType(transaction)

  return {
    index: 0,
    id: transaction.id,
    type,
    start: transaction.index,
    end: transaction.index + 1,
    startTimestamp: transaction.timestamp,
    endTimestamp: transaction.timestamp,
    authors: new Set([transaction.author]),
    draftState: modifiedDraft ? (draftDeleted ? 'missing' : 'present') : 'unknown',
    publishedState: modifiedPublished ? (publishedDeleted ? 'missing' : 'present') : 'unknown',
  }
}

function combineState(
  left: 'present' | 'missing' | 'unknown',
  right: 'present' | 'missing' | 'unknown',
) {
  return right === 'unknown' ? left : right
}

export function isDeletePatch(patch: MendozaPatch): boolean {
  return patch[0] === 0 && patch[1] === null
}
