import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {setupVirtualListEnv} from '../../../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type MissingDocumentRow} from '../../../hooks/useVariantDefinitionLens'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {VARIANT_DOCUMENT_TYPE} from '../../../store/constants'
import {type SystemVariant, type VariantId} from '../../../types'
import {VariantMissingDocumentsTable} from '../VariantMissingDocumentsTable'

const createVariantDocument = vi.fn()

vi.mock('../../../hooks/useVariantDocumentOperations', () => ({
  useVariantDocumentOperations: () => ({createVariantDocument}),
}))

vi.mock('../../../../tasks/hooks/useDocumentPreviewValues', () => ({
  useDocumentPreviewValues: () => ({isLoading: false, value: {title: 'Jacket'}}),
}))

vi.mock('../VariantDocumentTypePicker', () => ({
  VariantDocumentTypePicker: () => null,
}))

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  useMediaIndex: vi.fn(() => 4),
}))

setupVirtualListEnv()

const variant: SystemVariant = {
  _id: '_.variants.german' as VariantId,
  _type: VARIANT_DOCUMENT_TYPE,
  _rev: 'rev',
  _createdAt: '2026-11-01T00:00:00Z',
  _updatedAt: '2026-11-01T00:00:00Z',
  conditions: {language: 'de'},
  priority: 0,
  metadata: {title: 'German'},
}

const jacket: MissingDocumentRow = {
  groupId: 'jacket',
  state: 'absent',
  _type: 'product',
  versions: [],
}

describe('VariantMissingDocumentsTable', () => {
  it('keeps Create disabled after a create until the row leaves Missing', async () => {
    createVariantDocument.mockResolvedValue(undefined)
    const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
    const renderTable = (rows: MissingDocumentRow[]) => (
      <VariantMissingDocumentsTable
        hasTypes
        loading={false}
        onSelectType={() => {}}
        rows={rows}
        selectedType="product"
        variant={variant}
      />
    )
    const {rerender} = render(renderTable([jacket]), {wrapper})

    const button = await screen.findByTestId('variant-missing-create-version')
    expect(button).toBeEnabled()

    await userEvent.click(button)
    await waitFor(() => expect(createVariantDocument).toHaveBeenCalledTimes(1))

    // The create resolved, but the listener has not moved the row yet.
    expect(screen.getByTestId('variant-missing-create-version')).toBeDisabled()
    rerender(renderTable([{...jacket}]))
    expect(screen.getByTestId('variant-missing-create-version')).toBeDisabled()

    // The row leaves Missing; if it ever comes back, it can be created again.
    rerender(renderTable([]))
    rerender(renderTable([{...jacket}]))
    expect(await screen.findByTestId('variant-missing-create-version')).toBeEnabled()
  })

  it('enables Create again when the create fails', async () => {
    createVariantDocument.mockRejectedValue(new Error('nope'))
    const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
    render(
      <VariantMissingDocumentsTable
        hasTypes
        loading={false}
        onSelectType={() => {}}
        rows={[jacket]}
        selectedType="product"
        variant={variant}
      />,
      {wrapper},
    )

    const button = await screen.findByTestId('variant-missing-create-version')
    await userEvent.click(button)

    await waitFor(() => expect(screen.getByTestId('variant-missing-create-version')).toBeEnabled())
  })
})
