import {afterEach} from 'node:test'

import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {useReactTable} from '@tanstack/react-table'
import {fireEvent, render, screen} from '@testing-library/react'
import {type SanityDocument} from 'sanity'

import {ColumnsControl} from '../ColumnsControl'

const TableHarness = ({columns}) => {
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

  return <ColumnsControl table={table} initialState={initialVisibilityState} />
}

describe('ColumnsControl', () => {
  beforeEach(() => {
    render(
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
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should set default column visibilities', () => {
    fireEvent.click(screen.getByText('Columns'))
    expect(screen.getByRole('checkbox', {name: 'First Column'})).toBeChecked()
    expect(screen.getByRole('checkbox', {name: 'Nested First Column'})).toBeChecked()
    expect(screen.getByRole('checkbox', {name: 'Sixth Column'})).not.toBeChecked()
  })

  it('should not allow unhideable columns to be hidden', () => {
    fireEvent.click(screen.getByText('Columns'))
    expect(screen.queryByRole('checkbox', {name: 'Third Column'})).toBeNull()
  })

  it('should toggle column visibility', () => {
    fireEvent.click(screen.getByText('Columns'))
    fireEvent.click(screen.getByRole('checkbox', {name: 'First Column'}))
    expect(screen.getByRole('checkbox', {name: 'First Column'})).not.toBeChecked()
  })

  it('should not allow more than 5 columns to be visible', () => {
    fireEvent.click(screen.getByText('Columns'))

    expect(screen.getByRole('checkbox', {name: 'Sixth Column'})).toBeDisabled()
    screen.getByText('You may only have 5 columns visible')
  })

  it('should not allow the last visible column to be hidden', () => {
    fireEvent.click(screen.getByText('Columns'))

    fireEvent.click(screen.getByRole('checkbox', {name: 'First Column'}))
    fireEvent.click(screen.getByRole('checkbox', {name: 'Second Column'}))
    fireEvent.click(screen.getByRole('checkbox', {name: 'Nested Second Column'}))
    fireEvent.click(screen.getByRole('checkbox', {name: 'Nested First Column'}))

    expect(screen.getByRole('checkbox', {name: 'Fifth Column'})).toBeDisabled()
  })
})
