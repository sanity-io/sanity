import {type SanityDocument} from '@sanity/client'
import {Checkbox} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {type MouseEvent, useCallback} from 'react'

export function DocumentSheetListSelect(props: CellContext<SanityDocument, unknown>) {
  const {row, table} = props

  const {selectedAnchor, setSelectedAnchor} = table.options.meta || {}

  const handleOnClick = useCallback(
    (e: MouseEvent<HTMLInputElement>) => {
      if (e.shiftKey && selectedAnchor !== null && selectedAnchor !== undefined) {
        const shiftClickIndex = row.index
        const lowerIndex = shiftClickIndex < selectedAnchor ? shiftClickIndex : selectedAnchor
        const upperIndex = shiftClickIndex < selectedAnchor ? selectedAnchor : shiftClickIndex

        const additionalSelectedRows = Array.from(
          {length: upperIndex - lowerIndex + 1},
          (_, index) => lowerIndex + index,
        )

        const currentSelectedRows = table.getSelectedRowModel().rows.map(({index}) => index)
        table.setRowSelection(() =>
          [...additionalSelectedRows, ...currentSelectedRows].reduce(
            (nextSelectedRows, rowIndex) => ({...nextSelectedRows, [rowIndex]: true}),
            {},
          ),
        )
      } else if (setSelectedAnchor) {
        const isRowCurrentlySelected = row.getIsSelected()
        if (isRowCurrentlySelected) {
          // about to unselect so invalidate current anchor
          setSelectedAnchor(null)
        } else {
          // override anchor with new selection index
          setSelectedAnchor(row.index)
        }

        row.toggleSelected()
      }
    },
    [selectedAnchor, row, setSelectedAnchor, table],
  )

  return (
    <Checkbox
      style={{paddingLeft: 4}}
      checked={props.row.getIsSelected()}
      disabled={!props.row.getCanSelect()}
      // onChange doesn't have shiftKey in event, but want to control this checkbox
      // need to define noop onChange to suppress the warning
      // eslint-disable-next-line react/jsx-no-bind
      onChange={() => null}
      onClick={handleOnClick}
    />
  )
}
