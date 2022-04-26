import {Path, SchemaType, ValidationMarker} from '@sanity/types'
import {createContext} from 'react'
import {FormFieldPresence} from '../../../presence'
import {PatchArg} from '../../patch'
import {ArrayMember, ObjectMember} from '../../types'

/**
 * @alpha
 */
export interface FormNodeContextValue<T = unknown> {
  collapsed: boolean
  collapsible: boolean
  compareValue: T | undefined
  inputId: string
  level: number
  members?: Array<ArrayMember | ObjectMember>
  onChange?: (...patches: PatchArg[]) => void
  path: Path
  presence: FormFieldPresence[]
  type: SchemaType
  validation: ValidationMarker[]
}

/**
 * @internal
 */
export const FormNodeContext = createContext<FormNodeContextValue | null>(null)
