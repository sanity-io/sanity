import {type ComponentProps, type ComponentType, use} from 'react'

import type StructureTool from './components/structureTool'
import type DocumentPane from './panes/document/pane'
import type DocumentListPane from './panes/documentList/pane'
import type ListPane from './panes/list'
import type UserComponentPane from './panes/userComponent'

interface Chunk<Props> {
  Component: ComponentType<Props>
  /** Starts loading the chunk, once */
  preload: () => Promise<unknown>
}

type ChunkModule<Props> = {default: ComponentType<Props>}
type ChunkPromise<Props> = Promise<ChunkModule<Props>> & {
  status?: 'fulfilled'
  value?: ChunkModule<Props>
}

/**
 * A lazily loaded component that renders without suspending once its chunk has loaded.
 *
 * `lazy()` calls its loader when it first renders, and an `import()` of a module that is already
 * loaded still settles a microtask later. A render in a synchronous lane (a store emission read
 * through `useSyncExternalStore`, as the resolved panes are) cannot wait for that microtask, so
 * it commits the Suspense fallback even for a preloaded chunk, and React then holds the content
 * back for its 300 ms reveal throttle. `use()` reads a promise marked as fulfilled synchronously.
 */
function lazyChunk<Props extends object>(load: () => Promise<ChunkModule<Props>>): Chunk<Props> {
  let promise: ChunkPromise<Props> | undefined
  const preload = (): Promise<ChunkModule<Props>> => {
    if (!promise) {
      const loading: ChunkPromise<Props> = load().then((module) => {
        loading.status = 'fulfilled'
        loading.value = module
        return module
      })
      promise = loading
    }
    return promise
  }

  function LazyChunk(props: Props) {
    const {default: Component} = use(preload())
    return <Component {...props} />
  }

  return {Component: LazyChunk, preload}
}

export const structureToolChunk: Chunk<ComponentProps<typeof StructureTool>> = lazyChunk(
  () => import('./components/structureTool'),
)
export const listPaneChunk: Chunk<ComponentProps<typeof ListPane>> = lazyChunk(
  () => import('./panes/list'),
)
export const documentListPaneChunk: Chunk<ComponentProps<typeof DocumentListPane>> = lazyChunk(
  () => import('./panes/documentList/pane'),
)
export const documentPaneChunk: Chunk<ComponentProps<typeof DocumentPane>> = lazyChunk(
  () => import('./panes/document/pane'),
)
export const userComponentPaneChunk: Chunk<ComponentProps<typeof UserComponentPane>> = lazyChunk(
  () => import('./panes/userComponent'),
)
