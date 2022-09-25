import {Path, ValidationMarker} from '@sanity/types'
import {FormFieldPresence} from '../../src/_unstable/presence'

export interface TestRenderProps {
  documentValue?: Record<string, unknown>
  focusPath?: Path
  openPath?: Path
  presence?: FormFieldPresence[]
  validation?: ValidationMarker[]
}
