import {type ReleaseDocument} from '@sanity/client'
import {defineField} from '@sanity/types'
import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactElement} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {useReleaseOperationsMockReturn} from '../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  mockUseReleasePermissions,
  useReleasesPermissionsMockReturnTrue,
} from '../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {CreateReleaseDialog} from '../CreateReleaseDialog'
import {EditReleaseDialog} from '../EditReleaseDialog'

vi.mock('../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasesPermissionsMockReturnTrue),
}))

vi.mock('../../../hooks/useGuardWithReleaseLimitUpsell', () => ({
  useGuardWithReleaseLimitUpsell: vi.fn(() => ({
    releasePromise: Promise.resolve(true),
  })),
}))

const reviewNote = defineField({
  name: 'reviewNote',
  title: 'Review note',
  type: 'string',
  validation: (rule) => rule.required(),
})

const fields = [reviewNote]

function releaseWithUnknownKey(): ReleaseDocument {
  return {
    _id: '_.releases.spring',
    _type: 'system.release',
    _createdAt: '2024-07-02T11:37:51Z',
    _updatedAt: '2024-07-12T10:39:32Z',
    _rev: 'rev',
    name: 'spring',
    createdBy: 'unknown',
    state: 'active',
    metadata: {
      title: 'Spring',
      description: 'A drop',
      releaseType: 'asap',
      reviewer: {team: 'legal'},
    },
  } as ReleaseDocument
}

async function renderDialog(ui: ReactElement) {
  const wrapper = await createTestProvider({
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      releases: {metadata: {fields}},
    },
  })
  return render(ui, {wrapper})
}

describe('release metadata on create and edit', () => {
  beforeEach(() => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    useReleaseOperationsMockReturn.createRelease.mockClear()
    useReleaseOperationsMockReturn.updateRelease.mockClear()
  })

  it('keeps the create action disabled until metadata validation passes', async () => {
    await renderDialog(<CreateReleaseDialog onCancel={vi.fn()} onSubmit={vi.fn()} />)

    const submit = await screen.findByTestId('submit-release-button')
    await waitFor(() => {
      expect(submit).toBeDisabled()
    })

    const field = await screen.findByTestId('field-reviewNote')
    await userEvent.type(within(field).getByRole('textbox'), 'Cleared')

    await waitFor(() => {
      expect(submit).toBeEnabled()
    })

    await userEvent.click(submit)

    await waitFor(() => {
      expect(useReleaseOperationsMockReturn.createRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({reviewNote: 'Cleared'}),
        }),
      )
    })
  })

  it('saves the whole metadata object from the edit dialog once validation passes', async () => {
    const release = releaseWithUnknownKey()
    await renderDialog(<EditReleaseDialog release={release} onClose={vi.fn()} />)

    const save = await screen.findByTestId('save-release-details-button')
    await waitFor(() => {
      expect(save).toBeDisabled()
    })
    expect(useReleaseOperationsMockReturn.updateRelease).not.toHaveBeenCalled()

    const field = await screen.findByTestId('field-reviewNote')
    await userEvent.type(within(field).getByRole('textbox'), 'Cleared')

    await waitFor(() => {
      expect(save).toBeEnabled()
    })
    await userEvent.click(save)

    await waitFor(() => {
      expect(useReleaseOperationsMockReturn.updateRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            title: 'Spring',
            reviewNote: 'Cleared',
            reviewer: {team: 'legal'},
          }),
        }),
      )
    })
  })
})
