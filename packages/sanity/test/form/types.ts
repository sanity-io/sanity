import {Path, ValidationMarker} from '@sanity/types'
import {FormNodePresence} from '../../src/core'

export interface TestRenderProps {
  documentValue?: Record<string, unknown>
  focusPath?: Path
  openPath?: Path
  presence?: FormNodePresence[]
  validation?: ValidationMarker[]
}
