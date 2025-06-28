'use no memo'
// The `use no memo` directive is due to a known issue with react-table and react compiler: https://github.com/TanStack/table/issues/5567

import {Root} from '@sanity/ui'
import {type ColumnDef, useReactTable} from '@tanstack/react-table'
import {fireEvent, render, screen} from '@testing-library/react'
import {type SanityDocument} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

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

describe('ColumnsControl', () => {
  beforeEach(() => {
    render(
      <Root as="div">
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
      </Root>,
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should set default column visibilities', () => {
    fireEvent.click(screen.getByText('sheet-list.edit-columns'))
    expect(screen.getByRole('checkbox', {name: 'First Column'})).toBeChecked()
    expect(screen.getByRole('checkbox', {name: 'Nested First Column'})).toBeChecked()
    expect(screen.getByRole('checkbox', {name: 'Sixth Column'})).not.toBeChecked()
  })

  it('should not allow unhideable columns to be hidden', () => {
    fireEvent.click(screen.getByText('sheet-list.edit-columns'))
    expect(screen.queryByRole('checkbox', {name: 'Third Column'})).toBeNull()
  })

  it('should toggle column visibility', () => {
    fireEvent.click(screen.getByText('sheet-list.edit-columns'))
    fireEvent.click(screen.getByRole('checkbox', {name: 'First Column'}))
    expect(screen.getByRole('checkbox', {name: 'First Column'})).not.toBeChecked()
  })

  it('should not allow more than 5 columns to be visible', () => {
    fireEvent.click(screen.getByText('sheet-list.edit-columns'))

    expect(screen.getByRole('checkbox', {name: 'Sixth Column'})).toBeDisabled()
  })

  it('should not allow the last visible column to be hidden', () => {
    fireEvent.click(screen.getByText('sheet-list.edit-columns'))

    fireEvent.click(screen.getByRole('checkbox', {name: 'First Column'}))
    fireEvent.click(screen.getByRole('checkbox', {name: 'Second Column'}))
    fireEvent.click(screen.getByRole('checkbox', {name: 'Nested Second Column'}))
    fireEvent.click(screen.getByRole('checkbox', {name: 'Nested First Column'}))

    expect(screen.getByRole('checkbox', {name: 'Fifth Column'})).toBeDisabled()
  })

  it('should reset column visibility', () => {
    fireEvent.click(screen.getByText('sheet-list.edit-columns'))

    fireEvent.click(screen.getByRole('checkbox', {name: 'First Column'}))
    fireEvent.click(screen.getByRole('checkbox', {name: 'Second Column'}))
    fireEvent.click(screen.getByRole('checkbox', {name: 'Nested Second Column'}))
    fireEvent.click(screen.getByRole('checkbox', {name: 'Nested First Column'}))

    fireEvent.click(screen.getByText('sheet-list.reset-columns'))

    expect(screen.getByRole('checkbox', {name: 'First Column'})).toBeChecked()
    expect(screen.getByRole('checkbox', {name: 'Second Column'})).toBeChecked()
    expect(screen.getByRole('checkbox', {name: 'Nested Second Column'})).toBeChecked()
    expect(screen.getByRole('checkbox', {name: 'Nested First Column'})).toBeChecked()
  })
})
