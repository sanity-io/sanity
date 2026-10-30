import {describe, expect, it} from 'vitest'

import guessPreviewConfig from './guessPreviewConfig'

describe('guessPreviewConfig', () => {
  it.each([
    [
      {name: 'poster', type: 'image'},
      {name: 'trailer', type: 'sanity.video'},
    ],
    [
      {name: 'trailer', type: 'sanity.video'},
      {name: 'poster', type: 'image'},
    ],
  ])('prefers image media regardless of field order', (...mediaFields) => {
    expect(
      guessPreviewConfig({
        fields: [{name: 'title', type: 'string'}, ...mediaFields],
      }).select,
    ).toEqual({title: 'title', media: 'poster'})
  })

  it('uses video media when the schema has no image field', () => {
    expect(
      guessPreviewConfig({
        fields: [
          {name: 'title', type: 'string'},
          {name: 'trailer', type: 'sanity.video'},
        ],
      }).select,
    ).toEqual({title: 'title', media: 'trailer'})
  })
})
