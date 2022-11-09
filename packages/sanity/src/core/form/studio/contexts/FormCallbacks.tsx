/* eslint-disable react/no-unused-prop-types */
import {Path} from '@sanity/types'
import React, {memo, useContext} from 'react'
import {FormPatch, PatchEvent} from '../../patch'

/** @internal */
export interface FormCallbacksValue {
  transformPatches?: (patches: FormPatch[]) => FormPatch[]
  onChange: (patchEvent: PatchEvent) => void
  onPathFocus: (path: Path) => void
  onPathBlur: (path: Path) => void
  onPathOpen: (path: Path) => void
  onSetPathCollapsed: (path: Path, collapsed: boolean) => void
  onSetFieldSetCollapsed: (path: Path, collapsed: boolean) => void
  onFieldGroupSelect: (path: Path, fieldGroupName: string) => void
}

/**
 * @internal
 */
export const FormCallbacksContext = React.createContext<FormCallbacksValue | null>(null)

/** @internal */
export const FormCallbacksProvider = memo(function FormCallbacksProvider(
  props: FormCallbacksValue & {children: React.ReactNode}
) {
  return (
    <FormCallbacksContext.Provider value={props}>{props.children}</FormCallbacksContext.Provider>
  )
})

/** @internal */
export function useFormCallbacks(): FormCallbacksValue {
  const ctx = useContext(FormCallbacksContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  return ctx
}
