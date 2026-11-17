import {defineField} from '@sanity/types'
import {act, render, screen, waitFor, within} from '@testing-library/react'
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

const legalReviewField = defineField({
  name: 'legalReview',
  title: 'Legal review',
  type: 'string',
  initialValue: 'notReviewed',
  options: {
    list: [
      {title: 'Not reviewed', value: 'notReviewed'},
      {title: 'Reviewed', value: 'reviewed'},
    ],
  },
})

describe('CopyToNewReleaseDialog metadata fields', () => {
  beforeEach(() => {
    localStorage.clear()
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

  it('seeds an initial value once without looping', async () => {
    const wrapper = await createTestProvider({
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        beta: {variants: {enabled: true}},
        releases: {metadata: {fields: [legalReviewField]}},
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

    const select = within(await screen.findByTestId('field-legalReview')).getByRole('combobox')
    await waitFor(() => expect(select).toHaveValue('0'))
    await waitFor(() => expect(screen.getByTestId('confirm-button')).toBeEnabled())
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(select).toHaveValue('0')
    expect(screen.getByTestId('confirm-button')).toBeEnabled()
    const stored = localStorage.getItem('studio.release-form.recovery')
    expect(stored).toContain('notReviewed')
  })

  it('keeps a recovered metadata value without looping', async () => {
    localStorage.setItem(
      'studio.release-form.recovery',
      JSON.stringify({
        title: 'Kept title',
        fields: {legalReview: 'reviewed'},
      }),
    )
    const wrapper = await createTestProvider({
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        beta: {variants: {enabled: true}},
        releases: {metadata: {fields: [legalReviewField]}},
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

    await waitFor(() => {
      expect(screen.getByTestId('release-form-title')).toHaveValue('Kept title')
    })
    const select = within(await screen.findByTestId('field-legalReview')).getByRole('combobox')
    await waitFor(() => expect(select).toHaveValue('1'))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(screen.getByTestId('release-form-title')).toHaveValue('Kept title')
    expect(select).toHaveValue('1')
  })
})
