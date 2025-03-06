import {useGlobalKeyDown} from '@sanity/ui'
import {isHotkey} from 'is-hotkey-esm'
import {type ComponentType, type ReactNode, useCallback, useMemo, useState} from 'react'

import {GLOBAL_MCP_KEY} from '../constants'
import {type MCPAgentContext, type MCPComponentProps, type MCPConfig, type MCPEvent} from '../types'
import {MCPNoopProvider, MCPProvider} from './MCPProvider'

/**
 * @hidden
 * @internal
 */
export function MCPComponentWrapper(props: {config?: MCPConfig; children?: ReactNode}) {
  const Component = props.config?.component
  if (!Component) {
    return <MCPNoopProvider>{props.children} </MCPNoopProvider>
  }
  return <MCPStateProvider component={Component}>{props.children}</MCPStateProvider>
}
const isMCPHotKey = isHotkey(`mod+${GLOBAL_MCP_KEY}`)

function MCPStateProvider(props: {
  component: ComponentType<MCPComponentProps>
  children?: ReactNode
}) {
  const Component = props.component
  const [context, setContext] = useState<MCPAgentContext>({})
  const [active, setActive] = useState<boolean>(false)
  const handleEvent = useCallback((event: MCPEvent) => {
    setContext((prevContext) => {
      return reduceMCPEvent(prevContext, event)
    })
  }, [])

  const reactContext = useMemo(
    () => ({
      onEvent: handleEvent,
    }),
    [handleEvent],
  )

  const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
    if (isMCPHotKey(event)) {
      event.preventDefault()
      setActive((current) => !current)
    }
  }, [])

  useGlobalKeyDown(handleGlobalKeyDown)

  return (
    <MCPProvider value={reactContext}>
      <Component active={active} context={context} onDeactivate={() => setActive(false)} />
      {props.children}
    </MCPProvider>
  )
}

function reduceMCPEvent(state: MCPAgentContext, event: MCPEvent): MCPAgentContext {
  switch (true) {
    case event.type === 'UPDATE_FOCUS': {
      return {
        ...state,
        focus: {
          document: event.document,
          path: event.path,
          selection: event.selection,
        },
      }
    }
    default: {
      return state
    }
  }
}
