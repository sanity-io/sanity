import {useGlobalKeyDown} from '@sanity/ui'
import {isHotkey} from 'is-hotkey-esm'
import {type ReactNode, useCallback, useMemo, useState} from 'react'

import {
  type MCPAgentContext,
  type MCPConfig,
  type MCPEvent,
  type MCPUpdatePaneEvent,
  type PaneInfo,
} from '../types'
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
  const [context, setContext] = useState<MCPAgentContext>({
    panes: [],
  })
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
    case event.type === 'REMOVE_PANE': {
      return {
        ...state,
        panes: state.panes.filter((l) => l.id !== event.id),
      }
    }
    case event.type === 'UPDATE_PANE': {
      const currentIndex = state.panes.findIndex((list) => list.id === event.id)
      const paneInfo = getPaneInfoFromEvent(event)
      return {
        ...state,
        panes:
          currentIndex === -1
            ? state.panes.concat(paneInfo)
            : state.panes.toSpliced(currentIndex, 1, paneInfo),
      }
    }
    default: {
      console.warn('Unhandled mcp event: ', event)
      return state
    }
  }
}

// eslint-disable-next-line consistent-return
function getPaneInfoFromEvent(event: MCPUpdatePaneEvent): PaneInfo {
  // eslint-disable-next-line default-case
  switch (event.paneType) {
    case 'document': {
      return {
        type: 'document',
        id: event.id,
        active: event.active,
        index: event.index,
        document: event.document,
        pane: event.pane,
      }
    }
    case 'documentList': {
      return {
        type: 'documentList',
        id: event.id,
        index: event.index,
        active: event.active,
        pane: event.pane,
        query: event.query,
        results: event.results,
      }
    }
    case 'list': {
      return {
        type: 'list',
        id: event.id,
        index: event.index,
        active: event.active,
        pane: event.pane,
      }
    }
  }
  // @ts-expect-error - all cases should be covered
  console.warn('Unhandled mcp event: ', event.type)
}
