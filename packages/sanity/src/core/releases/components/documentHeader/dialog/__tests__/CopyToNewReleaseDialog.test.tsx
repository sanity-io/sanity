import {defineField} from '@sanity/types'
import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {useReleaseOperationsMockReturn} from '../../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {CopyToNewReleaseDialog} from '../CopyToNewReleaseDialog'

vi.mock('../../../../../preview/components/Preview', () => ({
  Preview: () => null,
}))

vi.mock('../../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../../hooks/useGuardWithReleaseLimitUpsell', () => ({
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

describe('CopyToNewReleaseDialog metadata fields', () => {
  beforeEach(() => {
    useReleaseOperationsMockReturn.createRelease.mockClear()
  })

  it('blocks confirm until required metadata is valid when variants are on', async () => {
    const wrapper = await createTestProvider({
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        beta: {variants: {enabled: true}},
        releases: {metadata: {fields: [reviewNote]}},
      },
    })
    render(
      <CopyToNewReleaseDialog
        documentType="author"
        onClose={vi.fn()}
        onCreateVersion={vi.fn()}
        release="r1"
        title="Spring"
        versionId="drafts.author-1"
      />,
      {wrapper},
    )

    const confirm = await screen.findByTestId('confirm-button')
    await waitFor(() => expect(confirm).toBeDisabled())
    expect(useReleaseOperationsMockReturn.createRelease).not.toHaveBeenCalled()

    const field = await screen.findByTestId('field-reviewNote')
    await userEvent.type(within(field).getByRole('textbox'), 'Cleared')
    await waitFor(() => expect(confirm).toBeEnabled())

    await userEvent.click(confirm)
    await waitFor(() => {
      expect(useReleaseOperationsMockReturn.createRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({reviewNote: 'Cleared'}),
        }),
      )
    })
  })
})
