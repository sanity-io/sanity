import {type Chunk, type ChunkType} from 'sanity'

type NonPublishChunk = Omit<Chunk, 'type'> & {
  type: Exclude<ChunkType, 'publish'>
}
export type PublishChunk = Omit<Chunk, 'type'> & {
  type: 'publish'
  squashedChunks: Chunk[]
}
export const isNonPublishChunk = (chunk: Chunk): chunk is NonPublishChunk =>
  chunk.type !== 'publish'

export const isPublishChunk = (chunk: Chunk): chunk is PublishChunk => chunk.type === 'publish'

export type ChunksWithCollapsedDrafts = NonPublishChunk | PublishChunk
/**
 * Takes an array of chunks and collapses all the changes to the drafts (edits) into the published chunk
 */
export function collapseChunksOnPublish(chunks: Chunk[]): ChunksWithCollapsedDrafts[] {
  const result: ChunksWithCollapsedDrafts[] = []

  for (const chunk of chunks) {
    if (chunk.type === 'publish') {
      result.push({
        ...chunk,
        type: 'publish',
        squashedChunks: [], // Initialize the squashedChunks array
      })
      continue
    }
    if (chunk.type === 'editDraft') {
      const lastChunk = result[result.length - 1]
      if (lastChunk?.type === 'publish') {
        lastChunk.squashedChunks.push(chunk)
        continue
      }
    }
    if (isNonPublishChunk(chunk)) {
      result.push(chunk)
    }
  }

  return result
}
