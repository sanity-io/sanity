import type {FullscreenPTEContextValue} from '../../core/form/inputs/PortableText/contexts/fullscreen/FullscreenPTEContext'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const FullscreenPTEContext = createContext<FullscreenPTEContextValue>(
  'sanity/_singletons/context/fullscreen-pte',
  {
    getFullscreenPath: () => undefined,
    setFullscreenPath: () => {},
    hasAnyFullscreen: () => false,
    allFullscreenPaths: [],
  },
)
