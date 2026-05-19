import {cleanup, render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {CreateVariantDialog} from '../CreateVariantDialog'

const variantOperationsMock = vi.hoisted(() => ({
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  deleteVariant: vi.fn(),
}))

vi.mock('../../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))

describe('CreateVariantDialog', () => {
  const onCancel = vi.fn()
  const onSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.createVariant.mockResolvedValue(undefined)
  })

  afterEach(() => {
    cleanup()
  })

  const renderDialog = async () => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const result = render(<CreateVariantDialog onCancel={onCancel} onSubmit={onSubmit} />, {
      wrapper,
    })
    await flushMicrotasksThisIsACodeSmell()
    return result
  }

  it('disables add condition until the last row is complete', async () => {
    const user = userEvent.setup()

    await renderDialog()

    expect(screen.getByRole('button', {name: 'Add condition'})).toBeDisabled()

    await user.type(screen.getByRole('textbox', {name: 'Key'}), 'audience')
    expect(screen.getByRole('button', {name: 'Add condition'})).toBeDisabled()

    await user.type(screen.getByRole('textbox', {name: 'Value'}), 'loyal-customers')

    await waitFor(() => {
      expect(screen.getByRole('textbox', {name: 'Value'})).toHaveValue('loyal-customers')
      expect(screen.getByRole('button', {name: 'Add condition'})).toBeEnabled()
    })

    await user.click(screen.getByRole('button', {name: 'Add condition'}))

    expect(screen.getAllByTestId('variant-form-condition-key')).toHaveLength(2)
    expect(screen.getByRole('button', {name: 'Add condition'})).toBeDisabled()
  })

  it('requires a title and complete condition before submit', async () => {
    const user = userEvent.setup()

    await renderDialog()

    expect(screen.getByTestId('submit-variant-button')).toBeDisabled()

    await user.type(screen.getByTestId('variant-form-condition-key'), 'audience')
    await user.type(screen.getByTestId('variant-form-condition-value'), 'loyal-customers')
    expect(screen.getByTestId('submit-variant-button')).toBeDisabled()

    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await waitFor(() => {
      expect(screen.getByTestId('submit-variant-button')).toBeEnabled()
    })
  })

  it('shows an error on repeated condition keys', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await user.type(screen.getByRole('textbox', {name: 'Key'}), 'audience')
    await user.type(screen.getByRole('textbox', {name: 'Value'}), 'us')

    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'Add condition'})).toBeEnabled()
    })

    await user.click(screen.getByRole('button', {name: 'Add condition'}))

    const conditionKeys = screen.getAllByTestId('variant-form-condition-key')
    const conditionValues = screen.getAllByTestId('variant-form-condition-value')

    await user.type(conditionKeys[1]!, 'audience')
    await user.type(conditionValues[1]!, 'fr')

    expect(screen.getByTestId('variant-form-condition-key-error')).toHaveTextContent(
      'Condition keys must be unique',
    )
    expect(screen.getByTestId('submit-variant-button')).toBeDisabled()

    await user.type(conditionKeys[1]!, '2')

    await waitFor(() => {
      expect(screen.queryByTestId('variant-form-condition-key-error')).not.toBeInTheDocument()
      expect(screen.getByTestId('submit-variant-button')).toBeEnabled()
    })
  })

  it('shows a title validation message after the field is touched', async () => {
    const user = userEvent.setup()

    await renderDialog()

    const titleInput = screen.getByTestId('variant-form-title')

    await user.click(titleInput)
    await user.tab()

    expect(screen.getByTestId('variant-form-title-error')).toHaveTextContent('Title is required')
  })

  it('creates a variant and calls submit with the generated id', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await user.type(screen.getByTestId('variant-form-condition-key'), 'audience')
    await user.type(screen.getByTestId('variant-form-condition-value'), 'loyal-customers')
    await user.click(screen.getByTestId('submit-variant-button'))

    await waitFor(() => {
      expect(variantOperationsMock.createVariant).toHaveBeenCalledTimes(1)
    })

    const createdVariant = variantOperationsMock.createVariant.mock.calls[0]![0]

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(createdVariant._id)
  })

  it('keeps the dialog open when creation fails', async () => {
    const error = new Error('create failed')
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    variantOperationsMock.createVariant.mockRejectedValue(error)

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await user.type(screen.getByTestId('variant-form-condition-key'), 'audience')
    await user.type(screen.getByTestId('variant-form-condition-value'), 'loyal-customers')
    await user.click(screen.getByTestId('submit-variant-button'))

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(error)
    })

    expect(onCancel).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', {name: 'Create variant'})).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
