import {type SanityDocument} from '@sanity/types'
import {type Table} from '@tanstack/react-table'
import {type ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {SheetListContext} from 'sanity/_singletons'

interface SheetListProviderProps {
  children?: ReactNode
  table: Table<SanityDocument>
}

type SelectionDirection = 'down' | 'up' | 'left' | 'right'

type SelectedCellDetails = {
  colId: string
  rowIndex: number
  state: 'focused' | 'selected'
} | null

/** @internal */
export interface SheetListContextValue {
  focusAnchorCell: () => void
  resetFocusSelection: () => void
  setSelectedAnchorCell: (colId: string, rowIndex: number) => void
  getStateByCellId: (
    colId: string,
    rowIndex: number,
  ) => 'focused' | 'selectedAnchor' | 'selectedRange' | null
  submitChanges: () => void
}

/** @internal */
export const useSheetListContext = (): SheetListContextValue => {
  const context = useContext(SheetListContext)

  if (context === undefined) {
    throw new Error('useSheetListContext must be used within an SheetListProvider')
  }
  return context
}

export function SheetListProvider({children, table}: SheetListProviderProps): ReactNode {
  const [selectedAnchorCellDetails, setSelectedAnchorCellDetails] =
    useState<SelectedCellDetails>(null)
  const [selectedRangeCellIndexes, setSelectedRangeCellIndexes] = useState<number[]>([])

  const clearAndSetFocusSelection = useCallback(
    (nextAnchorDetails: SelectedCellDetails = null) => {
      if (
        selectedAnchorCellDetails?.state === 'focused' &&
        document.activeElement instanceof HTMLElement
      ) {
        document.activeElement.blur()
      }

      setSelectedAnchorCellDetails(nextAnchorDetails)
      setSelectedRangeCellIndexes([])
    },
    [selectedAnchorCellDetails],
  )

  const resetFocusSelection = useCallback(clearAndSetFocusSelection, [clearAndSetFocusSelection])

  const changeSelectionColumn = useCallback(
    (direction: 'left' | 'right') => {
      const visibleColumns = table.getVisibleLeafColumns()
      const columnIndexAfterMove =
        visibleColumns.findIndex((col) => col.id === selectedAnchorCellDetails?.colId) +
        (direction === 'left' ? -1 : 1)

      if (columnIndexAfterMove < 0 || columnIndexAfterMove >= visibleColumns.length) return

      clearAndSetFocusSelection({
        colId: visibleColumns[columnIndexAfterMove].id,
        rowIndex: selectedAnchorCellDetails!.rowIndex,
        state: 'selected',
      })
    },
    [clearAndSetFocusSelection, selectedAnchorCellDetails, table],
  )

  const changeSelectionRange = useCallback(
    (direction: SelectionDirection) => {
      if (!selectedAnchorCellDetails) return

      if (direction === 'left' || direction === 'right') {
        changeSelectionColumn(direction)
      } else {
        setSelectedRangeCellIndexes((previousSelection) => {
          const selectionDirectionalChange = direction === 'down' ? 1 : -1
          // if no cells are selected, select the cell in the direction
          if (!previousSelection.length) {
            const firstSelectedIndex =
              selectedAnchorCellDetails.rowIndex + selectionDirectionalChange
            if (firstSelectedIndex < 0) return []
            return [firstSelectedIndex]
          }
          const lastIndexSelected = previousSelection[previousSelection.length - 1]
          const indexInDirectionFromLast = lastIndexSelected + selectionDirectionalChange

          // if the cell in the direction is out of bounds, return the previous selection
          if (indexInDirectionFromLast < 0) return previousSelection

          // if the cell in the direction is the same as the focused cell, deselect all cells
          if (indexInDirectionFromLast === selectedAnchorCellDetails?.rowIndex) {
            return []
          }

          // if the cell in the direction is already selected, deselect the last selected cell
          if (previousSelection.includes(indexInDirectionFromLast)) {
            const nextSelection = [...previousSelection]
            nextSelection.pop()

            return nextSelection
          }

          return [...previousSelection, indexInDirectionFromLast]
        })
      }
    },
    [changeSelectionColumn, selectedAnchorCellDetails],
  )

  const setSelectedAnchorCell = useCallback(
    (colId: string, rowIndex: number) => {
      clearAndSetFocusSelection({colId, rowIndex, state: 'selected'})
    },
    [clearAndSetFocusSelection],
  )

  const handleEscapePress = useCallback(() => {
    if (selectedRangeCellIndexes.length) {
      // only clear selected range if it exists
      setSelectedRangeCellIndexes([])
    } else {
      const nextAnchorCellDetails: SelectedCellDetails =
        selectedAnchorCellDetails?.state === 'selected'
          ? null
          : {
              ...selectedAnchorCellDetails!,
              state: 'selected',
            }
      clearAndSetFocusSelection(nextAnchorCellDetails)
    }
  }, [clearAndSetFocusSelection, selectedAnchorCellDetails, selectedRangeCellIndexes.length])

  const handleUpDownKey = useCallback(
    (isShiftKey: boolean, key: string) => {
      if (!selectedAnchorCellDetails) return
      if (isShiftKey) {
        changeSelectionRange(key === 'ArrowDown' ? 'down' : 'up')
      } else {
        const newSelectedCellRowIndex =
          selectedAnchorCellDetails.rowIndex + (key === 'ArrowDown' ? 1 : -1)
        if (newSelectedCellRowIndex < 0) return

        setSelectedAnchorCell(selectedAnchorCellDetails.colId, newSelectedCellRowIndex)
      }
    },
    [changeSelectionRange, selectedAnchorCellDetails, setSelectedAnchorCell],
  )

  const handleAnchorKeydown = useCallback(
    (event: KeyboardEvent) => {
      if (!selectedAnchorCellDetails) return

      const {key, shiftKey} = event

      // if only shift key is pressed, do nothing
      if (key === 'Shift') return

      if (key === 'Escape') handleEscapePress()

      if (key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault()
        handleUpDownKey(shiftKey, key)
      }
      if (
        // when cell is focused, arrows should have default behavior
        selectedAnchorCellDetails?.state === 'selected' &&
        (key === 'ArrowLeft' || key === 'ArrowRight')
      ) {
        event.preventDefault()
        changeSelectionColumn(key === 'ArrowLeft' ? 'left' : 'right')
      }
    },
    [selectedAnchorCellDetails, handleEscapePress, handleUpDownKey, changeSelectionColumn],
  )

  const handleAnchorClick = useCallback(
    (event: MouseEvent) => {
      if (!selectedAnchorCellDetails) return
      const isClickInAnchorCell = document
        .getElementById(
          `cell-${selectedAnchorCellDetails.colId}-${selectedAnchorCellDetails.rowIndex}`,
        )
        ?.contains(event.target as Node)

      if (!isClickInAnchorCell) resetFocusSelection()
    },
    [resetFocusSelection, selectedAnchorCellDetails],
  )

  const handlePaste = useCallback(() => {}, [])

  useEffect(() => {
    if (selectedAnchorCellDetails) {
      document.addEventListener('keydown', handleAnchorKeydown)
      document.addEventListener('click', handleAnchorClick)
      document.addEventListener('paste', handlePaste)
    }

    return () => {
      if (selectedAnchorCellDetails) {
        document.removeEventListener('keydown', handleAnchorKeydown)
        document.removeEventListener('click', handleAnchorClick)
      }
    }
  }, [handleAnchorClick, handleAnchorKeydown, handlePaste, selectedAnchorCellDetails])

  const focusAnchorCell = useCallback(
    () =>
      setSelectedAnchorCellDetails((anchorCellDetails) => {
        if (!anchorCellDetails) return null

        return {...anchorCellDetails, state: 'focused'}
      }),
    [],
  )

  const getStateByCellId = useCallback(
    (colId: string, rowIndex: number) => {
      if (selectedAnchorCellDetails?.colId !== colId) return null

      if (selectedAnchorCellDetails.rowIndex === rowIndex)
        return selectedAnchorCellDetails.state === 'focused' ? 'focused' : 'selectedAnchor'

      if (selectedRangeCellIndexes.includes(rowIndex)) return 'selectedRange'

      return null
    },
    [selectedAnchorCellDetails, selectedRangeCellIndexes],
  )

  const submitChanges = useCallback(() => {
    if (!selectedAnchorCellDetails) return

    clearAndSetFocusSelection({
      colId: selectedAnchorCellDetails.colId,
      rowIndex: selectedAnchorCellDetails.rowIndex + 1,
      state: 'selected',
    })
  }, [clearAndSetFocusSelection, selectedAnchorCellDetails])

  const value = useMemo<SheetListContextValue>(
    () => ({
      focusAnchorCell,
      resetFocusSelection,
      setSelectedAnchorCell,
      getStateByCellId,
      submitChanges,
    }),
    [focusAnchorCell, resetFocusSelection, setSelectedAnchorCell, getStateByCellId, submitChanges],
  )

  return <SheetListContext.Provider value={value}>{children}</SheetListContext.Provider>
}
