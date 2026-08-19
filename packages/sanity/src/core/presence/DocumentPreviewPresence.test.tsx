import {render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {studioDefaultLocaleResources} from '../i18n/bundles/studio'
import {activeASAPRelease} from '../releases/__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../releases/i18n'
import {type DocumentPresence} from '../store/presence/types'
import {DocumentPreviewPresence} from './DocumentPreviewPresence'

vi.mock('../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({
    data: [activeASAPRelease],
    loading: false,
    dispatch: vi.fn(),
  })),
}))

vi.mock('../components/userAvatar/UserAvatar', () => ({
  UserAvatar: () => <span data-testid="user-avatar" />,
}))

const presence = (
  documentId: string,
  displayName = 'Nancy Du',
): Omit<DocumentPresence, 'path'> => ({
  user: {id: 'user-1', displayName},
  sessionId: 'session-1',
  lastActiveAt: '2026-01-01T00:00:00.000Z',
  documentId,
})

const renderPresence = async (documentId: string) => {
  const wrapper = await createTestProvider({
    resources: [studioDefaultLocaleResources, releasesUsEnglishLocaleBundle],
  })

  render(<DocumentPreviewPresence presence={[presence(documentId)]} />, {wrapper})

  await waitFor(() => {
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })
}

describe('DocumentPreviewPresence', () => {
  it('does not claim a published live-edit document is in an Untitled release', async () => {
    await renderPresence('thesis-1')

    expect(screen.getByLabelText('Nancy Du is editing this document right now')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Untitled/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/release right now/)).not.toBeInTheDocument()
  })

  it('does not claim a draft is in an Untitled release', async () => {
    await renderPresence('drafts.thesis-1')

    expect(screen.getByLabelText('Nancy Du is editing this document right now')).toBeInTheDocument()
  })

  it('names the release when presence is on a version document', async () => {
    await renderPresence('versions.rASAP.thesis-1')

    expect(
      screen.getByLabelText(
        'Nancy Du is editing this document in the "active asap Release" release right now',
      ),
    ).toBeInTheDocument()
  })

  it('falls back to Untitled only for a version whose release has no title', async () => {
    await renderPresence('versions.missing.thesis-1')

    expect(
      screen.getByLabelText(
        'Nancy Du is editing this document in the "Untitled" release right now',
      ),
    ).toBeInTheDocument()
  })
})
