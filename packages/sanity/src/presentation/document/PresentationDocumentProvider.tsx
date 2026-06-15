import {
  type ReactNode,
  useCallback,
  useContext,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {PresentationDocumentContext} from 'sanity/_singletons'

import {type PresentationPluginOptions} from '../types'
import {type PresentationDocumentContextValue} from './types'

/** @internal */
export function PresentationDocumentProvider(props: {
  children?: ReactNode
  options: PresentationPluginOptions
}): React.JSX.Element {
  const {children, options} = props
  const parent = useContext(PresentationDocumentContext)
  const parentRegister = parent?.register

  const [optionsArray, setOptionsArray] = useState<PresentationPluginOptions[]>(() => [])

  const register = useCallback(
    (options: PresentationPluginOptions) => {
      if (parentRegister) {
        return parentRegister(options)
      }

      setOptionsArray((prev) => [options].concat(prev))

      return () => {
        setOptionsArray((prev) => prev.filter((o) => o !== options))
      }
    },
    [parentRegister],
  )

  const context: PresentationDocumentContextValue = useMemo(
    () => ({
      options: parent?.options || optionsArray,
      register,
    }),
    [optionsArray, parent, register],
  )

  const registerEffectEvent = useEffectEvent((options: PresentationPluginOptions) =>
    register(options),
  )
  useLayoutEffect(() => registerEffectEvent(options), [options])

  return (
    <PresentationDocumentContext.Provider value={context}>
      {children}
    </PresentationDocumentContext.Provider>
  )
}
