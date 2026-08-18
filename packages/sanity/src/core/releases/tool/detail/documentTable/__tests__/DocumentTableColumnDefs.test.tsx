import {type Schema} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
// oxlint-disable-next-line @sanity/i18n/no-i18next-import -- test stub for column defs
import {type TFunction} from 'i18next'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useSchema} from '../../../../../hooks/useSchema'
import {type InjectedTableProps} from '../../../components/Table/types'
import {type BundleDocumentRow} from '../../ReleaseSummary'
import {DocumentType, getDocumentTableColumnDefs} from '../DocumentTableColumnDefs'

vi.mock('../../../../../hooks/useSchema', () => ({useSchema: vi.fn()}))

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

// Stub Tooltip so we can assert its presence without a portal/full DOM tree.
vi.mock('../../../../../../ui-components/tooltip/Tooltip', () => ({
  Tooltip: ({children, content}: {children: React.ReactNode; content: React.ReactNode}) => (
    <div data-testid="tooltip-wrapper">
      <div data-testid="tooltip-content">{content}</div>
      {children}
    </div>
  ),
}))

const mockUseSchema = vi.mocked(useSchema)

function buildMockSchema(typeTitle: string | undefined): Schema {
  return {
    get: vi.fn().mockReturnValue(typeTitle !== undefined ? {title: typeTitle} : undefined),
  } as unknown as Schema
}

const releaseDocumentId = '_.releases.active-release'
const baseDatum: BundleDocumentRow = {
  memoKey: 'doc-1',
  document: {
    _id: 'versions.doc-1',
    _type: 'article',
    _rev: 'rev-1',
    _createdAt: '2023-10-01T08:00:00Z',
    _updatedAt: '2023-10-01T09:00:00Z',
    publishedDocumentExists: true,
  },
  validation: {
    hasError: false,
    isValidating: false,
    validation: [],
  },
}

function getValidationColumnCell() {
  const t = ((key: string) => key) as TFunction<'releases'>
  // The validating/ready indicators are part of the beta (variants) column layout; production keeps
  // an error-only validation column, so exercise the cell with the beta layout enabled.
  const columns = getDocumentTableColumnDefs(releaseDocumentId, 'active', t, {
    variantsEnabled: true,
  })
  const validationColumn = columns.find((column) => column.id === 'validation')
  if (!validationColumn || validationColumn.hidden || !validationColumn.cell) {
    throw new Error('Expected validation column')
  }
  return validationColumn.cell
}

function renderValidationCell(datum: BundleDocumentRow) {
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

    expect(
      screen.getByTestId(`validation-validating-${baseDatum.document._id}`),
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId(`validation-valid-${baseDatum.document._id}`),
    ).not.toBeInTheDocument()
  })

  it('shows the ready checkmark only after validation completes without errors', () => {
    renderValidationCell(baseDatum)

    expect(screen.getByTestId(`validation-valid-${baseDatum.document._id}`)).toBeInTheDocument()
    expect(
      screen.queryByTestId(`validation-validating-${baseDatum.document._id}`),
    ).not.toBeInTheDocument()
  })
})

describe('flag-off column parity', () => {
  // These defs also drive the non-beta releases-detail table and scheduled drafts, so the
  // flag-off (production) column set must exactly match what production shipped before this
  // redesign — no variant column, no split "Last edited" / "Edited by" pair, and the original
  // (wider) type-column width. This was previously only verified manually, column by column.
  const t = ((key: string) => key) as TFunction<'releases'>

  it('matches the exact production column set and order when variantsEnabled is omitted', () => {
    const columns = getDocumentTableColumnDefs(releaseDocumentId, 'active', t)

    expect(columns.map((column) => column.id)).toEqual([
      'action',
      'document._type',
      'search',
      'document._updatedAt',
      'validation',
    ])
  })

  it('keeps the pre-redesign type-column width (150, not the beta 120)', () => {
    const columns = getDocumentTableColumnDefs(releaseDocumentId, 'active', t)
    const typeColumn = columns.find((column) => column.id === 'document._type')

    expect(typeColumn?.width).toBe(150)
  })

  it('keeps a single combined "Edited" column instead of the beta split pair', () => {
    const columns = getDocumentTableColumnDefs(releaseDocumentId, 'active', t)

    expect(columns.filter((column) => column.id === 'document._updatedAt')).toHaveLength(1)
    expect(columns.find((column) => column.id === 'editedBy')).toBeUndefined()
  })

  it('omits the action column for archived and published releases, same as beta', () => {
    const archivedColumns = getDocumentTableColumnDefs(releaseDocumentId, 'archived', t)
    const publishedColumns = getDocumentTableColumnDefs(releaseDocumentId, 'published', t)

    expect(archivedColumns.find((column) => column.id === 'action')).toBeUndefined()
    expect(publishedColumns.find((column) => column.id === 'action')).toBeUndefined()
  })
})

