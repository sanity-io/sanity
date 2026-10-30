import {describe, expect, it} from 'vitest'

import {type TFunction} from '../../i18n/types'
import {activeASAPRelease} from '../../releases/__fixtures__/release.fixture'
import {getGlobalPerspectiveLabel} from '../getGlobalPerspectiveLabel'

const LABELS = {
  'release.chip.published': 'Published',
  'release.chip.draft': 'Draft',
  'release.chip.global.drafts': 'Drafts',
  'release.placeholder-untitled-release': 'Untitled release',
  'version.agent-bundle.proposed-changes': 'Proposed changes',
  'version.agent-bundle.agent-changes': 'Agent changes',
} as const

const t = ((key: string) => LABELS[key as keyof typeof LABELS] ?? key) as unknown as TFunction

describe('getGlobalPerspectiveLabel', () => {
  it('returns the global drafts and published chip copy', () => {
    expect(getGlobalPerspectiveLabel('published', t, [])).toEqual({
      displayTitle: 'Published',
      fullTitle: 'Published',
      isTruncated: false,
    })
    expect(getGlobalPerspectiveLabel('drafts', t, [])).toEqual({
      displayTitle: 'Drafts',
      fullTitle: 'Drafts',
      isTruncated: false,
    })
  })

  it('uses the singular draft label when asked', () => {
    expect(getGlobalPerspectiveLabel('drafts', t, [], 'release.chip.draft')).toEqual({
      displayTitle: 'Draft',
      fullTitle: 'Draft',
      isTruncated: false,
    })
  })

  it('truncates long release titles and keeps the full title', () => {
    const longTitle = 'A'.repeat(60)
    const result = getGlobalPerspectiveLabel(
      {...activeASAPRelease, metadata: {...activeASAPRelease.metadata, title: longTitle}},
      t,
      [],
    )

    expect(result.isTruncated).toBe(true)
    expect(result.fullTitle).toBe(longTitle)
    expect(result.displayTitle).toBe(`${'A'.repeat(50)}\u2026`)
  })

  it('falls back to untitled copy when a release has no title', () => {
    expect(
      getGlobalPerspectiveLabel(
        {...activeASAPRelease, metadata: {...activeASAPRelease.metadata, title: ''}},
        t,
        [],
      ),
    ).toEqual({
      displayTitle: 'Untitled release',
      fullTitle: 'Untitled release',
      isTruncated: false,
    })
  })

  it('labels the current user agent bundle as proposed changes', () => {
    expect(getGlobalPerspectiveLabel('agent-mine', t, [{id: 'agent-mine'}])).toEqual({
      displayTitle: 'Proposed changes',
      fullTitle: 'Proposed changes',
      isTruncated: false,
    })
  })

  it('labels other agent bundles as agent changes', () => {
    expect(getGlobalPerspectiveLabel('agent-other', t, [{id: 'agent-mine'}])).toEqual({
      displayTitle: 'Agent changes',
      fullTitle: 'Agent changes',
      isTruncated: false,
    })
  })

  it('shows an unknown perspective id as-is', () => {
    expect(getGlobalPerspectiveLabel('rstudio-Ni4xNC4w', t, [])).toEqual({
      displayTitle: 'rstudio-Ni4xNC4w',
      fullTitle: 'rstudio-Ni4xNC4w',
      isTruncated: false,
    })
  })
})
