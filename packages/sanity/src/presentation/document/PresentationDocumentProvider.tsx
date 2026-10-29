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

  // Options registered by nested providers (further presentation plugin instances wrapping the
  // same form). This provider's own options are part of the context from the first render: the
  // document header should not wait for a layout effect to mount its locations banner, and it must
  // not lose the banner while the tool is hidden inside an `<Activity>` boundary, whose effects
  // are torn down, only to remount it in a resolving state on reveal.
  const [nestedOptions, setNestedOptions] = useState<PresentationPluginOptions[]>(() => [])

  const register = useCallback(
    (options: PresentationPluginOptions) => {
      if (parentRegister) {
        return parentRegister(options)
      }

      setNestedOptions((prev) => [options].concat(prev))

      return () => {
        setNestedOptions((prev) => prev.filter((o) => o !== options))
      }
    },
    [parentRegister],
  )

  const context: PresentationDocumentContextValue = useMemo(
    () => ({
      options: parent?.options || [options, ...nestedOptions],
      register,
    }),
    [nestedOptions, options, parent, register],
  )

  const registerEffectEvent = useEffectEvent((options: PresentationPluginOptions) =>
    register(options),
  )
  // Only a nested provider registers with the root; the root lists its own options directly
  useLayoutEffect(
    () => (parentRegister ? registerEffectEvent(options) : undefined),
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `registerEffectEvent` is an effect event, which `react-hooks/exhaustive-deps` forbids in the dependency array
    [options, parentRegister],
  )

  return (
    <PresentationDocumentContext.Provider value={context}>
      {children}
    </PresentationDocumentContext.Provider>
  )
}
