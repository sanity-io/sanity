import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {type SanityDocument} from '@sanity/types'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {fireEvent, render, screen} from '@testing-library/react'

import {DocumentSheetListSelect} from '../DocumentSheetListSelect'

const mockToggleSelected = jest.fn()
const mockSetHasAnchorSelected = jest.fn()
const mockSetRowSelection = jest.fn()

const props = {
  table: {
    getSelectedRowModel: () => ({rows: [{index: 100}, {index: 122}]}),
    setRowSelection: mockSetRowSelection,

    options: {
      meta: {
        hasAnchorSelected: null,
        setHasAnchorSelected: mockSetHasAnchorSelected,
      },
    },
  },
  row: {
    index: 123,
    getCanSelect: () => true,
    getIsSelected: () => null,
    toggleSelected: mockToggleSelected,
  },
} as unknown as CellContext<SanityDocument, unknown>

const renderTest = (renderProps?: Partial<CellContext<SanityDocument, unknown>>) =>
  render(
    <ThemeProvider theme={studioTheme}>
      <DocumentSheetListSelect {...{...props, ...(renderProps || {})}} />
    </ThemeProvider>,
  )

describe('DocumentSheetListSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('selects only current checkbox if shift key is not pressed', async () => {
    renderTest()

    const checkbox = screen.getByRole('checkbox')

    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)
    expect(mockToggleSelected).toHaveBeenCalledTimes(1)
    expect(mockSetHasAnchorSelected).toHaveBeenCalledWith(123)
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
    expect(selectProps.table.options.meta?.setHasAnchorSelected).toHaveBeenCalledWith(null)
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
    selectProps.table.options.meta!.hasAnchorSelected = 321
    renderTest(selectProps)

    const checkbox = screen.getByRole('checkbox')

    fireEvent.click(checkbox)
    expect(mockSetHasAnchorSelected).toHaveBeenCalledWith(123)
  })

  it('selects multiple rows when shift key is pressed and anchor exists', () => {
    const selectProps = {...props}
    selectProps.table.options.meta!.hasAnchorSelected = 120
    renderTest(selectProps)

    const checkbox = screen.getByRole('checkbox')

    fireEvent.click(checkbox, {shiftKey: true})
    const setRowSelectionCall = mockSetRowSelection.mock.calls[0][0] as () => unknown
    expect(setRowSelectionCall()).toEqual({100: true, 120: true, 121: true, 122: true, 123: true})
  })
})
