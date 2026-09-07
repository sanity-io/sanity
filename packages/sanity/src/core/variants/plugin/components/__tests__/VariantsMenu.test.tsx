import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type SingleWorkspace} from '../../../../config/types'
import {variantAlphaAudience} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {getVariantId} from '../../../tool/util'
import {type SystemVariant} from '../../../types'
import {VariantsMenu} from '../VariantsMenu'

const variantsMock = vi.hoisted(() => ({
  data: [] as SystemVariant[],
  byId: new Map<string, SystemVariant>(),
  loading: false,
  error: undefined as Error | undefined,
}))

const setVariant = vi.fn()

vi.mock('../../../../perspective/useSetVariant', () => ({
  useSetVariant: vi.fn(() => setVariant),
}))

vi.mock('../../../store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => variantsMock),
}))

describe('VariantsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantsMock.data = [variantAlphaAudience]
    variantsMock.byId = new Map([[variantAlphaAudience._id, variantAlphaAudience]])
  })

  const renderMenu = async (config?: Partial<SingleWorkspace>) => {
    const wrapper = await createTestProvider({
      config,
      resources: [variantsUsEnglishLocaleBundle],
    })
    const view = render(<VariantsMenu trigger={<button type="button">Open variants</button>} />, {
      wrapper,
    })
    await userEvent.setup().click(await screen.findByRole('button', {name: 'Open variants'}))
    await screen.findByTestId('variants-nav-menu')
    return view
  }

  it('shows a mismatch error when a stored condition is not in the configured list', async () => {
    await renderMenu({
      beta: {
        variants: {
          enabled: true,
          conditions: [{name: 'locale', values: ['en-US']}],
        },
      },
    })

    expect(screen.getByTestId('variant-condition-mismatch')).toBeInTheDocument()
  })

  it('does not show a mismatch error in freeform mode', async () => {
    await renderMenu()

    expect(screen.queryByTestId('variant-condition-mismatch')).not.toBeInTheDocument()
  })

  it('does not show a mismatch error while configured conditions are loading', async () => {
    await renderMenu({
      beta: {
        variants: {
          enabled: true,
          conditions: () => new Promise(() => undefined),
        },
      },
    })

    await waitFor(() => {
      expect(
        screen.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`),
      ).toBeInTheDocument()
    })

    expect(screen.queryByTestId('variant-condition-mismatch')).not.toBeInTheDocument()
  })
})
