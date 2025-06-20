import {type Path, type ValidationMarker} from '@sanity/types'

import type {FormNodePresence} from '../../src/core/presence/types'

export interface TestRenderProps {
  documentValue?: Record<string, unknown>
  focusPath?: Path
  openPath?: Path
  presence?: FormNodePresence[]
  validation?: ValidationMarker[]
}
