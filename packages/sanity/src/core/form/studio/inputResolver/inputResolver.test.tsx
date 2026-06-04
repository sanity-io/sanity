import {describe, expect, it} from 'vitest'

import {UnionInput} from '../../inputs/UnionInput'
import {defaultResolveInputComponent} from './inputResolver'

const experimentalUnionMarker = '__experimental_union'

describe('defaultResolveInputComponent', () => {
  it('resolves standalone union schema types to the union input', () => {
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

    expect(defaultResolveInputComponent(unionType as any)).toBe(UnionInput)
  })
})
