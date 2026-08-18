import {describe, expect, it} from 'vitest'

import {VARIANT_DOCUMENTS_PATH} from '../../store/constants'
import {createVariantId} from '../createVariantId'

describe('createVariantId', () => {
  it('creates ids under the variants documents path without a release-style prefix', () => {
    const id = createVariantId()

    expect(id.startsWith(`${VARIANT_DOCUMENTS_PATH}.`)).toBe(true)
    expect(id).not.toBe(`${VARIANT_DOCUMENTS_PATH}.r`)
    expect(id.length).toBe(`${VARIANT_DOCUMENTS_PATH}.`.length + 8)
  })
})
