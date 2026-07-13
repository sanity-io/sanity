import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  mockUsePerspective,
  usePerspectiveMockReturn,
} from '../../../perspective/__mocks__/usePerspective.mock'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {VariantPinButton} from '../components/VariantPinButton'

const mockedSetVariant = vi.fn()

vi.mock('../../../perspective/useSetVariant', () => ({
  useSetVariant: vi.fn(() => mockedSetVariant),
}))

vi.mock('../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

const renderTest = async () => {
  const wrapper = await createTestProvider({
    resources: [variantsUsEnglishLocaleBundle],
  })

  render(<VariantPinButton variant={variantAlphaAudience} />, {wrapper})

  await waitFor(() => {
    expect(screen.getByTestId('pin-variant-button')).toBeInTheDocument()
  })
}

describe('VariantPinButton', () => {
  it('pins a variant when it is not selected', async () => {
    mockUsePerspective.mockReturnValue({
      ...usePerspectiveMockReturn,
      selectedVariant: undefined,
    })

    await renderTest()

    await userEvent.click(screen.getByTestId('pin-variant-button'))

    expect(mockedSetVariant).toHaveBeenCalledWith(variantAlphaAudience._id)
  })

  it('unpins a variant when it is selected', async () => {
    mockUsePerspective.mockReturnValue({
      ...usePerspectiveMockReturn,
      selectedVariant: variantAlphaAudience,
    })

    await renderTest()

    await userEvent.click(screen.getByTestId('pin-variant-button'))

    expect(mockedSetVariant).toHaveBeenCalledWith(undefined)
  })
})
