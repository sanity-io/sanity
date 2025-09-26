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

  const setDecideParameters = useCallback(
    (params: Record<string, string>) => {
      setDecideParametersState(params)
    },
    [decideParameters],
  )

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
