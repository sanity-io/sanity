import {type SanityDocument} from '@sanity/client'
import {Checkbox} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {type MouseEvent, useCallback} from 'react'

export function DocumentSheetListSelect(props: CellContext<SanityDocument, unknown>) {
  const {hasAnchorSelected, setHasAnchorSelected} = props.table.options.meta || {}

  const handleOnClick = useCallback(
    (e: MouseEvent<HTMLInputElement>) => {
      if (e.shiftKey && hasAnchorSelected !== null && hasAnchorSelected !== undefined) {
        const shiftClickIndex = props.row.index
        const lowerIndex = shiftClickIndex < hasAnchorSelected ? shiftClickIndex : hasAnchorSelected
        const upperIndex = shiftClickIndex < hasAnchorSelected ? hasAnchorSelected : shiftClickIndex

        const additionalSelectedRows = Array.from(
          {length: upperIndex - lowerIndex + 1},
          (_, index) => lowerIndex + index,
        )

        const currentSelectedRows = props.table.getSelectedRowModel().rows.map(({index}) => index)
        props.table.setRowSelection(() =>
          [...additionalSelectedRows, ...currentSelectedRows].reduce(
            (nextSelectedRows, rowIndex) => ({...nextSelectedRows, [rowIndex]: true}),
            {},
          ),
        )
      } else {
        if (setHasAnchorSelected) {
          const isRowCurrentlySelected = props.row.getIsSelected()
          if (!isRowCurrentlySelected) {
            // override anchor with new selection index
            setHasAnchorSelected(props.row.index)
          }

          if (isRowCurrentlySelected) {
            // about to unselect so invalidate current anchor
            setHasAnchorSelected(null)
          }
        }

        props.row.toggleSelected()
      }
    },
    [hasAnchorSelected, props.row, props.table, setHasAnchorSelected],
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
