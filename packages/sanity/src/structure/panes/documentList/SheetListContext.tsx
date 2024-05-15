import {type ReactNode, useCallback, useContext, useMemo, useState} from 'react'

import {SheetListContext} from '../../../_singletons/structure/panes/document/DocumentSheetListContext'

interface SheetListProviderProps {
  children?: ReactNode
}

type SelectionDirection = 'down' | 'up'

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

export const useSheetListContext = () => {
  const context = useContext(SheetListContext)

  if (context === undefined) {
    throw new Error('useSheetListContext must be used within an SheetListProvider')
  }
  return context
}

export function SheetListProvider({children}: SheetListProviderProps) {
  const [focusedCellDetails, setFocusedCellDetails] = useState<{
    colId: string
    rowIndex: number
  } | null>(null)
  const [selectedCellIndexes, setSelectedCellIndexes] = useState<number[]>([])

  const onSelectedCellChange = useCallback(
    (direction: SelectionDirection) => {
      if (!focusedCellDetails) return

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
    },
    [focusedCellDetails],
  )

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
