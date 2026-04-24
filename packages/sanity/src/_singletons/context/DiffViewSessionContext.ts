import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export type DiffViewSessionContextValue = string | null

/**
 * @internal
 */
export const DiffViewSessionContext = createContext<DiffViewSessionContextValue>(
  'sanity/_singletons/context/diff-view-session',
  null,
)
