import {describe, expect, it} from 'vitest'

import {defaultResolveFieldComponent} from './fieldResolver'

const experimentalUnionMarker = '__experimental_union'

describe('defaultResolveFieldComponent', () => {
  it('resolves standalone union schema types to an object-style field wrapper', () => {
    const unionType = Object.assign(
      {
        name: 'oneOfMany',
        jsonType: 'object',
        unionKind: 'object',
        fields: [],
        of: [{name: 'hero', jsonType: 'object', fields: []}],
      },
      {[experimentalUnionMarker]: true},
    )

    expect(defaultResolveFieldComponent(unionType as any).name).toBe('UnionField')
  })
})
