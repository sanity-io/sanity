import {type Schema} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useSchema} from '../../../../../hooks'
import {DocumentType} from '../DocumentTableColumnDefs'

vi.mock('../../../../../hooks', () => ({
  useSchema: vi.fn(),
}))

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  Text: ({children, size: _size}: {children: React.ReactNode; size?: number}) => (
    <span data-ui="Text">{children}</span>
  ),
}))

// Stub Tooltip so we can assert its presence without a portal/full DOM tree.
vi.mock('../../../../../../ui-components/tooltip', () => ({
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

      // The global ResizeObserver mock (from test setup) is a no-op so the callback
      // never fires. scrollWidth and clientWidth both default to 0 in jsdom,
      // so isTruncated stays false.
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

      // Fire the observer callback synchronously on observe() and report every element as
      // wider than its visible box, driving the effect's check into the truncated branch.
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
  })
})
