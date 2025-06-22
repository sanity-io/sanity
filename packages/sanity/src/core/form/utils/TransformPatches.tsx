import {memo, type ReactNode, useCallback, useMemo} from 'react'
import {FormCallbacksContext} from 'sanity/_singletons'

import type {FormPatch} from '../patch/types'
import {PatchEvent} from '../patch/PatchEvent'
import {useFormCallbacks} from '../studio/contexts/FormCallbacks'

type PatchTransformer = (patches: FormPatch[]) => FormPatch[]

/**
 * @hidden
 * @beta */
export const TransformPatches = memo(function OnChangeProvider(
  props: {transform: PatchTransformer} & {children: ReactNode},
) {
  const {transform} = props
  const callbacks = useFormCallbacks()

  const handleChange = useCallback(
    (patchEvent: PatchEvent) => {
      const patches = patchEvent.patches
      const transformedPatches = transform(patches)
      callbacks.onChange(PatchEvent.from(transformedPatches))
    },
    [callbacks, transform],
  )

  const contextValue = useMemo(
    () => ({...callbacks, onChange: handleChange}),
    [callbacks, handleChange],
  )
  return (
    <FormCallbacksContext.Provider value={contextValue}>
      {props.children}
    </FormCallbacksContext.Provider>
  )
})
