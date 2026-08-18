import {render, screen} from '@testing-library/react'
// oxlint-disable-next-line @sanity/i18n/no-i18next-import -- test stub for column defs
import {type TFunction} from 'i18next'
import {describe, expect, it, vi} from 'vitest'

import {type InjectedTableProps} from '../../../../../releases/tool/components/Table/types'
import {type DocumentInVariantGroup} from '../../types'
import {getVariantDocumentTableColumnDefs} from '../VariantDocumentTableColumnDefs'

vi.mock('../../../../hooks/useSchema', () => ({useSchema: vi.fn()}))

vi.mock('../../../../components/documentTable/EditedByCell', () => ({
  EditedByCell: vi.fn(() => null),
}))

vi.mock('../VariantDocumentPreview', () => ({
  VariantDocumentPreview: vi.fn(() => null),
}))

vi.mock('../VariantDocumentBundleChips', () => ({
  VariantDocumentBundleChips: vi.fn(() => null),
}))

vi.mock('../../../../preview/components/SanityDefaultPreview', () => ({
  SanityDefaultPreview: vi.fn(() => null),
}))

vi.mock('../../../../components/RelativeTime', () => ({
  RelativeTime: vi.fn(() => null),
}))

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  Text: ({
    children,
    size: _size,
    ...rest
  }: {children: React.ReactNode; size?: number} & Record<string, unknown>) => (
    <span data-ui="Text" {...rest}>
      {children}
    </span>
  ),
  Flex: ({children}: {children: React.ReactNode}) => <div data-ui="Flex">{children}</div>,
  Box: ({children}: {children: React.ReactNode}) => <div data-ui="Box">{children}</div>,
}))

vi.mock('../../../../../../ui-components/toneIcon/ToneIcon', () => ({
  ToneIcon: () => <span data-testid="tone-icon" />,
}))

vi.mock('../../../../../../ui-components/tooltip/Tooltip', () => ({
  Tooltip: ({children, content}: {children: React.ReactNode; content: React.ReactNode}) => (
    <div data-testid="tooltip-wrapper">
      <div data-testid="tooltip-content">{content}</div>
      {children}
    </div>
  ),
}))

const baseDatum: DocumentInVariantGroup = {
  memoKey: 'group-1',
  groupId: 'article-1',
  validation: {
    hasError: false,
    isValidating: false,
    validation: [],
  },
  document: {
    _id: 'published.scope.article-1',
    _type: 'article',
    _rev: 'rev-1',
    _createdAt: '2025-01-01T00:00:00Z',
    _updatedAt: '2025-06-01T00:00:00Z',
    publishedDocumentExists: true,
    title: 'First article',
  },
  version: {
    documentId: 'published.scope.article-1',
    releaseRef: null,
    updatedAt: '2025-06-01T00:00:00Z',
  },
  versions: [],
}

function getValidationColumnCell() {
  const t = ((key: string) => key) as TFunction<'variants'>
  const columns = getVariantDocumentTableColumnDefs(t, 'variant-1', new Map())
  const validationColumn = columns.find((column) => column.id === 'validation')
  if (!validationColumn || validationColumn.hidden || !validationColumn.cell) {
    throw new Error('Expected validation column')
  }
  return validationColumn.cell
}

function renderValidationCell(datum: DocumentInVariantGroup) {
  const ValidationCell = getValidationColumnCell()
  const cellProps = {id: 'validation', style: {}} as InjectedTableProps

  render(<ValidationCell datum={datum} cellProps={cellProps} sorting={false} />)
}

describe('validation column cell', () => {
  it('shows a validating indicator while validation is in progress', () => {
    renderValidationCell({
      ...baseDatum,
      validation: {hasError: false, isValidating: true, validation: []},
    })

    expect(screen.getByTestId('variant-document-validation-validating')).toBeInTheDocument()
    expect(screen.queryByTestId('variant-document-validation-valid')).not.toBeInTheDocument()
  })

  it('shows the ready checkmark only after validation completes without errors', () => {
    renderValidationCell(baseDatum)

    expect(screen.getByTestId('variant-document-validation-valid')).toBeInTheDocument()
    expect(screen.queryByTestId('variant-document-validation-validating')).not.toBeInTheDocument()
  })
})
