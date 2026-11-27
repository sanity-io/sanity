import {type ReleaseDocument} from '@sanity/client'
import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type PublishDocumentVersionEvent} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {PublishedEventMenu} from '../PublishedEventMenu'

const release: ReleaseDocument = {
  _id: '_.releases.rLaunch',
  _type: 'system.release',
  _rev: 'rev-1',
  _createdAt: '2026-11-01T08:00:00Z',
  _updatedAt: '2026-11-01T09:00:00Z',
  name: 'rLaunch',
  state: 'published',
  metadata: {title: 'Launch', releaseType: 'asap'},
}

const releasePublishEvent: PublishDocumentVersionEvent = {
  id: 'event-1',
  type: 'publishDocumentVersion',
  timestamp: '2026-11-01T10:00:00Z',
  author: 'user-1',
  documentVariantType: 'published',
  documentId: 'doc-1',
  revisionId: 'rev-2',
  versionId: 'versions.rLaunch.doc-1',
  releaseId: 'rLaunch',
  publishCause: 'release.publish',
}

const telemetryMock = vi.hoisted(() => ({
  log: vi.fn(),
}))

vi.mock('@sanity/telemetry/react', () => ({
  useTelemetry: vi.fn(() => telemetryMock),
}))

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useAllReleases: vi.fn(() => ({
    data: [release],
    error: undefined,
    loading: false,
    map: new Map([[release._id, release]]),
  })),
  useSetPerspective: vi.fn(() => vi.fn()),
}))

vi.mock('../../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(() => ({params: {}, setParams: vi.fn()})),
}))

describe('PublishedEventMenu', () => {
  it('reports following the link to the release a version was published with', async () => {
    const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- the locale bundle suspends the first render
    await act(async () => {
      render(<PublishedEventMenu event={releasePublishEvent} />, {wrapper})
    })

    await userEvent.click(await screen.findByRole('button', {name: 'Open action menu'}))
    // jsdom lays nothing out, so the open popover counts as inaccessible to role queries
    const releaseLink = screen.getByRole('link', {name: 'Open Launch release', hidden: true})
    expect(releaseLink).toHaveAttribute('href', '/intent/release/id=rLaunch/')

    await userEvent.click(releaseLink)

    expect(telemetryMock.log).toHaveBeenCalledWith(
      expect.objectContaining({name: 'Release Detail Link Clicked'}),
      {location: 'document_history'},
    )
  })
})
