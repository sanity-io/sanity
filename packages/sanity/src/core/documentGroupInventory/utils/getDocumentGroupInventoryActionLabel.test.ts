import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {type TFunction} from '../../i18n/types'
import {createMockVariant} from '../../variants/__fixtures__/createMockVariant'
import {variantAlphaAudience} from '../../variants/__fixtures__/variants.fixture'
import {getDocumentGroupInventoryActionLabel} from './getDocumentGroupInventoryActionLabel'

const t = ((key: string) => key) as unknown as TFunction

describe('getDocumentGroupInventoryActionLabel', () => {
  it('returns an empty string when there is no perspective', () => {
    expect(
      getDocumentGroupInventoryActionLabel({
        perspective: undefined,
        variant: undefined,
        t,
      }),
    ).toBe('')
  })

  it('labels drafts and published perspectives', () => {
    expect(
      getDocumentGroupInventoryActionLabel({
        perspective: 'drafts',
        variant: undefined,
        t,
      }),
    ).toBe('Draft')

    expect(
      getDocumentGroupInventoryActionLabel({
        perspective: 'published',
        variant: undefined,
        t,
      }),
    ).toBe('Published')
  })

  it('labels agent bundles', () => {
    expect(
      getDocumentGroupInventoryActionLabel({
        perspective: 'agent-abc123',
        variant: undefined,
        t,
      }),
    ).toBe('version.agent-bundle.proposed-changes')
  })

  it('uses the release title when the perspective is a release document', () => {
    const release = {
      _id: '_.releases.rSummer',
      metadata: {title: 'Summer drop'},
    } as unknown as ReleaseDocument

    expect(
      getDocumentGroupInventoryActionLabel({
        perspective: release,
        variant: variantAlphaAudience,
        t,
      }),
    ).toBe('Summer drop')
  })

  it('uses the variant title when the perspective is a raw scope id', () => {
    // Variant documents live at `versions.<scopeId>.<docId>`. `useVersionRelease`
    // cannot resolve that scope id to a release, so it falls back to the raw id.
    expect(
      getDocumentGroupInventoryActionLabel({
        perspective: 'Ab12cd34',
        variant: variantAlphaAudience,
        t,
      }),
    ).toBe('Alpha audience')
  })

  it('falls back to the short variant id when the variant has no title', () => {
    const untitled = createMockVariant('Ab12cd34')

    expect(
      getDocumentGroupInventoryActionLabel({
        perspective: 'Ab12cd34',
        variant: untitled,
        t,
      }),
    ).toBe('Ab12cd34')
  })

  it('falls back to the raw perspective string when no variant is available', () => {
    expect(
      getDocumentGroupInventoryActionLabel({
        perspective: 'Ab12cd34',
        variant: undefined,
        t,
      }),
    ).toBe('Ab12cd34')
  })
})
