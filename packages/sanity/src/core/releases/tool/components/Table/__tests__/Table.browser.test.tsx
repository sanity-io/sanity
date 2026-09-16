import {Text, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {useState} from 'react'
import {Flex} from 'ui5'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'

import {Table} from '../Table'
import {Headers} from '../TableHeader'
import {type Column} from '../types'

interface Datum {
  id: string
  title: string
}

interface TableHarnessProps {
  containerWidth?: number
  showRowActions?: boolean
}

const data: Datum[] = Array.from({length: 4}, (_, index) => ({
  id: `doc-${index}`,
  title: `Document ${index}`,
}))

function createColumns(showRowActions: boolean): Column<Datum>[] {
  const titleColumn: Column<Datum> = {
    id: 'title',
    width: null,
    style: showRowActions ? {minWidth: 200} : undefined,
    header: (props) => (
      <Flex {...props.headerProps} flexBasis="0%" flexGrow={1} paddingY={3}>
        <Headers.BasicHeader text="Title" />
      </Flex>
    ),
    cell: ({cellProps, datum}) => (
      <Flex alignItems="center" flexBasis="0%" flexGrow={1} paddingX={2} {...cellProps}>
        <Text size={1}>{datum.title}</Text>
      </Flex>
    ),
  }

  if (!showRowActions) {
    return [titleColumn]
  }

  return [
    titleColumn,
    {
      id: 'when',
      width: 280,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3}>
          <Headers.BasicHeader text="When" />
        </Flex>
      ),
      cell: ({cellProps}) => (
        <Flex alignItems="center" paddingX={2} {...cellProps}>
          <Text size={1}>As soon as possible</Text>
        </Flex>
      ),
    },
    {
      id: 'edited',
      width: 150,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3}>
          <Headers.BasicHeader text="Edited" />
        </Flex>
      ),
      cell: ({cellProps}) => (
        <Flex alignItems="center" paddingX={2} {...cellProps}>
          <Text size={1}>5 days ago</Text>
        </Flex>
      ),
    },
    {
      id: 'error',
      width: 40,
      header: ({headerProps}) => <Flex {...headerProps} paddingY={3} />,
      cell: ({cellProps}) => <Flex {...cellProps} paddingX={2} paddingY={3} />,
    },
    {
      id: 'documents',
      width: 120,
      header: (props) => (
        <Flex {...props.headerProps} paddingY={3}>
          <Headers.BasicHeader text="Documents" />
        </Flex>
      ),
      cell: ({cellProps}) => (
        <Flex alignItems="center" paddingX={2} {...cellProps}>
          <Text size={1}>12</Text>
        </Flex>
      ),
    },
  ]
}

const theme = buildTheme()

function TableHarness({containerWidth, showRowActions = false}: TableHarnessProps = {}) {
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
  const columns = createColumns(showRowActions)

  return (
    <ThemeProvider theme={theme}>
      <div
        ref={setScrollContainer}
        data-testid="table-scroll-container"
        style={{height: '400px', width: containerWidth, overflow: 'auto'}}
      >
        <Table<Datum>
          data={data}
          emptyState="No documents"
          rowId="id"
          columnDefs={columns}
          scrollContainerRef={scrollContainer}
          hideTableInlinePadding={showRowActions}
          rowActions={
            showRowActions
              ? () => (
                  <button
                    type="button"
                    data-testid="release-menu-button"
                    style={{width: 25, height: 25, padding: 0, border: 0, boxSizing: 'border-box'}}
                  >
                    ...
                  </button>
                )
              : undefined
          }
        />
      </div>
    </ThemeProvider>
  )
}

describe('Table (virtualized)', () => {
  // Regression test for SAPP-3955: WebKit doesn't support `position: relative`
  // on internal table boxes (https://bugs.webkit.org/show_bug.cgi?id=240961),
  // so without `display: block` on the tbody the absolutely positioned rows
  // resolve their containing block above the table, shifting every row up by
  // one header height and hiding the first row behind the sticky header.
  it('positions all rows below the sticky header', async () => {
    void render(<TableHarness />)

    await expect.poll(() => document.querySelectorAll('[data-testid="table-row"]').length).toBe(4)

    const thead = document.querySelector('thead')!
    const rows = [...document.querySelectorAll('[data-testid="table-row"]')]

    const theadBottom = thead.getBoundingClientRect().bottom
    for (const row of rows) {
      expect(row.getBoundingClientRect().top).toBeGreaterThanOrEqual(theadBottom - 1)
    }

    // The first row must actually be hit-testable, not painted under the header
    const firstRow = rows.find((row) => row.textContent?.includes('Document 0'))!
    const rect = firstRow.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    expect(firstRow.contains(hit)).toBe(true)
  })

  it('keeps the row-action button fully visible at a constrained desktop width', async () => {
    void render(<TableHarness containerWidth={1100} showRowActions />)

    await expect.poll(() => document.querySelectorAll('[data-testid="table-row"]').length).toBe(4)

    const container = document.querySelector('[data-testid="table-scroll-container"]')
    const button = document.querySelector('[data-testid="release-menu-button"]')
    expect(container).toBeTruthy()
    expect(button).toBeTruthy()

    const containerRect = container!.getBoundingClientRect()
    const buttonRect = button!.getBoundingClientRect()

    expect(buttonRect.right).toBeLessThanOrEqual(containerRect.right + 1)
    expect(buttonRect.left).toBeGreaterThanOrEqual(containerRect.left - 1)
    expect(container!.scrollWidth).toBeLessThanOrEqual(container!.clientWidth + 1)
  })
})
