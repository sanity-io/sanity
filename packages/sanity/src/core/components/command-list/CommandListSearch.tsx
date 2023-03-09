import React, {HTMLProps, useMemo} from 'react'
import {TextInput, TextInputProps} from '@sanity/ui'
import {useCommandList} from './context'
import {createControlElementId, createListItemId} from './utils'

export const CommandListSearch = React.forwardRef(function CommandListSearch(
  props: TextInputProps & HTMLProps<HTMLInputElement>,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const {activeIndex, commandListId} = useCommandList()
  const ariaControls = useMemo(() => createControlElementId(commandListId), [commandListId])
  const ariaActiveDescendant = useMemo(
    () => createListItemId(commandListId, activeIndex),
    [commandListId, activeIndex]
  )

  return (
    <TextInput
      {...props}
      ref={ref}
      aria-activedescendant={ariaActiveDescendant}
      aria-controls={ariaControls}
      role="combobox"
    />
  )
})
