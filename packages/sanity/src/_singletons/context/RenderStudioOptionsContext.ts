import {createContext} from 'sanity/_createContext'

import type {RenderStudioOptions} from '../../core/studio/renderStudio'

/**
 * The options `renderStudio` was called with. Empty when the Studio is mounted some other way.
 *
 * @internal
 */
export const RenderStudioOptionsContext = createContext<RenderStudioOptions>(
  'sanity/_singletons/context/render-studio-options',
  {},
)
