import {type Serializable, type SerializableObject} from '@sanity/presentation-comlink'
import {
  type FunctionComponent,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import {PresentationSharedStateContext} from 'sanity/_singletons'

import {type VisualEditingConnection} from '../types'
import {type PresentationSharedStateContextValue} from './types'

export const SharedStateProvider: FunctionComponent<
  PropsWithChildren<{
    comlink: VisualEditingConnection | null
  }>
> = function (props) {
  const {comlink, children} = props

  const sharedState = useRef<SerializableObject>({})

  useEffect(() => {
    return comlink?.on('visual-editing/shared-state', () => {
      return {state: sharedState.current}
    })
  }, [comlink])

  const setValue = useCallback(
    (key: string, value: Serializable) => {
      sharedState.current[key] = value
      comlink?.post('presentation/shared-state', {key, value})
    },
    [comlink],
  )

  const removeValue = useCallback(
    (key: string) => {
      comlink?.post('presentation/shared-state', {key})
      delete sharedState.current[key]
    },
    [comlink],
  )

  const context = useMemo<PresentationSharedStateContextValue>(
    () => ({removeValue, setValue}),
    [removeValue, setValue],
  )

  return (
    <PresentationSharedStateContext.Provider value={context}>
      {children}
    </PresentationSharedStateContext.Provider>
  )
}
