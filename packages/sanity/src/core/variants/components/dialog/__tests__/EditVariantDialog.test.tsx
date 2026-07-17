import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type SystemVariant} from '../../../types'
import {
  getForkedFromSetReference,
  getVariantSetReference,
  VARIANT_SET_METADATA_KEY,
} from '../../../util/variantSet'
import {EditVariantDialog} from '../EditVariantDialog'

const variantOperationsMock = vi.hoisted(() => ({
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  deleteVariant: vi.fn(),
}))

const toastMock = vi.hoisted(() => ({push: vi.fn()}))
const variantsMock = vi.hoisted(() => ({
  data: [] as unknown[],
  byId: new Map(),
  loading: false,
  error: undefined,
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

const setReference = {id: 'set-1', name: 'Regional launch'}

function setMember(): SystemVariant {
  return {
    _id: '_.variants.abc',
    _type: 'system.variant',
    conditions: {market: 'uk'},
    priority: 0,
    metadata: {
      title: 'Regional launch: uk',
      description: [],
      [VARIANT_SET_METADATA_KEY]: setReference,
    },
  } as unknown as SystemVariant
}

describe('EditVariantDialog fork-on-edit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.updateVariant.mockResolvedValue(undefined)
  })

  const renderDialog = async (variant: SystemVariant) => {
    const onSubmit = vi.fn()
    const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
    render(<EditVariantDialog onCancel={vi.fn()} onSubmit={onSubmit} variant={variant} />, {
      wrapper,
    })
    await screen.findByTestId('save-variant-button')
    return {onSubmit}
  }

  it('forks a set member when its conditions change', async () => {
    const user = userEvent.setup()
    await renderDialog(setMember())

    const valueInput = screen.getByTestId('variant-form-condition-value')
    await user.clear(valueInput)
    await user.type(valueInput, 'gb')
    await user.click(screen.getByTestId('save-variant-button'))

    await waitFor(() => expect(variantOperationsMock.updateVariant).toHaveBeenCalledTimes(1))
    const saved = variantOperationsMock.updateVariant.mock.calls[0]![0]
    expect(saved.conditions).toEqual({market: 'gb'})
    expect(getVariantSetReference(saved)).toBeUndefined()
    expect(getForkedFromSetReference(saved)).toEqual(setReference)
  })

  it('keeps set membership when conditions are unchanged', async () => {
    const user = userEvent.setup()
    await renderDialog(setMember())

    await user.click(screen.getByTestId('save-variant-button'))

    await waitFor(() => expect(variantOperationsMock.updateVariant).toHaveBeenCalledTimes(1))
    const saved = variantOperationsMock.updateVariant.mock.calls[0]![0]
    expect(getVariantSetReference(saved)).toEqual(setReference)
    expect(getForkedFromSetReference(saved)).toBeUndefined()
  })
})
