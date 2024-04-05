import {memo, type ReactNode, useCallback, useMemo} from 'react'
import {FormCallbacksContext} from 'sanity/_singletons'

import {type FormPatch, PatchEvent} from '../patch'
import {useFormCallbacks} from '../studio'

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
