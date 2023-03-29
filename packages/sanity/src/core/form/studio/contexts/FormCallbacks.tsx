/* eslint-disable react/no-unused-prop-types */
import {Path} from '@sanity/types'
import React, {memo, useCallback, useContext, useMemo, useRef} from 'react'
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
  const ref = useRef<FormCallbacksValue>(props)
  ref.current = props

  const transformPatches = useCallback(
    (patches: FormPatch[]) => {
      return ref.current?.transformPatches?.(patches) ?? []
    },
    [ref]
  )

  const onChange = useCallback((patchEvent: PatchEvent) => {
    ref.current.onChange(patchEvent)
  }, [])

  const onPathFocus = useCallback((path: Path) => {
    ref.current.onPathFocus(path)
  }, [])
  const onPathBlur = useCallback((path: Path) => {
    ref.current.onPathBlur(path)
  }, [])
  const onPathOpen = useCallback((path: Path) => {
    ref.current.onPathOpen(path)
  }, [])
  const onSetPathCollapsed = useCallback((path: Path, collapsed: boolean) => {
    ref.current.onSetPathCollapsed(path, collapsed)
  }, [])
  const onSetFieldSetCollapsed = useCallback((path: Path, collapsed: boolean) => {
    ref.current.onSetFieldSetCollapsed(path, collapsed)
  }, [])
  const onFieldGroupSelect = useCallback((path: Path, fieldGroupName: string) => {
    ref.current.onFieldGroupSelect(path, fieldGroupName)
  }, [])

  const contextValue: FormCallbacksValue = useMemo(
    () => ({
      transformPatches,
      onChange,
      onPathFocus,
      onPathBlur,
      onPathOpen,
      onSetPathCollapsed,
      onSetFieldSetCollapsed,
      onFieldGroupSelect,
    }),
    [
      onChange,
      onFieldGroupSelect,
      onPathBlur,
      onPathFocus,
      onPathOpen,
      onSetFieldSetCollapsed,
      onSetPathCollapsed,
      transformPatches,
    ]
  )

  return (
    <FormCallbacksContext.Provider value={contextValue}>
      {props.children}
    </FormCallbacksContext.Provider>
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
