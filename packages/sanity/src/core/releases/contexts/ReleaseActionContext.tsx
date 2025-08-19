import {createContext, type ReactNode, useContext} from 'react'

import {type ReleaseActionGroup} from '../../config/releases/actions'

/**
 * @internal
 */
export interface ReleaseActionContextValue {
  /** The current UI context where release actions are being rendered */
  group?: ReleaseActionGroup
}

/**
 * @internal
 */
const ReleaseActionContext = createContext<ReleaseActionContextValue | undefined>(undefined)

/**
 * @internal
 */
export function ReleaseActionContextProvider({
  children,
  value,
}: {
  children: ReactNode
  value: ReleaseActionContextValue
}) {
  return <ReleaseActionContext.Provider value={value}>{children}</ReleaseActionContext.Provider>
}

/**
 * Hook to get contextual information about where release actions are being rendered.
 * Similar to how document actions use hooks to understand their environment.
 *
 * @example
 * ```typescript
 * export const MyReleaseAction: ReleaseActionComponent = ({release}) => {
 *   const {group} = useReleaseActionContext()
 *
 *   return {
 *     label: group === 'list' ? 'Quick Action' : 'Detailed Action',
 *     onHandle: () => {
 *       // Different behavior based on context
 *     }
 *   }
 * }
 * ```
 *
 * @internal
 */
export function useReleaseActionContext(): ReleaseActionContextValue {
  const context = useContext(ReleaseActionContext)
  if (context === undefined) {
    throw new Error('useReleaseActionContext must be used within a ReleaseActionContextProvider')
  }
  return context
}
