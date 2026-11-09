import {describe, expect, it} from 'vitest'

import {planPrDatasetCleanup, type PrDataset} from './prDatasetCleanup'

function dataset(name: string, addonFor: string | null = null): PrDataset {
  return {addonFor, createdAt: '2026-10-01T00:00:00.000Z', name}
}

describe('planPrDatasetCleanup', () => {
  it('keeps both browsers from the highest run id and does not delete comments addons', () => {
    const plans = planPrDatasetCleanup(
      [
        dataset('pr-14566-chromium-10'),
        dataset('pr-14566-firefox-10'),
        dataset('pr-14566-chromium-10-comments', 'pr-14566-chromium-10'),
        dataset('pr-14566-chromium-30'),
        dataset('pr-14566-firefox-30'),
        dataset('pr-14566-chromium-30-comments', 'pr-14566-chromium-30'),
        dataset('main-chromium-99'),
      ],
      new Set([14566]),
    )

    expect(plans).toHaveLength(1)
    expect(plans[0]).toMatchObject({open: true, prNumber: 14566, latestRunId: 30})
    expect(plans[0].keep.map((entry) => entry.name).toSorted()).toEqual([
      'pr-14566-chromium-30',
      'pr-14566-firefox-30',
    ])
    expect(plans[0].delete.map((entry) => entry.name).toSorted()).toEqual([
      'pr-14566-chromium-10',
      'pr-14566-firefox-10',
    ])
  })

  it('compares run ids numerically, so run 10 is newer than run 9', () => {
    const plans = planPrDatasetCleanup(
      [dataset('pr-5-chromium-9'), dataset('pr-5-firefox-10'), dataset('pr-5-chromium-10')],
      new Set([5]),
    )

    expect(plans[0].latestRunId).toBe(10)
    expect(plans[0].keep.map((entry) => entry.name).toSorted()).toEqual([
      'pr-5-chromium-10',
      'pr-5-firefox-10',
    ])
    expect(plans[0].delete.map((entry) => entry.name)).toEqual(['pr-5-chromium-9'])
  })

  it('keeps a latest run that has only created one browser so far', () => {
    const plans = planPrDatasetCleanup(
      [dataset('pr-7-chromium-2'), dataset('pr-7-firefox-2'), dataset('pr-7-chromium-3')],
      new Set([7]),
    )

    expect(plans[0].keep.map((entry) => entry.name)).toEqual(['pr-7-chromium-3'])
    expect(plans[0].delete.map((entry) => entry.name).toSorted()).toEqual([
      'pr-7-chromium-2',
      'pr-7-firefox-2',
    ])
  })

  it('deletes the parent datasets when the pull request is closed and leaves comments addons alone', () => {
    const plans = planPrDatasetCleanup(
      [
        dataset('pr-8-chromium-4'),
        dataset('pr-8-chromium-4-comments', 'pr-8-chromium-4'),
        dataset('pr-9-firefox-1'),
      ],
      new Set([9]),
    )

    const closed = plans.find((plan) => plan.prNumber === 8)
    const open = plans.find((plan) => plan.prNumber === 9)
    expect(closed).toMatchObject({open: false, latestRunId: undefined, keep: []})
    expect(closed?.delete.map((entry) => entry.name)).toEqual(['pr-8-chromium-4'])
    expect(open).toMatchObject({open: true, latestRunId: 1, delete: []})
  })
})
