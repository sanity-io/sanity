import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {getVariantSetReference} from '../../../util/variantSet'
import {CreateVariantSetDialog} from '../CreateVariantSetDialog'

const variantOperationsMock = vi.hoisted(() => ({
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  deleteVariant: vi.fn(),
}))

const toastMock = vi.hoisted(() => ({
  push: vi.fn(),
}))

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => toastMock),
}))

vi.mock('../../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))

describe('CreateVariantSetDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.createVariant.mockResolvedValue(undefined)
  })

  const renderDialog = async () => {
    const onCancel = vi.fn()
    const onDone = vi.fn()
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    render(<CreateVariantSetDialog onCancel={onCancel} onDone={onDone} />, {wrapper})
    await screen.findByTestId('variant-set-form-name')
    return {onCancel, onDone}
  }

  // Enter values through the chip add-field of a given dimension row; a trailing Enter commits the
  // final value so nothing is left uncommitted in the draft field.
  const addValues = async (
    user: ReturnType<typeof userEvent.setup>,
    rowIndex: number,
    values: string,
  ) => {
    const addFields = screen.getAllByTestId('value-chip-add')
    await user.type(addFields[rowIndex]!, `${values}{Enter}`)
  }

  const buildTwoByTwoSet = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByTestId('variant-set-form-name'), 'Regional launch')
    await user.type(screen.getByTestId('variant-set-form-dimension-key'), 'market')
    await addValues(user, 0, 'uk, us')
    await user.click(screen.getByRole('button', {name: 'Add dimension'}))

    const keyInputs = screen.getAllByTestId('variant-set-form-dimension-key')
    await user.type(keyInputs[1]!, 'segment')
    await addValues(user, 1, 'loyal, new')
  }

  it('previews the permutation count as a dimension is entered', async () => {
    const user = userEvent.setup()
    await renderDialog()

    expect(screen.getByTestId('generate-variant-set-button')).toBeDisabled()

    await user.type(screen.getByTestId('variant-set-form-dimension-key'), 'market')
    await addValues(user, 0, 'uk, us, de')

    await waitFor(() => {
      expect(screen.getByTestId('variant-set-preview')).toHaveTextContent(
        '3 variant definitions will be generated',
      )
    })
  })

  it('splits comma-separated input into individual value chips', async () => {
    const user = userEvent.setup()
    await renderDialog()

    await user.type(screen.getByTestId('variant-set-form-dimension-key'), 'market')
    await addValues(user, 0, 'uk, us, de')

    await waitFor(() => {
      expect(screen.getAllByTestId('value-chip-input')).toHaveLength(3)
    })
    const chipValues = screen
      .getAllByTestId('value-chip-input')
      .map((input) => (input as HTMLInputElement).value)
    expect(chipValues).toEqual(['uk', 'us', 'de'])
  })

  it('varies the example placeholder per dimension row', async () => {
    const user = userEvent.setup()
    await renderDialog()

    await user.type(screen.getByTestId('variant-set-form-dimension-key'), 'market')
    await addValues(user, 0, 'uk, us')
    await user.click(screen.getByRole('button', {name: 'Add dimension'}))

    const keyInputs = screen.getAllByTestId('variant-set-form-dimension-key')
    expect(keyInputs[0]).toHaveAttribute('placeholder', 'e.g. market')
    expect(keyInputs[1]).toHaveAttribute('placeholder', 'e.g. segment')
  })

  it('enables JSON export only once there is a complete dimension', async () => {
    const user = userEvent.setup()
    await renderDialog()

    expect(screen.getByTestId('export-json-button')).toBeDisabled()

    await user.type(screen.getByTestId('variant-set-form-dimension-key'), 'market')
    await addValues(user, 0, 'uk, us')

    await waitFor(() => expect(screen.getByTestId('export-json-button')).toBeEnabled())
  })

  it('offers CDP import and sync as not-yet-available actions', async () => {
    await renderDialog()

    expect(screen.getByTestId('import-cdp-button')).toBeDisabled()
    expect(screen.getByTestId('sync-cdp-button')).toBeDisabled()
  })

  it('imports a JSON file and previews the resulting count', async () => {
    const user = userEvent.setup()
    await renderDialog()

    const file = new File(
      [
        JSON.stringify({
          name: 'Imported',
          dimensions: [{key: 'market', values: ['uk', 'us', 'de']}],
        }),
      ],
      'set.json',
      {type: 'application/json'},
    )
    await user.upload(screen.getByTestId('variant-set-file-input'), file)

    await waitFor(() => {
      expect(screen.getByTestId('variant-set-preview')).toHaveTextContent(
        '3 variant definitions will be generated',
      )
    })
    expect(screen.getByTestId('variant-set-form-name')).toHaveValue('Imported')
  })

  it('keeps generate disabled until the set has a name', async () => {
    const user = userEvent.setup()
    await renderDialog()

    await user.type(screen.getByTestId('variant-set-form-dimension-key'), 'market')
    await addValues(user, 0, 'uk, us, de')

    expect(screen.getByTestId('generate-variant-set-button')).toBeDisabled()
    expect(variantOperationsMock.createVariant).not.toHaveBeenCalled()
  })

  it('creates one variant definition per permutation, each tagged with the set', async () => {
    const user = userEvent.setup()
    await renderDialog()
    await buildTwoByTwoSet(user)

    await user.click(screen.getByTestId('generate-variant-set-button'))

    await waitFor(() => {
      expect(variantOperationsMock.createVariant).toHaveBeenCalledTimes(4)
    })

    const created = variantOperationsMock.createVariant.mock.calls.map((call) => call[0])

    expect(created.map((definition) => definition.conditions)).toEqual([
      {market: 'uk', segment: 'loyal'},
      {market: 'uk', segment: 'new'},
      {market: 'us', segment: 'loyal'},
      {market: 'us', segment: 'new'},
    ])

    const references = created.map((definition) => getVariantSetReference(definition))
    expect(references.every((reference) => reference?.name === 'Regional launch')).toBe(true)
    expect(new Set(references.map((reference) => reference?.id)).size).toBe(1)
  })

  it('shows the generated definitions inline after generation', async () => {
    const user = userEvent.setup()
    await renderDialog()
    await buildTwoByTwoSet(user)

    await user.click(screen.getByTestId('generate-variant-set-button'))

    expect(await screen.findByTestId('variant-set-result-title')).toHaveTextContent(
      '4 variant definitions generated',
    )
    const list = screen.getByTestId('variant-set-result-list')
    expect(within(list).getByText('Regional launch: uk / loyal')).toBeInTheDocument()
    expect(within(list).getByText('Regional launch: us / new')).toBeInTheDocument()
  })

  it('calls onDone when the result is dismissed', async () => {
    const user = userEvent.setup()
    const {onDone} = await renderDialog()
    await buildTwoByTwoSet(user)

    await user.click(screen.getByTestId('generate-variant-set-button'))
    await user.click(await screen.findByTestId('variant-set-done-button'))

    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('keeps the form open and toasts when generation fails', async () => {
    const error = new Error('generate failed')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    variantOperationsMock.createVariant.mockRejectedValue(error)
    const user = userEvent.setup()
    const {onDone} = await renderDialog()
    await buildTwoByTwoSet(user)

    await user.click(screen.getByTestId('generate-variant-set-button'))

    await waitFor(() => {
      expect(toastMock.push).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Unable to generate variant definitions',
        }),
      )
    })

    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByTestId('variant-set-preview')).toBeInTheDocument()
    expect(screen.queryByTestId('variant-set-result-list')).not.toBeInTheDocument()

    consoleError.mockRestore()
  })
})
