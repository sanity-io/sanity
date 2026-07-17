import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type SystemVariant} from '../../../types'
import {VARIANT_SET_METADATA_KEY} from '../../../util/variantSet'
import {DeleteVariantSetDialog} from '../DeleteVariantSetDialog'

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

describe('DeleteVariantSetDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.updateVariant.mockResolvedValue(undefined)
    variantOperationsMock.deleteVariant.mockResolvedValue(undefined)
    variantsMock.data = [
      child('c1', {market: 'uk'}),
      child('c2', {market: 'us'}),
      child('c3', {market: 'de'}),
    ]
    variantsMock.loading = false
    documentCountsMock.data = {}
  })

  const renderDialog = async () => {
    const onDone = vi.fn()
    const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
    render(
      <DeleteVariantSetDialog onClose={vi.fn()} onDone={onDone} setReference={setReference} />,
      {
        wrapper,
      },
    )
    await screen.findByTestId('delete-variant-set-dialog')
    return {onDone}
  }

  it('deletes every definition when none has documents', async () => {
    const user = userEvent.setup()
    const {onDone} = await renderDialog()

    expect(screen.getByTestId('delete-set-summary')).toHaveTextContent(
      '3 definitions will be deleted',
    )
    expect(screen.queryByTestId('delete-set-retained-warning')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', {name: 'Delete set'}))

    await waitFor(() => {
      expect(variantOperationsMock.deleteVariant).toHaveBeenCalledTimes(3)
    })
    expect(variantOperationsMock.updateVariant).not.toHaveBeenCalled()
    await waitFor(() => expect(onDone).toHaveBeenCalled())
  })

  it('keeps and detaches definitions that still have documents', async () => {
    documentCountsMock.data = {c2: 3}
    const user = userEvent.setup()
    const {onDone} = await renderDialog()

    expect(screen.getByTestId('delete-set-summary')).toHaveTextContent(
      '2 definitions will be deleted',
    )
    expect(screen.getByTestId('delete-set-retained-warning')).toBeInTheDocument()

    await user.click(screen.getByRole('button', {name: 'Delete set'}))

    await waitFor(() => {
      expect(variantOperationsMock.deleteVariant).toHaveBeenCalledTimes(2)
    })
    // The document-bearing member is detached (updated), not deleted.
    expect(variantOperationsMock.updateVariant).toHaveBeenCalledTimes(1)
    expect(variantOperationsMock.updateVariant.mock.calls[0]![0]._id).toBe('c2')
    await waitFor(() => expect(onDone).toHaveBeenCalled())
  })
})
