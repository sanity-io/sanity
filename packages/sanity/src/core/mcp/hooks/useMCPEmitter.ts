import {useContext} from 'react'
import {MCPContext} from 'sanity/_singletons'

function noop() {}
export function useMCPEmitter() {
  const context = useContext(MCPContext)

  return context?.onEvent || noop
}
