import {type SanityDocument} from '@sanity/types'
import {Root} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {fireEvent, render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {DocumentSheetListSelect} from '../DocumentSheetListSelect'

const mockToggleSelected = vi.fn()
const mockSetSelectedAnchor = vi.fn()
const mockSetRowSelection = vi.fn()

const props = {
  table: {
    getSelectedRowModel: () => ({rows: [{id: 'id-100'}, {id: 'id-122'}]}),
    setRowSelection: mockSetRowSelection,
    getRowModel: () => ({
      flatRows: [{id: 'id-0'}, {id: 'id-120'}, {id: 'id-121'}, {id: 'id-123'}],
    }),

    options: {
      meta: {
        selectedAnchor: null,
        setSelectedAnchor: mockSetSelectedAnchor,
      },
    },
  },
  row: {
    index: 3,
    getCanSelect: () => true,
    getIsSelected: () => null,
    toggleSelected: mockToggleSelected,
  },
} as unknown as CellContext<SanityDocument, unknown>

const renderTest = (renderProps?: Partial<CellContext<SanityDocument, unknown>>) =>
  render(
    <Root as="div">
      <DocumentSheetListSelect {...{...props, ...renderProps}} />
    </Root>,
  )

describe('DocumentSheetListSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('selects only current checkbox if shift key is not pressed', async () => {
    renderTest()

    const checkbox = screen.getByRole('checkbox')

    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)
    expect(mockToggleSelected).toHaveBeenCalledTimes(1)
    expect(mockSetSelectedAnchor).toHaveBeenCalledWith(3)
  })

  it('unselected current checkbox', async () => {
    const selectProps = {
      ...props,
      row: {...props.row, getIsSelected: () => true},
    }
    renderTest(selectProps)

    const checkbox = screen.getByRole('checkbox')

    expect(checkbox).toBeChecked()

    fireEvent.click(checkbox)
    expect(mockToggleSelected).toHaveBeenCalledTimes(1)
    expect(selectProps.table.options.meta?.setSelectedAnchor).toHaveBeenCalledWith(null)
  })

  it('disables the checkbox when row is not selectable', () => {
    const selectProps = {...props, row: {...props.row, getCanSelect: () => false}}
    renderTest(selectProps)

    const checkbox = screen.getByRole('checkbox')

    expect(checkbox).toBeDisabled()

    fireEvent.click(checkbox)
    expect(mockToggleSelected).not.toHaveBeenCalled()
  })

  it('resets the select anchor if shift not pressed on check', () => {
    const selectProps = {...props}
    selectProps.table.options.meta!.selectedAnchor = 5
    renderTest(selectProps)

    const checkbox = screen.getByRole('checkbox')

    fireEvent.click(checkbox)
    expect(mockSetSelectedAnchor).toHaveBeenCalledWith(3)
  })

  it('selects multiple rows when shift key is pressed and anchor exists', () => {
    const selectProps = {...props}
    selectProps.table.options.meta!.selectedAnchor = 1
    renderTest(selectProps)

    const checkbox = screen.getByRole('checkbox')

    fireEvent.click(checkbox, {shiftKey: true})
    const setRowSelectionCall = mockSetRowSelection.mock.calls[0][0] as () => unknown
    expect(setRowSelectionCall()).toEqual({
      'id-100': true,
      'id-120': true,
      'id-121': true,
      'id-122': true,
      'id-123': true,
    })
  })
})
