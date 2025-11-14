import {studioTheme, ThemeProvider} from '@sanity/ui'
import {type ColumnDef, useReactTable} from '@tanstack/react-table'
import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type SanityDocument} from 'sanity'
import {describe, expect, it} from 'vitest'

import {ColumnsControl} from '../ColumnsControl'

const TableHarness = ({columns}: {columns: ColumnDef<SanityDocument>[]}) => {
  const initialVisibilityState = {
    'First Column': true,
    'Second Column': true,
    'Third Column': true,
    'Nested First Column': true,
    'Nested Second Column': true,
    'Fifth Column': true,
    'Sixth Column': false,
  }
  const table = useReactTable<SanityDocument>({
    columns,
    data: [],
    getCoreRowModel: () => {
      throw new Error('getCoreRowModel not implemented.')
    },
    initialState: {
      columnVisibility: initialVisibilityState,
    },
  })

  return <ColumnsControl table={table} />
}

const renderTest = async () => {
  return render(
    <ThemeProvider theme={studioTheme}>
      <TableHarness
        columns={[
          {header: 'First Column', enableHiding: true},
          {header: 'Second Column', enableHiding: true},
          {header: 'Third Column', enableHiding: false},
          {
            header: 'Fourth Column',
            enableHiding: true,
            columns: [
              {header: 'Nested First Column', enableHiding: true},
              {header: 'Nested Second Column', enableHiding: true},
            ],
          },
          {header: 'Fifth Column', enableHiding: true},
          {header: 'Sixth Column', enableHiding: true},
        ]}
      />
    </ThemeProvider>,
  )
}

const openColumnsMenu = async () => {
  await userEvent.click(screen.getByRole('button', {name: 'sheet-list.edit-columns'}))

  const menu = await waitFor(() => {
    const element = document.querySelector('[role="menu"]') as HTMLElement | null

    if (!element) {
      throw new Error('Menu not rendered yet')
    }

    return element
  })

  return menu
}

describe('ColumnsControl', () => {
  it('should set default column visibilities', async () => {
    await renderTest()

    const menu = await openColumnsMenu()

    expect(within(menu).getByLabelText('First Column')).toBeChecked()
    expect(within(menu).getByLabelText('Nested First Column')).toBeChecked()
    expect(within(menu).getByLabelText('Sixth Column')).not.toBeChecked()
  })

  it('should not allow unhideable columns to be hidden', async () => {
    await renderTest()

    const menu = await openColumnsMenu()
    expect(within(menu).queryByLabelText('Third Column')).toBeNull()
  })

  it('should toggle column visibility', async () => {
    await renderTest()

    const menu = await openColumnsMenu()
    const firstColumn = within(menu).getByLabelText('First Column')
    await userEvent.click(firstColumn)
    expect(within(menu).getByLabelText('First Column')).not.toBeChecked()
  })

  it('should not allow more than 5 columns to be visible', async () => {
    await renderTest()

    const menu = await openColumnsMenu()

    expect(within(menu).getByLabelText('Sixth Column')).toBeDisabled()
  })

  it('should not allow the last visible column to be hidden', async () => {
    await renderTest()

    const menu = await openColumnsMenu()

    await userEvent.click(within(menu).getByLabelText('First Column'))
    await userEvent.click(within(menu).getByLabelText('Second Column'))
    await userEvent.click(within(menu).getByLabelText('Nested Second Column'))
    await userEvent.click(within(menu).getByLabelText('Nested First Column'))

    expect(within(menu).getByLabelText('Fifth Column')).toBeDisabled()
  })

  it('should reset column visibility', async () => {
    await renderTest()

    const menu = await openColumnsMenu()

    await userEvent.click(within(menu).getByLabelText('First Column'))
    await userEvent.click(within(menu).getByLabelText('Second Column'))
    await userEvent.click(within(menu).getByLabelText('Nested Second Column'))
    await userEvent.click(within(menu).getByLabelText('Nested First Column'))

    await userEvent.click(within(menu).getByText('sheet-list.reset-columns'))

    expect(within(menu).getByLabelText('First Column')).toBeChecked()
    expect(within(menu).getByLabelText('Second Column')).toBeChecked()
    expect(within(menu).getByLabelText('Nested Second Column')).toBeChecked()
    expect(within(menu).getByLabelText('Nested First Column')).toBeChecked()
  })
})
