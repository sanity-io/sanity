import {type ReactNode, useContext, useState} from 'react'

import {SheetListContext} from '../../../_singletons/structure/panes/document/DocumentSheetListContext'

interface SheetListProviderProps {
  children?: ReactNode
}

export interface SheetListContextValue {
  focusedCellId: string | null
  setFocusedCellId: (id: string | null, colId: string, rowIndex: number) => void
  onSelectedCellChange: (direction: string) => void
  selectedCellIndexes: number[]
  focusedCellDetails: {
    colId: string
    rowIndex: number
  } | null
}

export const useSheetListContext = () => {
  const context = useContext(SheetListContext)

  if (context === undefined) {
    throw new Error('useSheetListContext must be used within an SheetListProvider')
  }
  return context
}

export function SheetListProvider({children}: SheetListProviderProps) {
  const [focusedCellId, setFocusedCellId] = useState<string | null>(null)
  const [focusedCellDetails, setFocusedCellDetails] = useState<{
    colId: string
    rowIndex: number
  } | null>(null)
  const [selectedCellIndexes, setSelectedCellIndexes] = useState<number[]>([])

  const onSelectedCellChange = (direction: string) => {
    if (!focusedCellDetails) return

    if (direction === 'down') {
      setSelectedCellIndexes((prev) => [
        ...prev,
        ([...prev].reverse()[0] || focusedCellDetails?.rowIndex) + 1,
      ])
    }

    if (direction === 'up') {
      setSelectedCellIndexes((prev) => [...prev].slice(0, -1))
    }
  }

  const handleSetFocusedCellId = (id: string | null, colId: string, rowIndex: number) => {
    if (id === null) {
      setFocusedCellId(null)
      setFocusedCellDetails(null)
      setSelectedCellIndexes([])
      return
    }
    setFocusedCellId(id)
    setFocusedCellDetails({colId, rowIndex})
  }

  return (
    <SheetListContext.Provider
      value={{
        focusedCellId,
        focusedCellDetails,
        setFocusedCellId: handleSetFocusedCellId,
        onSelectedCellChange,
        selectedCellIndexes,
      }}
    >
      {children}
    </SheetListContext.Provider>
  )
}
