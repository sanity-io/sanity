/* eslint-disable react/no-unused-prop-types */
import {Path} from '@sanity/types'
import React, {memo, useContext} from 'react'
import {PatchEvent} from '../../patch'

interface FormCallbacksValue {
  onChange: (patchEvent: PatchEvent) => void
  onPathFocus: (path: Path) => void
  onPathBlur: (path: Path) => void
  onPathOpen: (path: Path) => void
  onSetPathCollapsed: (path: Path, collapsed: boolean) => void
  onSetFieldSetCollapsed: (path: Path, collapsed: boolean) => void
  onFieldGroupSelect: (path: Path, fieldGroupName: string) => void
}

const FormCallbacksContext = React.createContext<FormCallbacksValue | null>(null)

export const FormCallbacksProvider = memo(function FormCallbacksProvider(
  props: FormCallbacksValue & {children: React.ReactNode}
) {
  return (
    <FormCallbacksContext.Provider value={props}>{props.children}</FormCallbacksContext.Provider>
  )
})

export function useFormCallbacks(): FormCallbacksValue {
  const ctx = useContext(FormCallbacksContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  return ctx
}
