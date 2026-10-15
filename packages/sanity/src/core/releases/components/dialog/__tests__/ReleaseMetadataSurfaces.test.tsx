import {type ReleaseDocument} from '@sanity/client'
import {defineField} from '@sanity/types'
import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactElement} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
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

async function renderDialog(ui: ReactElement, variantsEnabled = true) {
  const wrapper = await createTestProvider({
    config: {
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      beta: {variants: {enabled: variantsEnabled}},
      releases: {metadata: {fields}},
    },
  })
  const view = render(ui, {wrapper})
  await flushMicrotasksThisIsACodeSmell()
  return view
}

describe('release metadata on create and edit', () => {
  beforeEach(() => {
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    useReleaseOperationsMockReturn.createRelease.mockClear()
    useReleaseOperationsMockReturn.updateRelease.mockClear()
  })

  it('does not show metadata fields on create or edit when variants are off', async () => {
    const {unmount} = await renderDialog(
      <CreateReleaseDialog onCancel={vi.fn()} onSubmit={vi.fn()} />,
      false,
    )

    expect(screen.queryByTestId('field-reviewNote')).toBeNull()
    expect(await screen.findByTestId('submit-release-button')).toBeEnabled()
    unmount()

    await renderDialog(
      <EditReleaseDialog release={releaseWithUnknownKey()} onClose={vi.fn()} />,
      false,
    )
    expect(screen.queryByTestId('field-reviewNote')).toBeNull()
    await waitFor(() => {
      expect(screen.getByTestId('save-release-details-button')).toBeEnabled()
    })
  })

  it('keeps create blocked when the value changes before validation settles', async () => {
    const gates: Array<(result: true | string) => void> = []
    const deferredNote = defineField({
      name: 'reviewNote',
      title: 'Review note',
      type: 'string',
      validation: (rule) =>
        rule.custom(
          () =>
            new Promise((resolve) => {
              gates.push(resolve)
            }),
        ),
    })
    const wrapper = await createTestProvider({
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        beta: {variants: {enabled: true}},
        releases: {metadata: {fields: [deferredNote]}},
      },
    })
    render(<CreateReleaseDialog onCancel={vi.fn()} onSubmit={vi.fn()} />, {wrapper})

    const submit = await screen.findByTestId('submit-release-button')
    const field = await screen.findByTestId('field-reviewNote')
    await userEvent.type(within(field).getByRole('textbox'), 'Cleared')
    await waitFor(() => expect(gates.length).toBeGreaterThan(0))
    gates.at(-1)?.(true)
    await waitFor(() => expect(submit).toBeEnabled())

    const started = gates.length
    await userEvent.clear(within(field).getByRole('textbox'))
    await waitFor(() => expect(gates.length).toBeGreaterThan(started))
    expect(submit).toBeDisabled()

    const form = submit.closest('form')
    if (!form) throw new Error('create release form was not rendered')
    fireEvent.submit(form)
    expect(useReleaseOperationsMockReturn.createRelease).not.toHaveBeenCalled()
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
