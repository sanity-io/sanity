import {createContext} from 'sanity/_createContext'

import type {FullscreenPTEContextValue} from '../../core/form/inputs/PortableText/contexts/fullscreen/FullscreenPTEContext'

/**
 * @internal
 */
export const FullscreenPTEContext = createContext<FullscreenPTEContextValue>(
  'sanity/_singletons/context/fullscreen-pte',
  {
    getFullscreenPath: () => undefined,
    setFullscreenPath: () => {
      /* intentionally empty */
    },
    hasAnyFullscreen: () => false,
    allFullscreenPaths: [],
  },
)
