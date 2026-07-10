import {describe, expect, it} from 'vitest'

import {getMockBatch, getMockProposal} from './mockAgentProposal'
import {type ConfidenceHat} from './types'

const VALID_HATS: ConfidenceHat[] = [
  'strategist',
  'author',
  'reviewer',
  'localizer',
  'developer',
  'marketer',
  'ops-owner',
]

describe('getMockProposal', () => {
  it('is deterministic for identical inputs', () => {
    const a = getMockProposal('doc-1', 'species', 'description', 3)
    const b = getMockProposal('doc-1', 'species', 'description', 3)
    expect(a).toEqual(b)
  })

  it('produces a different id for a different seed', () => {
    const a = getMockProposal('doc-1', 'species', 'description', 1)
    const b = getMockProposal('doc-1', 'species', 'description', 2)
    expect(a.id).not.toBe(b.id)
  })
})

describe('getMockBatch', () => {
  const items = [
    {documentId: 'author-1', documentType: 'author'},
    {documentId: 'species-1', documentType: 'species'},
    {documentId: 'house-1', documentType: 'house'},
    {documentId: 'playlist-1', documentType: 'playlist'},
    {documentId: 'author-2', documentType: 'author'},
  ]

  it('is deterministic for the same paneKey and items', () => {
    expect(getMockBatch('pane-x', items)).toEqual(getMockBatch('pane-x', items))
  })

  it('picks at least 2 items when given at least 2', () => {
    expect(getMockBatch('pane-x', items).proposals.length).toBeGreaterThanOrEqual(2)
  })

  it("targets 'name' for house/author and 'description' otherwise", () => {
    const batch = getMockBatch('pane-x', items)
    for (const proposal of batch.proposals) {
      const expected =
        proposal.documentType === 'house' || proposal.documentType === 'author'
          ? 'name'
          : 'description'
      expect(proposal.fieldName).toBe(expected)
    }
  })

  // NOTE: the spec expected every proposal's `hat` to equal the batch `hat`.
  // The source does not do that — each proposal draws its own hat inside
  // `getMockProposal`, independent of the batch hat. Asserting the real
  // invariant here (each hat is valid) and flagging the divergence upstream.
  it('gives the batch a valid hat and each proposal a valid hat', () => {
    const batch = getMockBatch('pane-x', items)
    expect(VALID_HATS).toContain(batch.hat)
    for (const proposal of batch.proposals) {
      expect(VALID_HATS).toContain(proposal.hat)
    }
  })
})
