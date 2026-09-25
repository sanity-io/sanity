import {describe, expect, it} from 'vitest'

import {getPublishActionLabel} from './getPublishActionLabel'

const LABELS = {
  'action.publish.draft.label': 'Publish',
  'action.publish.published.label': 'Published',
  'action.publish.running.label': 'Publishing…',
  'action.publish.validation-in-progress.label': 'Validating document…',
  'action.publish.variant.label': 'Publish variant',
} as const

function t(key: string) {
  return LABELS[key as keyof typeof LABELS]
}

describe('getPublishActionLabel', () => {
  it('uses Publish for a base draft', () => {
    expect(
      getPublishActionLabel(t, {
        isVariant: false,
        publishScheduled: false,
        publishState: null,
      }),
    ).toBe('Publish')
  })

  it('uses Publish variant when publishing a content variant', () => {
    expect(
      getPublishActionLabel(t, {
        isVariant: true,
        publishScheduled: false,
        publishState: null,
      }),
    ).toBe('Publish variant')
  })

  it('keeps in-progress labels regardless of variant', () => {
    expect(
      getPublishActionLabel(t, {
        isVariant: true,
        publishScheduled: true,
        publishState: null,
      }),
    ).toBe('Validating document…')

    expect(
      getPublishActionLabel(t, {
        isVariant: true,
        publishScheduled: false,
        publishState: {status: 'publishing', publishRevision: 'rev-1'},
      }),
    ).toBe('Publishing…')

    expect(
      getPublishActionLabel(t, {
        isVariant: true,
        publishScheduled: false,
        publishState: {status: 'published'},
      }),
    ).toBe('Published')
  })
})
