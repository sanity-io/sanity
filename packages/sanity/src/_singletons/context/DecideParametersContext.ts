import {createContext} from 'sanity/_createContext'

export interface DecideParametersContextValue {
  decideParameters: Record<string, string>
  setDecideParameters: (params: Record<string, string>) => void
}

/**
 * @internal
 */
export const DecideParametersContext = createContext<DecideParametersContextValue | null>(
  'sanity/_singletons/context/decisionParameters',
  null,
)
