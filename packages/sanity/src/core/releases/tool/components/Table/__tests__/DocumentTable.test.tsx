import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {setupVirtualListEnv} from '../../../../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {DocumentTable, type DocumentTableSelection} from '../DocumentTable'
import {type Column} from '../types'

interface Row {
  _id: string
  title: string
}

const ROWS: Row[] = [
  {_id: 'doc-1', title: 'First document'},
  {_id: 'doc-2', title: 'Second document'},
  {_id: 'doc-3', title: 'Third document'},
]

const columnDefs: Column<Row>[] = [
  {
    id: 'title',
    width: 200,
    sorting: false,
    header: () => <>Title</>,
    cell: ({datum}) => <span>{datum.title}</span>,
  },
]

setupVirtualListEnv()

function renderTable(
  props: {
    rows?: Row[]
    selection?: DocumentTableSelection<Row>
  } = {},
) {
  const {rows = ROWS, selection} = props

  return (
    <DocumentTable<Row>
      alwaysShowCommandLane
      columnDefs={columnDefs}
      emptyState="No documents"
      getRowKey={(row) => row._id}
      rowId="_id"
      rows={rows}
      searchPlaceholder="Search"
      searchPredicate={(row, term) => row.title.toLowerCase().includes(term.toLowerCase())}
      selection={selection}
    />
  )
}

const buildSelection = (
  overrides: Partial<DocumentTableSelection<Row>> = {},
): DocumentTableSelection<Row> => ({
  labels: {
    selectAll: 'Select all',
    selectRow: 'Select row',
    selectedCount: (count) => `${count} selected`,
    clear: 'Clear',
  },
  selectAllTestId: 'test-select-all',
  renderActions: ({selectedKeys}) => (
    <button data-testid="test-bulk-action" type="button">
      Act on {selectedKeys.length}
    </button>
  ),
  ...overrides,
})

describe('DocumentTable selection', () => {
  const renderWithProvider = async (props: Parameters<typeof renderTable>[0]) => {
    const wrapper = await createTestProvider()
    return render(renderTable(props), {wrapper})
  }

  it('renders rows with no selection toolbar when selection is idle', async () => {
    await renderWithProvider({selection: buildSelection()})

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(3)
    })

    expect(screen.getByTestId('test-select-all')).toBeInTheDocument()
    expect(screen.queryByTestId('document-table-selected-count')).not.toBeInTheDocument()
    expect(screen.queryByTestId('document-table-clear-selection')).not.toBeInTheDocument()
  })

  it('selects all rows when the select-all checkbox is clicked', async () => {
    const user = userEvent.setup()
    await renderWithProvider({selection: buildSelection()})

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(3)
    })

    await user.click(screen.getByTestId('test-select-all'))

    expect(await screen.findByTestId('document-table-selected-count')).toHaveTextContent(
      '3 selected',
    )
    expect(screen.getByTestId('test-bulk-action')).toHaveTextContent('Act on 3')
    expect(screen.getByTestId('document-table-clear-selection')).toBeInTheDocument()
  })

  it('clears the selection when Clear is clicked', async () => {
    const user = userEvent.setup()
    await renderWithProvider({selection: buildSelection()})

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(3)
    })

    await user.click(screen.getByTestId('test-select-all'))
    await screen.findByTestId('document-table-selected-count')

    await user.click(screen.getByTestId('document-table-clear-selection'))

    await waitFor(() => {
      expect(screen.queryByTestId('document-table-selected-count')).not.toBeInTheDocument()
    })
    expect(screen.queryByTestId('test-bulk-action')).not.toBeInTheDocument()
    expect(screen.getByTestId('test-select-all')).toBeInTheDocument()
  })

  it('excludes non-selectable rows from select-all via isRowSelectable', async () => {
    const user = userEvent.setup()
    await renderWithProvider({
      selection: buildSelection({
        isRowSelectable: (row) => row._id !== 'doc-2',
      }),
    })

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(3)
    })

    await user.click(screen.getByTestId('test-select-all'))

    expect(await screen.findByTestId('document-table-selected-count')).toHaveTextContent(
      '2 selected',
    )
    expect(screen.getByTestId('test-bulk-action')).toHaveTextContent('Act on 2')
  })
})
