import {useCallback} from 'react'
import {ArrayOfObjectsInputProps, ObjectItem} from '../../../types'

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useArrayFunctionHandlers<Item extends ObjectItem>(
  props: ArrayOfObjectsInputProps<Item>
) {
  const {onInsert} = props

  const handlePrepend = useCallback(
    (item: Item) => {
      onInsert({items: [item], position: 'before', referenceItem: 0})
    },
    [onInsert]
  )

  const handleAppend = useCallback(
    (item: Item) => {
      onInsert({items: [item], position: 'after', referenceItem: -1})
    },
    [onInsert]
  )

  return {
    handleAppend,
    handlePrepend,
  }
}
