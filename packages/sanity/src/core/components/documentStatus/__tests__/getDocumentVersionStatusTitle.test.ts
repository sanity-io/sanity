import {describe, expect, it} from 'vitest'

import {getDocumentVersionStatusTitle} from '../getDocumentVersionStatusTitle'

describe('getDocumentVersionStatusTitle', () => {
  it('prefixes the default variant title when variants are enabled', () => {
    expect(
      getDocumentVersionStatusTitle({
        variantsEnabled: true,
        variantTitle: 'All users (Default)',
        releaseTitle: 'Published',
      }),
    ).toBe('All users (Default) · Published')
  })

  it('prefixes a named variant title when variants are enabled', () => {
    expect(
      getDocumentVersionStatusTitle({
        variantsEnabled: true,
        variantTitle: 'Returning visitors',
        releaseTitle: 'Draft',
      }),
    ).toBe('Returning visitors · Draft')
  })

  it('returns only the perspective when variants are disabled', () => {
    expect(
      getDocumentVersionStatusTitle({
        variantsEnabled: false,
        variantTitle: 'All users (Default)',
        releaseTitle: 'Published',
      }),
    ).toBe('Published')
  })

  it('ignores a named variant title when variants are disabled', () => {
    expect(
      getDocumentVersionStatusTitle({
        variantsEnabled: false,
        variantTitle: 'Returning visitors',
        releaseTitle: 'Draft',
      }),
    ).toBe('Draft')
  })
})
