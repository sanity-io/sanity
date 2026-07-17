import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {CreateVariantSetDialog} from '../CreateVariantSetDialog'

describe('CreateVariantSetDialog', () => {
  const renderDialog = async () => {
    const onCancel = vi.fn()
    const onSubmit = vi.fn()
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    render(<CreateVariantSetDialog onCancel={onCancel} onSubmit={onSubmit} />, {wrapper})
    await screen.findByTestId('variant-set-form-name')
    return {onCancel, onSubmit}
  }

  it('previews the permutation count as a dimension is entered', async () => {
    const user = userEvent.setup()
    await renderDialog()

    expect(screen.getByTestId('generate-variant-set-button')).toBeDisabled()

    await user.type(screen.getByTestId('variant-set-form-dimension-key'), 'market')
    await user.type(screen.getByTestId('variant-set-form-dimension-values'), 'uk, us, de')

    await waitFor(() => {
      expect(screen.getByTestId('variant-set-preview')).toHaveTextContent(
        '3 variant definitions will be generated',
      )
    })
  })

  it('multiplies the count across dimensions', async () => {
    const user = userEvent.setup()
    await renderDialog()

    await user.type(screen.getByTestId('variant-set-form-dimension-key'), 'market')
    await user.type(screen.getByTestId('variant-set-form-dimension-values'), 'uk, us, de')
    await user.click(screen.getByRole('button', {name: 'Add dimension'}))

    const keyInputs = screen.getAllByTestId('variant-set-form-dimension-key')
    const valueInputs = screen.getAllByTestId('variant-set-form-dimension-values')
    await user.type(keyInputs[1]!, 'segment')
    await user.type(valueInputs[1]!, 'loyal, new')

    await waitFor(() => {
      expect(screen.getByTestId('variant-set-preview')).toHaveTextContent(
        '6 variant definitions will be generated',
      )
    })
  })

  it('keeps generate disabled until the set has a name', async () => {
    const user = userEvent.setup()
    const {onSubmit} = await renderDialog()

    await user.type(screen.getByTestId('variant-set-form-dimension-key'), 'market')
    await user.type(screen.getByTestId('variant-set-form-dimension-values'), 'uk, us, de')

    expect(screen.getByTestId('generate-variant-set-button')).toBeDisabled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the parsed set when generate is clicked', async () => {
    const user = userEvent.setup()
    const {onSubmit} = await renderDialog()

    await user.type(screen.getByTestId('variant-set-form-name'), 'Regional launch')
    await user.type(screen.getByTestId('variant-set-form-dimension-key'), 'market')
    await user.type(screen.getByTestId('variant-set-form-dimension-values'), 'uk, us, de')

    const generateButton = screen.getByTestId('generate-variant-set-button')
    await waitFor(() => expect(generateButton).toBeEnabled())
    await user.click(generateButton)

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Regional launch',
      dimensions: [{key: 'market', values: ['uk', 'us', 'de']}],
    })
  })
})
