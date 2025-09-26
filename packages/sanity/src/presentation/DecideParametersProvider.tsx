import {
  type FunctionComponent,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {DecideParametersContext} from 'sanity/_singletons'

import {type DecideParametersContextValue} from '../_singletons/context/DecideParametersContext'

export const DecideParametersProvider: FunctionComponent<PropsWithChildren> = function ({
  children,
}) {
  const [decideParameters, setDecideParametersState] = useState<Record<string, string>>({})

  console.warn('[DecideParametersProvider] Current decideParameters:', decideParameters)

  const setDecideParameters = useCallback(
    (params: Record<string, string>) => {
      console.warn('[DecideParametersProvider] Setting decideParameters:', params)
      console.warn('[DecideParametersProvider] Previous decideParameters:', decideParameters)
      setDecideParametersState(params)
    },
    [decideParameters],
  )

  // Log when state actually changes
  useEffect(() => {
    console.warn('[DecideParametersProvider] State changed to:', decideParameters)
  }, [decideParameters])

  const contextValue = useMemo<DecideParametersContextValue>(
    () => ({
      decideParameters: decideParameters,
      setDecideParameters: setDecideParameters,
    }),
    [decideParameters, setDecideParameters],
  )

  return (
    <DecideParametersContext.Provider value={contextValue}>
      {children}
    </DecideParametersContext.Provider>
  )
}
