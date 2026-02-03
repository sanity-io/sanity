import {type SchemaType} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {getPreviewPaths} from './getPreviewPaths'

const preview: SchemaType['preview'] = {
  select: {
    title: 'name',
    awards: 'awards',
    role: 'role',
    relatedAuthors: 'relatedAuthors',
    lastUpdated: '_updatedAt',
    media: 'image',
  },
}

describe('getPreviewPaths', () => {
  it('Should return undefined if no selection is provided', () => {
    const paths = getPreviewPaths({
      select: undefined,
    })
    expect(paths).toBeUndefined()
  })
  it('should return the default preview paths', () => {
    const paths = getPreviewPaths(preview)
    expect(paths).toEqual([
      ['name'],
      ['awards'],
      ['role'],
      ['relatedAuthors'],
      ['_updatedAt'],
      ['image'],
      ['_createdAt'],
      ['_updatedAt'],
    ])
  })
})
