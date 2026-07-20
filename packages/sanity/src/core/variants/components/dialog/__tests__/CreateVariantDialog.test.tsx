import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type SystemVariant} from '../../../types'
import {CreateVariantDialog} from '../CreateVariantDialog'

const variantOperationsMock = vi.hoisted(() => ({
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  deleteVariant: vi.fn(),
}))

const toastMock = vi.hoisted(() => ({
  push: vi.fn(),
}))

const variantsMock = vi.hoisted(() => ({
  data: [] as SystemVariant[],
  byId: new Map<string, SystemVariant>(),
  loading: false,
  error: undefined as Error | undefined,
}))

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => toastMock),
}))

vi.mock('../../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))

vi.mock('../../../store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => variantsMock),
}))

describe('CreateVariantDialog', () => {
  const onCancel = vi.fn()
  const onSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    variantsMock.data = [variantAlphaAudience, variantNorwegianMarket]
    variantsMock.byId = new Map(variantsMock.data.map((variant) => [variant._id, variant]))
    variantsMock.loading = false
    variantsMock.error = undefined
    variantOperationsMock.createVariant.mockResolvedValue(undefined)
  })

  const renderDialog = async () => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const result = render(<CreateVariantDialog onCancel={onCancel} onSubmit={onSubmit} />, {
      wrapper,
    })
    await screen.findByRole('dialog', {name: 'Create variant definition'})
    return result
  }

  it('disables add condition until the last row is complete', async () => {
    const user = userEvent.setup()

    await renderDialog()

    expect(screen.getByRole('button', {name: 'Add condition'})).toBeDisabled()

    await user.type(screen.getByRole('combobox', {name: 'Key'}), 'audience')
    expect(screen.getByRole('button', {name: 'Add condition'})).toBeDisabled()

    await user.type(screen.getByRole('combobox', {name: 'Value'}), 'loyal-customers')

    await waitFor(() => {
      expect(screen.getByRole('combobox', {name: 'Value'})).toHaveValue('loyal-customers')
      expect(screen.getByRole('button', {name: 'Add condition'})).toBeEnabled()
    })

    await user.click(screen.getByRole('button', {name: 'Add condition'}))

    expect(screen.getAllByTestId('variant-form-condition-key')).toHaveLength(2)
    expect(screen.getByRole('button', {name: 'Add condition'})).toBeDisabled()
  })

  it('requires a title and complete condition before submit', async () => {
    const user = userEvent.setup()

    await renderDialog()

    expect(screen.getByTestId('submit-variant-button')).toBeEnabled()

    await user.type(screen.getByTestId('variant-form-condition-key'), 'audience')
    expect(screen.queryByTestId('variant-form-condition-value-error')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('submit-variant-button'))

    expect(screen.getByTestId('variant-form-title-error')).toHaveTextContent('Title is required')
    expect(screen.getByTestId('variant-form-condition-value-error')).toHaveTextContent(
      'Condition value is required',
    )
    expect(variantOperationsMock.createVariant).not.toHaveBeenCalled()

    await user.type(screen.getByTestId('variant-form-condition-value'), 'loyal-customers')
    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await user.click(screen.getByTestId('submit-variant-button'))

    await waitFor(() => {
      expect(variantOperationsMock.createVariant).toHaveBeenCalledTimes(1)
    })
  })

  it('shows an error on repeated condition keys', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await user.type(screen.getByRole('combobox', {name: 'Key'}), 'audience')
    await user.type(screen.getByRole('combobox', {name: 'Value'}), 'us')

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
    expect(screen.getByTestId('submit-variant-button')).toBeEnabled()

    await user.click(screen.getByTestId('submit-variant-button'))
    expect(variantOperationsMock.createVariant).not.toHaveBeenCalled()

    await user.type(conditionKeys[1]!, '2')

    await waitFor(() => {
      expect(screen.queryByTestId('variant-form-condition-key-error')).not.toBeInTheDocument()
    })

    await user.click(screen.getByTestId('submit-variant-button'))

    await waitFor(() => {
      expect(variantOperationsMock.createVariant).toHaveBeenCalledTimes(1)
    })
  })

  it('suggests existing condition keys while typing', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-condition-key'), 'aud')

    expect(await screen.findByText('audience')).toBeInTheDocument()
    expect(screen.queryByText('locale')).not.toBeInTheDocument()
  })

  it('suggests condition values scoped to the selected key', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-condition-key'), 'loc')
    await user.click(await screen.findByText('locale'))
    await waitFor(() => {
      expect(screen.getByTestId('variant-form-condition-key')).toHaveValue('locale')
    })

    const openButtons = screen.getAllByRole('button', {name: 'Open'})
    await user.click(openButtons[1]!)

    expect(await screen.findByText('nb-NO')).toBeInTheDocument()
    expect(screen.queryByText('alpha')).not.toBeInTheDocument()
  })

  it('shows an error for reserved and invalid condition keys', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await user.type(screen.getByTestId('variant-form-condition-key'), '_system')
    await user.type(screen.getByTestId('variant-form-condition-value'), 'loyal')

    expect(screen.getByTestId('variant-form-condition-key-error')).toHaveTextContent(
      'Condition keys cannot start with _ or $',
    )
    expect(screen.getByTestId('submit-variant-button')).toBeEnabled()

    await user.click(screen.getByTestId('submit-variant-button'))
    expect(variantOperationsMock.createVariant).not.toHaveBeenCalled()

    await user.clear(screen.getByTestId('variant-form-condition-key'))
    await user.type(screen.getByTestId('variant-form-condition-key'), 'Audience')

    expect(screen.getByTestId('variant-form-condition-key-error')).toHaveTextContent(
      'Condition keys must be lowercase, start with a letter, and use letters, numbers, underscores, or hyphens',
    )

    await user.click(screen.getByTestId('submit-variant-button'))
    expect(variantOperationsMock.createVariant).not.toHaveBeenCalled()
  })

  it('shows an error for invalid condition values', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await user.type(screen.getByTestId('variant-form-condition-key'), 'audience')
    await user.type(screen.getByTestId('variant-form-condition-value'), 'loyal:customers')
    await user.click(screen.getByTestId('submit-variant-button'))

    expect(screen.getByTestId('variant-form-condition-value-error')).toHaveTextContent(
      'Condition values cannot contain colons',
    )
    expect(variantOperationsMock.createVariant).not.toHaveBeenCalled()
  })

  it('requires a condition key before submitting a row with a value', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await user.type(screen.getByTestId('variant-form-condition-value'), 'loyal-customers')
    expect(screen.getByTestId('variant-form-condition-key-error')).toBeInTheDocument()

    await user.click(screen.getByTestId('submit-variant-button'))

    expect(screen.getByTestId('variant-form-condition-key-error')).toHaveTextContent(
      'Condition key is required',
    )
    expect(variantOperationsMock.createVariant).not.toHaveBeenCalled()
  })

  it('supports free-text condition keys and values', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-title'), 'Experiment users')
    await user.type(screen.getByTestId('variant-form-condition-key'), 'experiment')
    await user.type(screen.getByTestId('variant-form-condition-value'), 'control')
    await user.click(screen.getByTestId('submit-variant-button'))

    await waitFor(() => {
      expect(variantOperationsMock.createVariant).toHaveBeenCalledTimes(1)
    })

    const createdVariant = variantOperationsMock.createVariant.mock.calls[0]![0]

    expect(createdVariant.conditions).toEqual({experiment: 'control'})
  })

  it('shows a title validation message after submit is attempted', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.click(screen.getByTestId('submit-variant-button'))

    expect(screen.getByTestId('variant-form-title-error')).toHaveTextContent('Title is required')
  })

  it('renders the priority field with a help tooltip', async () => {
    await renderDialog()

    expect(screen.getByTestId('variant-form-priority')).toHaveValue(0)
    expect(screen.getByTestId('variant-form-priority-help')).toBeInTheDocument()
  })

  it('rejects priority values outside 0 to 100', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await user.type(screen.getByTestId('variant-form-condition-key'), 'audience')
    await user.type(screen.getByTestId('variant-form-condition-value'), 'loyal-customers')
    await user.clear(screen.getByTestId('variant-form-priority'))
    await user.type(screen.getByTestId('variant-form-priority'), '101')
    await user.click(screen.getByTestId('submit-variant-button'))

    expect(screen.getByTestId('variant-form-priority-error')).toHaveTextContent(
      'Priority must be between 0 and 100',
    )
    expect(variantOperationsMock.createVariant).not.toHaveBeenCalled()
  })

  it('persists priority when creating a variant', async () => {
    const user = userEvent.setup()

    await renderDialog()

    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await user.type(screen.getByTestId('variant-form-condition-key'), 'audience')
    await user.type(screen.getByTestId('variant-form-condition-value'), 'loyal-customers')
    await user.clear(screen.getByTestId('variant-form-priority'))
    await user.type(screen.getByTestId('variant-form-priority'), '75')
    await user.click(screen.getByTestId('submit-variant-button'))

    await waitFor(() => {
      expect(variantOperationsMock.createVariant).toHaveBeenCalledTimes(1)
    })

    const createdVariant = variantOperationsMock.createVariant.mock.calls[0]![0]

    expect(createdVariant.priority).toBe(75)
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

    expect(onCancel).not.toHaveBeenCalled()
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

    expect(toastMock.push).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        title: 'Unable to create variant definition',
      }),
    )
    expect(onCancel).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', {name: 'Create variant definition'})).toBeInTheDocument()

    consoleError.mockRestore()
  })
})
