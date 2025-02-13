import {type ReactNode, useCallback, useContext, useLayoutEffect, useMemo, useState} from 'react'
import {PresentationDocumentContext} from 'sanity/_singletons'
import {useEffectEvent} from 'use-effect-event'

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
    // eslint-disable-next-line @typescript-eslint/no-shadow
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

  // eslint-disable-next-line @typescript-eslint/no-shadow
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
