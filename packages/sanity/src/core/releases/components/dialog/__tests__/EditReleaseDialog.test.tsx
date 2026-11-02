import {type ReleaseDocument} from '@sanity/client'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useReleaseOperationsMockReturn} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  mockUseReleasePermissions,
  useReleasesPermissionsMockReturnTrue,
} from '../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {EditReleaseDialog} from '../EditReleaseDialog'

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasesPermissionsMockReturnTrue),
}))

const portableTextDescription = [
  {
    _key: 'block1',
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [
      {_key: 'span1', _type: 'span', marks: [], text: 'Ships with '},
      {_key: 'ref1', _type: 'releaseReference', releaseId: 'rOther'},
      {_key: 'span2', _type: 'span', marks: [], text: ' tomorrow'},
    ],
  },
]

// Release metadata is untyped JSON on a system document, so any shape can arrive from the store.
function releaseFromContentLake(description: unknown): ReleaseDocument {
  return JSON.parse(
    JSON.stringify({
      _id: '_.releases.spring',
      _type: 'system.release',
      _createdAt: '2024-07-02T11:37:51Z',
      _updatedAt: '2024-07-12T10:39:32Z',
      _rev: 'rev',
      name: 'spring',
      createdBy: 'unknown',
      state: 'active',
      metadata: {title: 'Spring', description, releaseType: 'asap'},
    }),
  )
}

async function renderEditDialog(release: ReleaseDocument) {
  const wrapper = await createTestProvider({
    config: {beta: {variants: {enabled: true}}},
  })
  render(<EditReleaseDialog release={release} onClose={vi.fn()} />, {wrapper})
  await flushMicrotasksThisIsACodeSmell()
}

describe('EditReleaseDialog with a description that is not a string', () => {
  beforeEach(() => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    useReleaseOperationsMockReturn.updateRelease.mockClear()
  })

  it('shows the plain text of a Portable Text description', async () => {
    await renderEditDialog(releaseFromContentLake(portableTextDescription))

    expect(screen.getByTestId('release-form-description')).toHaveValue('Ships with  tomorrow')
  })

  it('keeps a Portable Text description untouched when only the title is saved', async () => {
    await renderEditDialog(releaseFromContentLake(portableTextDescription))

    await userEvent.type(screen.getByTestId('release-form-title'), ' drop')
    await userEvent.click(screen.getByTestId('save-release-details-button'))

    await waitFor(() => {
      expect(useReleaseOperationsMockReturn.updateRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            title: 'Spring drop',
            description: portableTextDescription,
          }),
        }),
      )
    })
  })

  it('saves the edited plain text when a Portable Text description is edited', async () => {
    await renderEditDialog(releaseFromContentLake(portableTextDescription))

    await userEvent.type(screen.getByTestId('release-form-description'), '!')
    await userEvent.click(screen.getByTestId('save-release-details-button'))

    await waitFor(() => {
      expect(useReleaseOperationsMockReturn.updateRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({description: 'Ships with  tomorrow!'}),
        }),
      )
    })
  })
})
