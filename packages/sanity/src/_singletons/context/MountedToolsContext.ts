import {createContext} from 'sanity/_createContext'

import type {MountedToolsContextValue} from '../../core/studio/mountedTools/types'

/** @internal */
export const MountedToolsContext = createContext<MountedToolsContextValue>(
  'sanity/_singletons/context/mountedTools',
  {inactiveToolStates: new Map()},
)
