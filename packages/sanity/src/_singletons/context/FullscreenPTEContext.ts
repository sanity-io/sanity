import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {FullscreenPTEContextValue} from '../../core/form/inputs/PortableText/contexts/fullscreen/FullscreenPTEContext'

/**
 * @internal
 */
export const FullscreenPTEContext: Context<FullscreenPTEContextValue> =
  createContext<FullscreenPTEContextValue>('sanity/_singletons/context/fullscreen-pte', {
    getFullscreenPath: () => undefined,
    setFullscreenPath: () => {},
    hasAnyFullscreen: () => false,
    allFullscreenPaths: [],
  })
