import {describe, expect, it} from 'vitest'

import {type ReleaseId} from '../perspective/types'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {resolveStackedVersionScopeId} from './resolveStackedVersionScopeId'

function createStub(bundleId: string, isDeleted = false): VersionInfoDocumentStub {
  return {
    _id: `versions.${bundleId}.article-1`,
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    _type: 'article',
    _system: {bundleId, ...(isDeleted ? {delete: true} : {})},
  } as VersionInfoDocumentStub
}

const selectedRelease = 'rSelected' as ReleaseId
const perspectiveStack = [selectedRelease, 'rIntermediate', 'rAsap', 'drafts', 'published']

describe('resolveStackedVersionScopeId', () => {
  it('resolves the first release below the selected one when the selected release has no version', () => {
    expect(
      resolveStackedVersionScopeId({
        releaseId: selectedRelease,
        hasSelectedReleaseVersion: false,
        perspectiveStack,
        documentVersionStubs: [createStub('rAsap'), createStub('rIntermediate')],
      }),
    ).toBe('rIntermediate')
  })

  it('resolves nothing when the selected release has its own version', () => {
    expect(
      resolveStackedVersionScopeId({
        releaseId: selectedRelease,
        hasSelectedReleaseVersion: true,
        perspectiveStack,
        documentVersionStubs: [createStub('rIntermediate')],
      }),
    ).toBeUndefined()
  })

  it('resolves nothing when drafts or published come before any version', () => {
    expect(
      resolveStackedVersionScopeId({
        releaseId: selectedRelease,
        hasSelectedReleaseVersion: false,
        perspectiveStack: [selectedRelease, 'drafts', 'rAsap', 'published'],
        documentVersionStubs: [createStub('rAsap')],
      }),
    ).toBeUndefined()
  })

  it('resolves nothing when the first stop is going to unpublish', () => {
    expect(
      resolveStackedVersionScopeId({
        releaseId: selectedRelease,
        hasSelectedReleaseVersion: false,
        perspectiveStack,
        documentVersionStubs: [createStub('rIntermediate', true), createStub('rAsap')],
      }),
    ).toBeUndefined()
  })
})
