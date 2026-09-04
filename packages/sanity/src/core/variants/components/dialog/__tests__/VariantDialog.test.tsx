import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type SingleWorkspace} from '../../../../config/types'
import {variantAlphaAudience} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type EditableSystemVariant, type SystemVariant} from '../../../types'
import {getVariantDefaults} from '../../../util/variantDefaults'
import {VariantDialog} from '../VariantDialog'

const toastMock = vi.hoisted(() => ({
  push: vi.fn(),
}))

const variantsMock = vi.hoisted(() => ({
  data: [] as SystemVariant[],
  byId: new Map<string, SystemVariant>(),
  loading: false,
  error: undefined as Error | undefined,
}))

vi.mock('@sanity/ui/toast', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => toastMock),
}))

vi.mock('../../../store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => variantsMock),
}))

describe('VariantDialog', () => {
  const onCancel = vi.fn()
  const onSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    onSubmit.mockResolvedValue(undefined)
    variantsMock.data = []
    variantsMock.byId = new Map()
    variantsMock.loading = false
    variantsMock.error = undefined
  })

  const renderDialog = async (props?: {
    config?: Partial<SingleWorkspace>
    initialValue?: EditableSystemVariant
    renderCancelButton?: boolean
  }) => {
    const wrapper = await createTestProvider({
      config: props?.config,
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

  it('shows priority validation when the field is cleared', async () => {
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
    await user.click(screen.getByTestId('save-variant-button'))

    expect(screen.getByTestId('variant-form-priority-error')).toHaveTextContent(
      'Priority must be a number',
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits an unchanged variant without flagging it as its own duplicate', async () => {
    const user = userEvent.setup()
    variantsMock.data = [variantAlphaAudience]
    variantsMock.byId = new Map([[variantAlphaAudience._id, variantAlphaAudience]])

    await renderDialog({
      initialValue: {
        _id: variantAlphaAudience._id,
        _type: variantAlphaAudience._type,
        conditions: variantAlphaAudience.conditions,
        priority: variantAlphaAudience.priority,
        metadata: variantAlphaAudience.metadata,
      },
      renderCancelButton: true,
    })

    await user.click(screen.getByTestId('save-variant-button'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
    expect(screen.queryByTestId('variant-form-title-error')).not.toBeInTheDocument()
    expect(screen.queryByTestId('variant-form-conditions-duplicate-error')).not.toBeInTheDocument()
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

  it('keeps unknown existing conditions when configured conditions are set', async () => {
    await renderDialog({
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: [
              {
                name: 'audience',
                title: 'Audience',
                values: [{value: 'loyal', title: 'Loyal customers'}],
              },
            ],
          },
        },
      },
      initialValue: {
        ...getVariantDefaults(),
        metadata: {title: 'Legacy audience', description: []},
        conditions: {legacy: 'old-value'},
      },
    })

    const keyMenuButton = screen.getByTestId('variant-form-condition-key-menu-button')
    const valueMenuButton = screen.getByTestId('variant-form-condition-value-menu-button')

    expect(keyMenuButton).toHaveTextContent('legacy')
    expect(keyMenuButton).toBeEnabled()
    expect(valueMenuButton).toHaveTextContent('old-value')
    // No configured values exist for an unknown key, so only the key can be retargeted.
    expect(valueMenuButton).toBeDisabled()
    expect(screen.getByTestId('variant-form-condition-mismatch')).toHaveTextContent(
      'The condition "legacy" is not in the configured list.',
    )
    expect(screen.queryByTestId('variant-form-condition-key')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Add condition'})).toBeDisabled()

    const user = userEvent.setup()

    await user.click(screen.getByTestId('save-variant-button'))

    expect(onSubmit).not.toHaveBeenCalled()

    // The configured keys are still offered, so the stale pair can be retargeted in place.
    await user.click(keyMenuButton)
    await user.click(screen.getByTestId('variant-form-condition-key-option-audience'))

    expect(keyMenuButton).toHaveTextContent('Audience')
    expect(valueMenuButton).toHaveTextContent('Choose a value')
    expect(valueMenuButton).toBeEnabled()
    // Validation is showing after the failed save, so the row now asks for a value instead.
    expect(screen.getByTestId('variant-form-condition-mismatch')).toHaveTextContent(
      'Condition value is required',
    )

    await user.click(valueMenuButton)
    await user.click(screen.getByTestId('variant-form-condition-value-option-loyal'))

    expect(valueMenuButton).toHaveTextContent('Loyal customers')
    expect(screen.queryByTestId('variant-form-condition-mismatch')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('save-variant-button'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({conditions: {audience: 'loyal'}}),
      )
    })
  })

  it('marks an unknown value as an error and blocks save', async () => {
    await renderDialog({
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: [
              {
                name: 'audience',
                title: 'Audience',
                values: [{value: 'loyal', title: 'Loyal customers'}],
              },
            ],
          },
        },
      },
      initialValue: {
        ...getVariantDefaults(),
        metadata: {title: 'Legacy audience', description: []},
        conditions: {audience: 'old-value'},
      },
    })

    expect(screen.getByTestId('variant-form-condition-key-menu-button')).toHaveTextContent(
      'Audience',
    )
    const valueMenuButton = screen.getByTestId('variant-form-condition-value-menu-button')
    expect(valueMenuButton).toHaveTextContent('old-value')
    expect(valueMenuButton).toBeEnabled()
    expect(screen.getByTestId('variant-form-condition-mismatch')).toHaveTextContent(
      'The value "old-value" is not valid for "audience".',
    )

    const user = userEvent.setup()

    await user.click(screen.getByTestId('save-variant-button'))

    expect(onSubmit).not.toHaveBeenCalled()

    await user.click(valueMenuButton)
    await user.click(screen.getByTestId('variant-form-condition-value-option-loyal'))

    expect(valueMenuButton).toHaveTextContent('Loyal customers')
    expect(screen.queryByTestId('variant-form-condition-mismatch')).not.toBeInTheDocument()
  })

  it('blocks save while configured conditions are loading', async () => {
    await renderDialog({
      config: {
        beta: {
          variants: {
            enabled: true,
            conditions: () => new Promise(() => undefined),
          },
        },
      },
      initialValue: {
        ...getVariantDefaults(),
        metadata: {title: 'Loyal audience', description: []},
        conditions: {audience: 'loyal'},
      },
    })

    expect(screen.getByTestId('variant-form-conditions-loading')).toBeInTheDocument()
    // The stored pair stays visible (disabled) so the form keeps its shape while loading.
    const keyMenuButton = screen.getByTestId('variant-form-condition-key-menu-button')
    const valueMenuButton = screen.getByTestId('variant-form-condition-value-menu-button')
    expect(keyMenuButton).toHaveTextContent('audience')
    expect(keyMenuButton).toBeDisabled()
    expect(valueMenuButton).toHaveTextContent('loyal')
    expect(valueMenuButton).toBeDisabled()

    await userEvent.setup().click(screen.getByTestId('save-variant-button'))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
