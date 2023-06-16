import {Popover, PopoverProps} from '@sanity/ui'
import React, {ForwardedRef, PropsWithChildren, createContext, forwardRef, useContext} from 'react'

const FormPopoverContext = createContext<{
  formElement: HTMLDivElement | null
} | null>(null)

export function FormPopoverProvider(props: PropsWithChildren<{formElement: HTMLDivElement}>) {
  const {children, formElement} = props

  return <FormPopoverContext.Provider value={{formElement}}>{children}</FormPopoverContext.Provider>
}

export const FormPopover = forwardRef(function FormPopover(
  props: PopoverProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {formElement} = useContext(FormPopoverContext) || {}
  // listen to any changes to the form element

  return <Popover {...props} ref={ref} />
})
