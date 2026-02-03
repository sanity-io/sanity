import {type FormNodePresence} from '../../src/core'
import {type Path, type ValidationMarker} from '@sanity/types'

export interface TestRenderProps {
  documentValue?: Record<string, unknown>
  focusPath?: Path
  openPath?: Path
  presence?: FormNodePresence[]
  validation?: ValidationMarker[]
}
