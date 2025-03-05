import {type ComponentType, type ReactNode, useCallback, useMemo, useState} from 'react'

import {useMCPHotkeys} from '../hooks/useMCPHotkeys'
import {type MCPAgentContext, type MCPComponentProps, type MCPConfig, type MCPEvent} from '../types'
import {MCPNoopProvider, MCPProvider} from './MCPProvider'

export function MCPComponentWrapper(props: {config?: MCPConfig; children?: ReactNode}) {
  const Component = props.config?.component
  if (!Component) {
    return <MCPNoopProvider>{props.children} </MCPNoopProvider>
  }
  return <MCPStateProvider component={Component}>{props.children}</MCPStateProvider>
}

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

  useMCPHotkeys({
    active: active,
    onDeactivate: () => setActive(true),
    onActivate: () => setActive(false),
  })

  return (
    <MCPProvider value={reactContext}>
      <Component active={active} context={context} />
      {props.children}
    </MCPProvider>
  )
}

function reduceMCPEvent(state: MCPAgentContext, event: MCPEvent): MCPAgentContext {
  return event
}
