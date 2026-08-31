import {type SanityDocument} from '@sanity/types'
import {expect, it} from 'vitest'

import {
  type ShouldShowSeeDraftBannerContext,
  shouldShowSeeDraftBanner,
} from './shouldShowSeeDraftBanner'

const stubDocument: SanityDocument = {
  _id: 'author-1',
  _rev: 'rev-1',
  _type: 'author',
  _createdAt: '2025-06-23',
  _updatedAt: '2025-06-23',
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

const publishedOnlyEditState: ShouldShowSeeDraftBannerContext['editState'] = {
  ready: true,
  draft: null,
  published: stubDocument,
}

it('shows the banner for a published-only non-live-edit document in the published perspective', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      editState: publishedOnlyEditState,
    }),
  ).toBe(true)
})

it('does not show the banner for live-edit documents', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: true},
      workspace: workspaceWithDraftsEnabled,
      editState: publishedOnlyEditState,
    }),
  ).toBe(false)
})

it('does not show the banner when a draft already exists', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      editState: {
        ready: true,
        draft: stubDocument,
        published: stubDocument,
      },
    }),
  ).toBe(false)
})

it('does not show the banner when there is no published document', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      editState: {
        ready: true,
        draft: null,
        published: null,
      },
    }),
  ).toBe(false)
})

it('does not show the banner outside the published perspective', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'drafts',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      editState: publishedOnlyEditState,
    }),
  ).toBe(false)
})

it('does not show the banner when drafts are disabled', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsDisabled,
      editState: publishedOnlyEditState,
    }),
  ).toBe(false)
})

it('does not show the banner while edit state is not ready', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      editState: {
        ready: false,
        draft: null,
        published: stubDocument,
      },
    }),
  ).toBe(false)
})

it('does not show the banner when viewing a history revision', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      schemaType: {liveEdit: false},
      workspace: workspaceWithDraftsEnabled,
      editState: publishedOnlyEditState,
      isHistoryRevision: true,
    }),
  ).toBe(false)
})

it('does not show the banner when schema type is missing', () => {
  expect(
    shouldShowSeeDraftBanner({
      selectedPerspective: 'published',
      workspace: workspaceWithDraftsEnabled,
      editState: publishedOnlyEditState,
    }),
  ).toBe(false)
})
