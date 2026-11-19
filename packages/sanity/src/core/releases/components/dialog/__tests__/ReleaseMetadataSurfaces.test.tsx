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

  it('renders the configured fields without the core metadata fields', async () => {
    await renderDialog(<CreateReleaseDialog onCancel={vi.fn()} onSubmit={vi.fn()} />)

    expect(await screen.findByTestId('field-reviewNote')).toBeInTheDocument()
    expect(screen.queryByTestId('field-releaseType')).toBeNull()
    expect(screen.queryByTestId('field-intendedPublishAt')).toBeNull()
  })

  it('keeps the configured fieldsets, groups and object-level validation', async () => {
    const wrapper = await createTestProvider({
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        beta: {variants: {enabled: true}},
        releases: {
          metadata: {
            fieldsets: [{name: 'review', title: 'Review'}],
            groups: [
              {name: 'legal', title: 'Legal'},
              {name: 'other', title: 'Other'},
            ],
            fields: [
              defineField({
                name: 'legalNote',
                title: 'Legal note',
                type: 'string',
                fieldset: 'review',
                group: 'legal',
              }),
              defineField({
                name: 'signedOff',
                title: 'Signed off',
                type: 'boolean',
                group: 'other',
              }),
            ],
            validation: (rule) =>
              rule.custom((value: {legalNote?: string} | undefined) =>
                value?.legalNote ? true : 'Add a legal note',
              ),
          },
        },
      },
    })
    render(<CreateReleaseDialog onCancel={vi.fn()} onSubmit={vi.fn()} />, {wrapper})

    const fieldset = await screen.findByTestId('fieldset-review')
    const legalNote = within(fieldset).getByTestId('field-legalNote')
    expect(screen.getByTestId('group-tab-legal')).toBeInTheDocument()
    expect(screen.getByTestId('group-tab-other')).toBeInTheDocument()

    const submit = screen.getByTestId('submit-release-button')
    await waitFor(() => expect(submit).toBeDisabled())
    await userEvent.type(within(legalNote).getByRole('textbox'), 'Cleared')
    await waitFor(() => expect(submit).toBeEnabled())
  })

  it('applies the validation of a plugin and of the root config', async () => {
    const wrapper = await createTestProvider({
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        beta: {variants: {enabled: true}},
        plugins: [
          {
            name: 'legal-plugin',
            releases: {
              metadata: {
                fields: [defineField({name: 'legalNote', title: 'Legal note', type: 'string'})],
                validation: (rule) =>
                  rule.custom((value: {legalNote?: string} | undefined) =>
                    value?.legalNote ? true : 'Add a legal note',
                  ),
              },
            },
          },
        ],
        releases: {
          metadata: {
            fields: [defineField({name: 'owner', title: 'Owner', type: 'string'})],
            validation: (rule) =>
              rule.custom((value: {owner?: string} | undefined) =>
                value?.owner ? true : 'Add an owner',
              ),
          },
        },
      },
    })
    render(<CreateReleaseDialog onCancel={vi.fn()} onSubmit={vi.fn()} />, {wrapper})

    const legalNote = await screen.findByTestId('field-legalNote')
    const owner = screen.getByTestId('field-owner')
    const submit = screen.getByTestId('submit-release-button')
    await waitFor(() => expect(submit).toBeDisabled())

    await userEvent.type(within(legalNote).getByRole('textbox'), 'Cleared')
    await flushMicrotasksThisIsACodeSmell()
    expect(submit).toBeDisabled()

    await userEvent.type(within(owner).getByRole('textbox'), 'Legal')
    await waitFor(() => expect(submit).toBeEnabled())
  })

  it('drops a configured field whose type the release dialog cannot edit', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = await createTestProvider({
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        beta: {variants: {enabled: true}},
        releases: {
          metadata: {
            fields: [
              defineField({name: 'legalNote', title: 'Legal note', type: 'string'}),
              defineField({name: 'cover', title: 'Cover', type: 'image'}),
            ],
          },
        },
      },
    })
    render(<CreateReleaseDialog onCancel={vi.fn()} onSubmit={vi.fn()} />, {wrapper})

    expect(await screen.findByTestId('field-legalNote')).toBeInTheDocument()
    expect(screen.queryByTestId('field-cover')).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Dropped field "cover"'))
    warn.mockRestore()
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
