import {type Chunk, type ChunkType} from 'sanity'

export type NonPublishChunk = Omit<Chunk, 'type'> & {
  type: Exclude<ChunkType, 'publish'>
  parentId?: string
}

export type PublishChunk = Omit<Chunk, 'type'> & {
  type: 'publish'
  children: string[]
  collaborators: Set<string>
}

export const isNonPublishChunk = (chunk: Chunk): chunk is NonPublishChunk =>
  chunk.type !== 'publish'

export const isPublishChunk = (chunk: Chunk): chunk is PublishChunk => chunk.type === 'publish'

/**
 * searches for the previous publish action in the list of chunks
 * e.g. chunks = [publish, edit, publish, edit, edit] it needs to return the second publish action
 * e.g. chunks = [publish, edit, delete, edit, edit] it returns undefined
 */

function getPreviousPublishAction(chunks: Chunk[]) {
  let previousPublish: PublishChunk | null = null
  // We need to iterate from the end to the start of the list
  for (let index = chunks.length - 1; index >= 0; index--) {
    const chunk = chunks[index]
    if (isPublishChunk(chunk)) {
      previousPublish = chunk
      break
    }
    if (chunk.type === 'editDraft') {
      continue
    } else break
  }

  return previousPublish
}
export type ChunksWithCollapsedDrafts = NonPublishChunk | PublishChunk

/**
 * Takes an array of chunks and adds them metadata necessary for the timeline view.
 * for draft chunks, it will add the parentId of the published chunk if this draft action is now published
 * for published, it will add the children array and the collaborators array
 */
export function addChunksMetadata(chunks: Chunk[]): ChunksWithCollapsedDrafts[] {
  const result: ChunksWithCollapsedDrafts[] = []

  for (const chunk of chunks) {
    if (isPublishChunk(chunk)) {
      result.push({
        ...chunk,
        type: 'publish',
        children: [],
        collaborators: new Set(), // Initialize the collaborators array
      })
      continue
    }
    if (isNonPublishChunk(chunk)) {
      const previousPublish = getPreviousPublishAction(result)
      if (chunk.type === 'editDraft' && previousPublish?.type === 'publish') {
        Array.from(chunk.authors).forEach((id) => {
          previousPublish.collaborators.add(id)
        })
        previousPublish.children.push(chunk.id)
        result.push({
          ...chunk,
          parentId: previousPublish.id,
        })
        continue
      }
    }
    if (isNonPublishChunk(chunk)) {
      result.push(chunk)
    }
  }

  return result
}
