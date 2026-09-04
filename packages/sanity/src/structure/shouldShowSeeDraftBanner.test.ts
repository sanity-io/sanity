import {type VersionInfoDocumentStub} from 'sanity'
import {expect, it} from 'vitest'

import {
  type ShouldShowSeeDraftBannerContext,
  shouldShowSeeDraftBanner,
} from './shouldShowSeeDraftBanner'

const publishedSibling: VersionInfoDocumentStub = {
  _id: 'author-1',
  _rev: 'rev-1',
  _createdAt: '2025-06-23T00:00:00Z',
  _updatedAt: '2025-06-23T00:00:00Z',
  _type: 'author',
  _system: {
    bundleId: 'published',
    group: {_ref: 'author-1', _weak: true},
  },
}

const workspaceWithDraftsEnabled: ShouldShowSeeDraftBannerContext['workspace'] = {
  document: {
    drafts: {
      enabled: true,
    },
  },
}

const workspaceWithDraftsDisabled: ShouldShowSeeDraftBannerContext['workspace'] = {
  document: {
    drafts: {
      enabled: false,
    },
  },
}

const publishedSiblings: ShouldShowSeeDraftBannerContext['siblings'] = {
  published: publishedSibling,
}

const publishedAndDraftSiblings = {
  published: publishedSibling,
  draft: {
    ...publishedSibling,
    _id: 'drafts.author-1',
    _system: {
      bundleId: 'drafts',
      group: {_ref: 'author-1', _weak: true},
    },
  } satisfies VersionInfoDocumentStub,
}

it('shows the banner when a published sibling exists in the published perspective', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      siblings: publishedSiblings,
    }),
  ).toBe(true)
})

it('shows the banner when a draft already exists if a published sibling is present', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      siblings: publishedAndDraftSiblings,
    }),
  ).toBe(true)
})

it('does not show the banner for live-edit documents', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: true},
      workspace: workspaceWithDraftsEnabled,
      siblings: publishedSiblings,
    }),
  ).toBe(false)
})

it('does not show the banner when there is no published sibling', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      siblings: {published: undefined},
    }),
  ).toBe(false)
})

it('does not show the banner while siblings are unresolved', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      siblings: undefined,
    }),
  ).toBe(false)
})

it('does not show the banner outside the published perspective', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'drafts',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      siblings: publishedSiblings,
    }),
  ).toBe(false)
})

it('does not show the banner when drafts are disabled', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsDisabled,
      siblings: publishedSiblings,
    }),
  ).toBe(false)
})

it('does not show the banner when viewing a history revision', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      siblings: publishedSiblings,
      isHistoryRevision: true,
    }),
  ).toBe(false)
})

it('does not show the banner when schema type is missing', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      workspace: workspaceWithDraftsEnabled,
      siblings: publishedSiblings,
    }),
  ).toBe(false)
})
