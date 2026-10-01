import {describe, expect, it} from 'vitest'

import {createTestSource} from '../../../../test/testUtils/createTestSource'
import {commentsInspector as commentsV2Inspector} from '../../comments-v2/plugin/inspector'
import {commentsInspector} from '../../comments/plugin/inspector'

describe('default plugins declaring document features', () => {
  it('leaves the comments inspector where the flat registration put it, named `comments`', async () => {
    const source = await createTestSource()

    const flat = source.document.inspectors({documentId: 'author-1', documentType: 'author'})
    const {inspectors, byName} = source.document.features({
      documentId: 'author-1',
      schemaType: 'author',
    })

    expect(flat).toContain(commentsInspector)
    expect(inspectors).toEqual(flat)
    expect(byName.get('comments')).toEqual({name: 'comments', inspector: commentsInspector})
  })

  it('names the comments-v2 inspector `comments` too', async () => {
    const source = await createTestSource({beta: {comments: {v2: true}}})

    const flat = source.document.inspectors({documentId: 'author-1', documentType: 'author'})
    const {inspectors, byName} = source.document.features({
      documentId: 'author-1',
      schemaType: 'author',
    })

    expect(flat).toContain(commentsV2Inspector)
    expect(inspectors).toEqual(flat)
    expect(byName.get('comments')).toEqual({name: 'comments', inspector: commentsV2Inspector})
  })
})
