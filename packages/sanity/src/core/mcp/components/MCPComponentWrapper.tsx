import {useGlobalKeyDown} from '@sanity/ui'
import {isHotkey} from 'is-hotkey-esm'
import {type ReactNode, useCallback, useMemo, useState} from 'react'

import {type MCPAgentContext, type MCPConfig, type MCPEvent} from '../types'
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
  return (
    <MCPStateProvider hotkey={props.config?.hotkey} component={Component}>
      {props.children}
    </MCPStateProvider>
  )
}

const DEFAULT_KEY = 'mod+j'

function MCPStateProvider(props: MCPConfig & {children: ReactNode}) {
  const Component = props.component
  const [context, setContext] = useState<MCPAgentContext>({})
  const [active, setActive] = useState<boolean>(false)
  const handleEvent = useCallback((event: MCPEvent) => {
    setContext((prevContext) => {
      return reduceMCPEvent(prevContext, event)
    })
  }, [])

  const isMCPHotKey = useMemo(() => isHotkey(props.hotkey || DEFAULT_KEY), [props.hotkey])

  const reactContext = useMemo(
    () => ({
      onEvent: handleEvent,
    }),
    [handleEvent],
  )

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isMCPHotKey(event)) {
        event.preventDefault()
        setActive((current) => !current)
      }
    },
    [isMCPHotKey],
  )

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
