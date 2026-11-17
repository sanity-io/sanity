import {createContext} from 'react'

import type {FullscreenPTEContextValue} from '../../core/form/inputs/PortableText/contexts/fullscreen/FullscreenPTEContext'

/**
 * @internal
 */
export const FullscreenPTEContext = createContext<FullscreenPTEContextValue>({
  getFullscreenPath: () => undefined,
  setFullscreenPath: () => {},
  hasAnyFullscreen: () => false,
  allFullscreenPaths: [],
})
