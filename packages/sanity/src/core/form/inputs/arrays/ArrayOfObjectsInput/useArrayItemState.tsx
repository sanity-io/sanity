import {SchemaType} from '@sanity/types'
import {useCallback, useRef} from 'react'
import {ObjectItem, ObjectItemProps} from '../../../types'
import {FIXME} from '../../../../FIXME'
import {useScrollIntoViewOnFocusWithin} from '../../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {randomKey} from '../../../utils/randomKey'
import {useChildPresence} from '../../../studio/contexts/Presence'
import {useChildValidation} from '../../../studio/contexts/Validation'
import {createProtoArrayValue} from './createProtoArrayValue'

/**
 * @internal
 */
export function useArrayItemState<Item extends ObjectItem = ObjectItem>(
  props: Omit<ObjectItemProps<Item>, 'renderDefault'>
) {
  const {parentSchemaType, path, value, open, onInsert, focused} = props

  const sortable = parentSchemaType.options?.sortable !== false
  const insertableTypes = parentSchemaType.of

  const previewCardRef = useRef<FIXME | null>(null)

  // this is here to make sure the item is visible if it's being edited behind a modal
  useScrollIntoViewOnFocusWithin(previewCardRef, open)

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus && previewCardRef.current) {
      // Note: if editing an inline item, focus is handled by the item input itself and no ref is being set
      previewCardRef.current?.focus()
    }
  })

  const resolvingInitialValue = (value as any)._resolvingInitialValue

  const handleDuplicate = useCallback(() => {
    onInsert({
      items: [{...value, _key: randomKey()}],
      position: 'after',
    })
  }, [onInsert, value])

  const handleInsert = useCallback(
    (pos: 'before' | 'after', insertType: SchemaType) => {
      onInsert({
        items: [createProtoArrayValue(insertType)],
        position: pos,
      })
    },
    [onInsert]
  )

  const childPresence = useChildPresence(path, true)
  const childValidation = useChildValidation(path, true)
  return {
    sortable,
    insertableTypes,
    resolvingInitialValue,
    handleDuplicate,
    handleInsert,
    childPresence,
    childValidation,
    previewCardRef,
  }
}
