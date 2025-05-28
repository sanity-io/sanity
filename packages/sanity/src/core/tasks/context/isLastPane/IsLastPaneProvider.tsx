import {IsLastPaneContext} from 'sanity/_singletons'

interface IsLastPaneProviderProps {
  isLastPane: boolean
  children: React.ReactNode
}

/**
 * @internal
 * @hidden
 */
export function IsLastPaneProvider({
  children,
  isLastPane,
}: IsLastPaneProviderProps): React.JSX.Element {
  return <IsLastPaneContext.Provider value={isLastPane}>{children}</IsLastPaneContext.Provider>
}
