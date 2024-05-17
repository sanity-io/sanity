import {type SanityDocument} from '@sanity/types'
import {type Table} from '@tanstack/react-table'
import {type ReactNode, useCallback, useContext, useMemo, useState} from 'react'

import {SheetListContext} from '../../../_singletons/structure/panes/document/DocumentSheetListContext'

interface SheetListProviderProps {
  children?: ReactNode
  table: Table<SanityDocument>
}

type SelectionDirection = 'down' | 'up' | 'left' | 'right'

export interface SheetListContextValue {
  setFocusedCellId: (colId: string, rowIndex: number) => void
  onSelectedCellChange: (direction: SelectionDirection) => void
  selectedCellIndexes: number[]
  resetFocusSelection: () => void
  focusedCellDetails: {
    colId: string
    rowIndex: number
  } | null
  resetSelection: () => void
}

export const useSheetListContext = (): SheetListContextValue => {
  const context = useContext(SheetListContext)

  if (context === undefined) {
    throw new Error('useSheetListContext must be used within an SheetListProvider')
  }
  return context
}

export function SheetListProvider({children, table}: SheetListProviderProps): ReactNode {
  const [focusedCellDetails, setFocusedCellDetails] = useState<{
    colId: string
    rowIndex: number
  } | null>(null)
  const [selectedCellIndexes, setSelectedCellIndexes] = useState<number[]>([])

  const handleSetFocusedCellId = useCallback((colId: string, rowIndex: number) => {
    setFocusedCellDetails({colId, rowIndex})
  }, [])

  const resetFocusSelection = useCallback(() => {
    setFocusedCellDetails(null)
    setSelectedCellIndexes([])
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedCellIndexes([])
  }, [])

  const moveHorizontal = useCallback(
    (direction: 'left' | 'right') => {
      const visibleColumns = table.getVisibleLeafColumns()
      const horizontallyMovedNextIndex =
        visibleColumns.findIndex((col) => col.id === focusedCellDetails?.colId) +
        (direction === 'left' ? -1 : 1)

      if (horizontallyMovedNextIndex < 0 || horizontallyMovedNextIndex >= visibleColumns.length)
        return

      handleSetFocusedCellId(
        visibleColumns[horizontallyMovedNextIndex].id,
        focusedCellDetails!.rowIndex,
      )
      resetSelection()
    },
    [focusedCellDetails, handleSetFocusedCellId, resetSelection, table],
  )

  const onSelectedCellChange = useCallback(
    (direction: SelectionDirection) => {
      if (!focusedCellDetails) return

      if (direction === 'left' || direction === 'right') {
        moveHorizontal(direction)
      } else {
        setSelectedCellIndexes((previousSelection) => {
          const selectionDirectionalChange = direction === 'down' ? 1 : -1
          // if no cells are selected, select the cell in the direction
          if (!previousSelection.length) {
            const firstSelectedIndex = focusedCellDetails.rowIndex + selectionDirectionalChange
            if (firstSelectedIndex < 0) return []
            return [firstSelectedIndex]
          }
          const lastIndexSelected = previousSelection[previousSelection.length - 1]
          const indexInDirectionFromLast = lastIndexSelected + selectionDirectionalChange

          // if the cell in the direction is out of bounds, return the previous selection
          if (indexInDirectionFromLast < 0) return previousSelection

          // if the cell in the direction is the same as the focused cell, deselect all cells
          if (indexInDirectionFromLast === focusedCellDetails?.rowIndex) {
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
    [focusedCellDetails, moveHorizontal],
  )

  const value = useMemo(
    () => ({
      focusedCellDetails,
      setFocusedCellId: handleSetFocusedCellId,
      onSelectedCellChange,
      selectedCellIndexes,
      resetFocusSelection,
      resetSelection,
    }),
    [
      focusedCellDetails,
      handleSetFocusedCellId,
      onSelectedCellChange,
      resetFocusSelection,
      resetSelection,
      selectedCellIndexes,
    ],
  )

  return <SheetListContext.Provider value={value}>{children}</SheetListContext.Provider>
}
