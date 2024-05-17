import {type SanityDocument} from '@sanity/client'
import {Checkbox} from '@sanity/ui'
import {type CellContext} from '@tanstack/react-table'
import {type MouseEvent, useCallback} from 'react'

export function DocumentSheetListSelect(props: CellContext<SanityDocument, unknown>) {
  const {hasAnchorSelected, setHasAnchorSelected} = props.table.options.meta || {}

  const handleOnClick = useCallback(
    (e: MouseEvent<HTMLInputElement>) => {
      if (e.shiftKey && hasAnchorSelected !== null) {
        const shiftClickIndex = props.row.index
        const lowerIndex = shiftClickIndex < hasAnchorSelected ? shiftClickIndex : hasAnchorSelected
        const upperIndex = shiftClickIndex < hasAnchorSelected ? hasAnchorSelected : shiftClickIndex

        const additionalSelectedRows: number[] = []
        for (
          let selectedRowIndex = lowerIndex;
          selectedRowIndex <= upperIndex;
          selectedRowIndex++
        ) {
          additionalSelectedRows.push(selectedRowIndex)
        }

        const currentSelectedRows = props.table.getSelectedRowModel().rows.map(({index}) => index)
        props.table.setRowSelection(() =>
          [...additionalSelectedRows, ...currentSelectedRows].reduce(
            (nextSelectedRows, rowIndex) => ({...nextSelectedRows, [rowIndex]: true}),
            {},
          ),
        )
      } else {
        const isRowCurrentlySelected = props.row.getIsSelected()
        if (!isRowCurrentlySelected) {
          // only track it if it is BEING selected
          setHasAnchorSelected(props.row.index)
        }

        if (isRowCurrentlySelected) {
          // you are about to unselect so that means that the anchor is no longer valid
          setHasAnchorSelected(null)
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
