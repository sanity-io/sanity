import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type SystemVariant} from '../../../types'
import {VARIANT_SET_METADATA_KEY} from '../../../util/variantSet'
import {EditVariantSetDialog} from '../EditVariantSetDialog'

const setReference = {id: 'set-1', name: 'Regional launch'}

const variantOperationsMock = vi.hoisted(() => ({
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  deleteVariant: vi.fn(),
}))
const toastMock = vi.hoisted(() => ({push: vi.fn()}))
const variantsMock = vi.hoisted(() => ({data: [] as unknown[], byId: new Map(), loading: false}))
const documentCountsMock = vi.hoisted(() => ({
  data: {} as Record<string, number>,
  error: undefined,
}))

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => toastMock),
}))
vi.mock('../../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))
vi.mock('../../../store/useAllVariants', () => ({useAllVariants: vi.fn(() => variantsMock)}))
vi.mock('../../../hooks/useVariantsDocumentCounts', () => ({
  useVariantsDocumentCounts: vi.fn(() => documentCountsMock),
}))

function child(id: string, conditions: Record<string, string>): SystemVariant {
  return {
    _id: id,
    _type: 'system.variant',
    conditions,
    priority: 0,
    metadata: {
      title: `Regional launch: ${Object.values(conditions).join(' / ')}`,
      description: [],
      [VARIANT_SET_METADATA_KEY]: setReference,
    },
  } as unknown as SystemVariant
}

describe('EditVariantSetDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.updateVariant.mockResolvedValue(undefined)
    variantOperationsMock.deleteVariant.mockResolvedValue(undefined)
    variantsMock.data = [
      child('c1', {market: 'uk', segment: 'loyal'}),
      child('c2', {market: 'uk', segment: 'new'}),
      child('c3', {market: 'us', segment: 'loyal'}),
      child('c4', {market: 'us', segment: 'new'}),
    ]
    variantsMock.loading = false
    documentCountsMock.data = {}
  })

  const renderDialog = async () => {
    const onDone = vi.fn()
    const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
    render(
      <EditVariantSetDialog onCancel={vi.fn()} onDone={onDone} setReference={setReference} />,
      {
        wrapper,
      },
    )
    await screen.findByTestId('edit-set-apply-button')
    return {onDone}
  }

  it('propagates a value rename to every matching definition', async () => {
    const user = userEvent.setup()
    const {onDone} = await renderDialog()

    const loyalInput = screen.getByDisplayValue('loyal')
    await user.clear(loyalInput)
    await user.type(loyalInput, 'loyal-users')

    await waitFor(() => {
      expect(screen.getByTestId('edit-set-preview-line')).toHaveTextContent(
        '2 definitions will be updated',
      )
    })

    await user.click(screen.getByTestId('edit-set-apply-button'))

    await waitFor(() => {
      expect(variantOperationsMock.updateVariant).toHaveBeenCalledTimes(2)
    })
    const updatedConditions = variantOperationsMock.updateVariant.mock.calls.map(
      (c) => c[0].conditions,
    )
    expect(updatedConditions).toEqual([
      {market: 'uk', segment: 'loyal-users'},
      {market: 'us', segment: 'loyal-users'},
    ])
    await waitFor(() => expect(onDone).toHaveBeenCalled())
  })

  it('blocks removing a value whose definitions still have documents', async () => {
    documentCountsMock.data = {c3: 2}
    const user = userEvent.setup()
    await renderDialog()

    // Value inputs render in order: market[uk, us], segment[loyal, new], so the second remove
    // button removes "us" from market (affecting c3 and c4). c3 has documents → removal blocked.
    await user.click(screen.getAllByTestId('edit-set-remove-value')[1]!)

    await waitFor(() => {
      expect(screen.getByTestId('edit-set-blocked-warning')).toBeInTheDocument()
    })
    expect(screen.getByTestId('edit-set-apply-button')).toBeDisabled()
    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
  })
})
