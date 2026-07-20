import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type EditableSystemVariant} from '../../../types'
import {getVariantDefaults} from '../../../util/variantDefaults'
import {VariantDialog} from '../VariantDialog'

const toastMock = vi.hoisted(() => ({
  push: vi.fn(),
}))

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => toastMock),
}))

describe('VariantDialog', () => {
  const onCancel = vi.fn()
  const onSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    onSubmit.mockResolvedValue(undefined)
  })

  const renderDialog = async (props?: {
    initialValue?: EditableSystemVariant
    renderCancelButton?: boolean
  }) => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const result = render(
      <VariantDialog
        confirmDataTestId="save-variant-button"
        confirmText="Save"
        errorTitle="Unable to update variant definition"
        header="Edit variant definition"
        id="edit-variant-dialog"
        initialValue={props?.initialValue ?? getVariantDefaults()}
        onCancel={onCancel}
        onSubmit={onSubmit}
        renderCancelButton={props?.renderCancelButton}
      />,
      {wrapper},
    )
    await screen.findByRole('dialog', {name: 'Edit variant definition'})
    return result
  }

  it('renders a cancel button when renderCancelButton is enabled', async () => {
    await renderDialog({renderCancelButton: true})

    expect(screen.getByRole('button', {name: 'Cancel'})).toBeInTheDocument()
  })

  it('does not render a cancel button in create mode', async () => {
    await renderDialog({renderCancelButton: false})

    expect(screen.queryByRole('button', {name: 'Cancel'})).not.toBeInTheDocument()
  })

  it('calls onCancel when cancel is pressed', async () => {
    const user = userEvent.setup()

    await renderDialog({renderCancelButton: true})

    await user.click(screen.getByRole('button', {name: 'Cancel'}))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onCancel when the dialog close button is pressed', async () => {
    const user = userEvent.setup()

    await renderDialog({renderCancelButton: true})

    await user.click(screen.getByLabelText('Close dialog'))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('allows submit while the form is invalid and shows validation on click', async () => {
    const user = userEvent.setup()

    await renderDialog()

    expect(screen.getByTestId('save-variant-button')).toBeEnabled()

    await user.click(screen.getByTestId('save-variant-button'))

    expect(screen.getByTestId('variant-form-title-error')).toHaveTextContent('Title is required')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows priority validation when editing an invalid value', async () => {
    const user = userEvent.setup()

    await renderDialog({
      initialValue: {
        ...getVariantDefaults(),
        metadata: {title: 'Alpha audience', description: []},
        conditions: {audience: 'alpha'},
        priority: 10,
      },
      renderCancelButton: true,
    })

    await user.clear(screen.getByTestId('variant-form-priority'))
    await user.type(screen.getByTestId('variant-form-priority'), '-5')
    await user.click(screen.getByTestId('save-variant-button'))

    expect(screen.getByTestId('variant-form-priority-error')).toHaveTextContent(
      'Priority must be between 0 and 100',
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows an error toast and keeps the dialog open when submit fails', async () => {
    const error = new Error('update failed')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    onSubmit.mockRejectedValue(error)
    const user = userEvent.setup()

    await renderDialog({
      initialValue: {
        ...getVariantDefaults(),
        metadata: {title: 'Alpha audience', description: []},
        conditions: {audience: 'alpha'},
      },
      renderCancelButton: true,
    })

    await user.click(screen.getByTestId('save-variant-button'))

    await waitFor(() => {
      expect(toastMock.push).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Unable to update variant definition',
        }),
      )
    })
    expect(consoleError).toHaveBeenCalledWith(error)
    expect(screen.getByRole('dialog', {name: 'Edit variant definition'})).toBeInTheDocument()
    expect(onCancel).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
