import {Path, ValidationMarker} from '@sanity/types'
import {FormFieldPresence} from '../../src/core'

export interface TestRenderProps {
  documentValue?: Record<string, unknown>
  focusPath?: Path
  openPath?: Path
  presence?: FormFieldPresence[]
  validation?: ValidationMarker[]
}
