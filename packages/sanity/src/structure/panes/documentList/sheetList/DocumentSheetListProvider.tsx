import {type SanityDocument} from '@sanity/types'
import {type Table} from '@tanstack/react-table'
import {type ReactNode, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {DocumentSheetListContext} from 'sanity/_singletons'

interface DocumentSheetListProviderProps {
  children?: ReactNode
  table: Table<SanityDocument>
}

type SelectedCellDetails = {
  colId: string
  rowIndex: number
  state: 'focused' | 'selected'
} | null

/** @internal */
export interface DocumentSheetListContextValue {
  focusAnchorCell: () => void
  resetFocusSelection: () => void
  setSelectedAnchorCell: (colId: string, rowIndex: number) => void
  getStateByCellId: (
    colId: string,
    rowIndex: number,
  ) => 'focused' | 'selectedAnchor' | 'selectedRange' | null
  submitFocusedCell: () => void
}

/** @internal */
export const useDocumentSheetListContext = (): DocumentSheetListContextValue => {
  const context = useContext(DocumentSheetListContext)

  if (context === undefined) {
    throw new Error('useDocumentSheetListContext must be used within an DocumentSheetListProvider')
  }
  return context
}

/** @internal */
export function DocumentSheetListProvider({
  children,
  table,
}: DocumentSheetListProviderProps): ReactNode {
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

  const resetFocusSelection = useCallback(
    () => clearAndSetFocusSelection(),
    [clearAndSetFocusSelection],
  )

  const changeSelectionColumn = useCallback(
    (direction: 'left' | 'right') => {
      if (!selectedAnchorCellDetails) return

      const visibleColumns = table.getVisibleLeafColumns()
      const columnIndexAfterMove =
        visibleColumns.findIndex((col) => col.id === selectedAnchorCellDetails.colId) +
        (direction === 'left' ? -1 : 1)

      if (columnIndexAfterMove < 0 || columnIndexAfterMove >= visibleColumns.length) return

      clearAndSetFocusSelection({
        colId: visibleColumns[columnIndexAfterMove].id,
        rowIndex: selectedAnchorCellDetails.rowIndex,
        state: 'selected',
      })
    },
    [clearAndSetFocusSelection, selectedAnchorCellDetails, table],
  )

  const changeSelectionRange = useCallback(
    (direction: 'up' | 'down') => {
      if (!selectedAnchorCellDetails) return

      setSelectedRangeCellIndexes((previousSelection) => {
        const {rowIndex: anchorIndex} = selectedAnchorCellDetails
        const getNextIndex = (startingIndex: number) =>
          startingIndex + (direction === 'down' ? 1 : -1)
        // if no cells are selected, select the cell in the direction
        if (!previousSelection.length) {
          const firstSelectedIndex = getNextIndex(anchorIndex)
          if (firstSelectedIndex < 0) return []
          return [firstSelectedIndex]
        }
        const lastIndexSelected = previousSelection[previousSelection.length - 1]
        const nextIndex = getNextIndex(lastIndexSelected)

        // if the cell in the direction is out of bounds, return the previous selection
        if (nextIndex < 0) return previousSelection

        // if the cell in the direction is the same as the focused cell, deselect all cells
        if (nextIndex === anchorIndex) return []

        // if the cell in the direction is already selected, deselect the last selected cell
        if (previousSelection.includes(nextIndex)) {
          return previousSelection.slice(0, -1)
        }

        return [...previousSelection, nextIndex]
      })
    },
    [selectedAnchorCellDetails],
  )

  const setSelectedAnchorCell = useCallback(
    (colId: string, rowIndex: number) => {
      clearAndSetFocusSelection({colId, rowIndex, state: 'selected'})
    },
    [clearAndSetFocusSelection],
  )

  const handleEscapePress = useCallback(() => {
    if (!selectedAnchorCellDetails) return
    if (selectedRangeCellIndexes.length) {
      // only clear selected range if it exists
      setSelectedRangeCellIndexes([])
    } else {
      const nextAnchorCellDetails: SelectedCellDetails =
        selectedAnchorCellDetails.state === 'selected'
          ? null
          : {
              ...selectedAnchorCellDetails,
              state: 'selected',
            }
      clearAndSetFocusSelection(nextAnchorCellDetails)
    }
  }, [clearAndSetFocusSelection, selectedAnchorCellDetails, selectedRangeCellIndexes.length])

  const handleUpDownKey = useCallback(
    (isShiftKey: boolean, key: string) => {
      if (!selectedAnchorCellDetails) return

      const direction = key === 'ArrowDown' ? 'down' : 'up'
      const offset = direction === 'down' ? 1 : -1

      if (isShiftKey) {
        changeSelectionRange(direction)
      } else {
        const newSelectedCellRowIndex = selectedAnchorCellDetails.rowIndex + offset
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

      switch (key) {
        case 'Shift':
          break // shift allow should do nothing

        case 'Escape':
          handleEscapePress()
          break

        case 'ArrowDown':
        case 'ArrowUp':
          event.preventDefault()
          handleUpDownKey(shiftKey, key)
          break

        case 'ArrowLeft':
        case 'ArrowRight':
          // when cell is focused, arrows should have default behavior
          // only prevent default when cell is selected
          if (selectedAnchorCellDetails.state === 'selected') {
            event.preventDefault()
            changeSelectionColumn(key === 'ArrowLeft' ? 'left' : 'right')
          }
          break

        default:
          break
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

  useEffect(() => {
    if (selectedAnchorCellDetails) {
      document.addEventListener('keydown', handleAnchorKeydown)
      document.addEventListener('click', handleAnchorClick)
    }

    return () => {
      if (selectedAnchorCellDetails) {
        document.removeEventListener('keydown', handleAnchorKeydown)
        document.removeEventListener('click', handleAnchorClick)
      }
    }
  }, [handleAnchorClick, handleAnchorKeydown, selectedAnchorCellDetails])

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

  const submitFocusedCell = useCallback(() => {
    if (!selectedAnchorCellDetails) return

    clearAndSetFocusSelection({
      colId: selectedAnchorCellDetails.colId,
      rowIndex: selectedAnchorCellDetails.rowIndex + 1,
      state: 'selected',
    })
  }, [clearAndSetFocusSelection, selectedAnchorCellDetails])

  const value = useMemo<DocumentSheetListContextValue>(
    () => ({
      focusAnchorCell,
      resetFocusSelection,
      setSelectedAnchorCell,
      getStateByCellId,
      submitFocusedCell,
    }),
    [
      focusAnchorCell,
      resetFocusSelection,
      setSelectedAnchorCell,
      getStateByCellId,
      submitFocusedCell,
    ],
  )

  return (
    <DocumentSheetListContext.Provider value={value}>{children}</DocumentSheetListContext.Provider>
  )
}
