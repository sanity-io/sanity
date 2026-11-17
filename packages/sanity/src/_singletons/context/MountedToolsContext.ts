import {createContext} from 'react'

import type {MountedToolsContextValue} from '../../core/studio/mountedTools/types'

/** @internal */
export const MountedToolsContext = createContext<MountedToolsContextValue>({
  inactiveToolStates: new Map(),
})