describe('DocumentType', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('title rendering', () => {
    it('renders the schema type title when the type is found', () => {
      mockUseSchema.mockReturnValue(buildMockSchema('My Article Type'))

      render(<DocumentType type="myArticle" />)

      expect(screen.getByText('My Article Type')).toBeInTheDocument()
    })

    it('renders "Not found" when the schema type is not registered', () => {
      mockUseSchema.mockReturnValue(buildMockSchema(undefined))

      render(<DocumentType type="unknownType" />)

      expect(screen.getByText('Not found')).toBeInTheDocument()
    })
  })

  describe('truncation tooltip', () => {
    it('does not render a tooltip when the text is not truncated (scrollWidth === clientWidth)', () => {
      mockUseSchema.mockReturnValue(buildMockSchema('Short Title'))

      // scrollWidth and clientWidth both default to 0 in jsdom, so nothing reads as truncated.
      render(<DocumentType type="shortType" />)

      expect(screen.queryByTestId('tooltip-wrapper')).not.toBeInTheDocument()
      expect(screen.getByText('Short Title')).toBeInTheDocument()
    })

    it('renders a tooltip containing the full title when the text is truncated', () => {
      mockUseSchema.mockReturnValue(buildMockSchema('A Very Long Schema Type Title That Overflows'))

      const originalResizeObserver = globalThis.ResizeObserver
      const originalDescriptor = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'scrollWidth',
      )

      // Report every element as wider than its visible box so the measurement reads as truncated.
      globalThis.ResizeObserver = class {
        private callback: () => void

        constructor(callback: () => void) {
          this.callback = callback
        }

        observe(): void {
          this.callback()
        }

        unobserve(): void {}

        disconnect(): void {}
      } as unknown as typeof ResizeObserver

      Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
        configurable: true,
        get() {
          return 400
        },
      })

      try {
        render(<DocumentType type="longType" />)

        expect(screen.getByTestId('tooltip-wrapper')).toBeInTheDocument()
        expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
          'A Very Long Schema Type Title That Overflows',
        )
      } finally {
        // Restore in finally so a thrown assertion cannot leak overrides into later tests.
        if (originalDescriptor) {
          Object.defineProperty(HTMLElement.prototype, 'scrollWidth', originalDescriptor)
        }
        globalThis.ResizeObserver = originalResizeObserver
      }
    })

    it('re-measures once web fonts load and reveals the overflow', async () => {
      mockUseSchema.mockReturnValue(buildMockSchema('A Title That Only Overflows Once Fonts Load'))

      const originalDescriptor = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'scrollWidth',
      )
      const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts')

      // Text fits until the font swaps in (scrollWidth exceeds clientWidth only after fonts
      // settle), isolating the fonts.ready re-measure from the mount measure.
      let fontsLoaded = false
      let resolveFontsReady!: () => void
      const fontsReady = new Promise<void>((resolve) => {
        resolveFontsReady = resolve
      })
      Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
        configurable: true,
        get() {
          return fontsLoaded ? 400 : 0
        },
      })
      Object.defineProperty(document, 'fonts', {
        configurable: true,
        value: {ready: fontsReady},
      })

      try {
        render(<DocumentType type="lateFontType" />)

        // No tooltip on mount - the text still fits.
        expect(screen.queryByTestId('tooltip-wrapper')).not.toBeInTheDocument()

        // The font swap widens the text, then fonts.ready resolves and the re-measure runs.
        fontsLoaded = true
        resolveFontsReady()

        await waitFor(() => {
          expect(screen.getByTestId('tooltip-wrapper')).toBeInTheDocument()
        })
        expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
          'A Title That Only Overflows Once Fonts Load',
        )
      } finally {
        if (originalDescriptor) {
          Object.defineProperty(HTMLElement.prototype, 'scrollWidth', originalDescriptor)
        }
        if (originalFonts) {
          Object.defineProperty(document, 'fonts', originalFonts)
        } else {
          // jsdom has no `document.fonts` by default; remove the stub we added.
          // @ts-expect-error -- deleting an optional DOM property in teardown
          delete document.fonts
        }
      }
    })
  })
})
