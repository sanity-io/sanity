import {useCallback, useEffect} from 'react'
import {type ProviderProps, useWorkspace} from 'sanity'
import {type RouterState, useRouterState} from 'sanity/router'

import {documentListPaneChunk, documentPaneChunk, listPaneChunk, structureToolChunk} from './chunks'

type OpenStructureTool = 'none' | 'root' | 'panes'

/**
 * Starts loading the structure tool and the pane chunks it is about to render while the studio
 * shell is still loading. The tool and every pane are lazy, each behind its own `Suspense`
 * boundary, so loading them only once React reaches them chains one round trip per level, and
 * React holds each reveal until 300 ms after the previous fallback. The document panes are only
 * loaded ahead when the URL opens panes, since their chunks are several times the size of the
 * root list pane's.
 *
 * @internal
 */
export function StructureToolPreloader(props: ProviderProps) {
  const {tools} = useWorkspace()
  const openStructureTool = useRouterState(
    useCallback(
      (routerState: RouterState): OpenStructureTool => {
        const toolName = routerState.tool
        const tool = tools.find((candidate) => candidate.name === toolName)
        if (
          typeof toolName !== 'string' ||
          tool?.__internalApplicationType !== 'sanity/structure'
        ) {
          return 'none'
        }
        const toolState = routerState[toolName] as {panes?: unknown[]} | undefined
        return toolState?.panes?.length ? 'panes' : 'root'
      },
      [tools],
    ),
  )

  useEffect(() => {
    if (openStructureTool === 'none') return
    void structureToolChunk.preload()
    void listPaneChunk.preload()
    if (openStructureTool === 'panes') {
      void documentListPaneChunk.preload()
      void documentPaneChunk.preload()
    }
  }, [openStructureTool])

  return props.renderDefault(props)
}
