import {describe, expect, it} from 'vitest'

import {type InternalReferences} from './deletionMachine'
import {withoutReleaseOnlyReferences} from './withoutReleaseOnlyReferences'

const REFERENCES: InternalReferences = {
  totalCount: 5,
  references: [
    {_id: 'author-1', _type: 'author', required: true, failsLater: false},
    {_id: 'drafts.author-2', _type: 'author', required: false, failsLater: false},
    {_id: 'versions.rSummer.author-3', _type: 'author', required: false, failsLater: true},
    {_id: 'versions.rSchedDraft.author-4', _type: 'author', required: false, failsLater: true},
  ],
}

describe('withoutReleaseOnlyReferences', () => {
  it('leaves out links held only in a release, and keeps those held in a scheduled draft', () => {
    const result = withoutReleaseOnlyReferences(REFERENCES, new Set(['rSchedDraft']))
    expect(result.references.map((reference) => reference._id)).toEqual([
      'author-1',
      'drafts.author-2',
      'versions.rSchedDraft.author-4',
    ])
    // The count drops by the links left out, so links not loaded in the list still count
    expect(result.totalCount).toBe(4)
  })

  it('returns the same object when nothing is left out', () => {
    const noReleases: InternalReferences = {
      totalCount: 2,
      references: REFERENCES.references.slice(0, 2),
    }
    expect(withoutReleaseOnlyReferences(noReleases, new Set())).toBe(noReleases)
  })
})
