import {type PropsWithChildren} from 'react'
import {MCPContext, type MCPProviderContextValue} from 'sanity/_singletons'

/**
 * @internal
 * @hidden
 */
export function MCPProvider(props: PropsWithChildren & {value: MCPProviderContextValue}) {
  const {children, value} = props

  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>
}

const NOOP_CONTEXT = {
  onEvent: () => {},
}
/**
 * @internal
 * @hidden
 */
export function MCPNoopProvider(props: PropsWithChildren) {
  const {children} = props

  return <MCPContext.Provider value={NOOP_CONTEXT}>{children}</MCPContext.Provider>
}
