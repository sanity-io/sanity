import {describe, expect, it} from 'vitest'

import {type TFunction} from '../../../../i18n/types'
import {activeASAPRelease} from '../../../../releases/__fixtures__/release.fixture'
import {getVersionFilterLabel} from '../getVersionFilterLabel'

const LABELS = {
  'release.chip.published': 'Published',
  'release.chip.draft': 'Draft',
  'release.placeholder-untitled-release': 'Untitled release',
  'version.agent-bundle.proposed-changes': 'Proposed changes',
  'version.agent-bundle.agent-changes': 'Agent changes',
} as const

const t = ((key: string) => LABELS[key as keyof typeof LABELS] ?? key) as unknown as TFunction

describe('getVersionFilterLabel', () => {
  it('returns published and draft chip copy', () => {
    expect(getVersionFilterLabel('published', t, [])).toEqual({
      displayTitle: 'Published',
      fullTitle: 'Published',
      isTruncated: false,
    })
    expect(getVersionFilterLabel('drafts', t, [])).toEqual({
      displayTitle: 'Draft',
      fullTitle: 'Draft',
      isTruncated: false,
    })
  })

  it('truncates long release titles and keeps the full title', () => {
    const longTitle = 'A'.repeat(60)
    const result = getVersionFilterLabel(
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
      getVersionFilterLabel(
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
    expect(getVersionFilterLabel('agent-mine', t, [{id: 'agent-mine'}])).toEqual({
      displayTitle: 'Proposed changes',
      fullTitle: 'Proposed changes',
      isTruncated: false,
    })
  })

  it('labels other agent bundles as agent changes', () => {
    expect(getVersionFilterLabel('agent-other', t, [{id: 'agent-mine'}])).toEqual({
      displayTitle: 'Agent changes',
      fullTitle: 'Agent changes',
      isTruncated: false,
    })
  })
})
