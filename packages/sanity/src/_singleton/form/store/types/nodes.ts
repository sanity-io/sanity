import {
  type FormNodeValidation,
  type ObjectSchemaType,
  type Path,
  type SchemaType,
} from '@sanity/types'

import {type FormNodePresence} from '../../../presence/types'
import {type ObjectItem} from '../../types/itemProps'
import {type FormFieldGroup} from './fieldGroup'
import {type ObjectMember} from './members'

/**
 * @hidden
 * @public
 */
export interface BaseFormNode<T = unknown, S extends SchemaType = SchemaType> {
  // constants
  /** The unique identifier of the node. */
  id: string
  /** The schema type of the node. */
  schemaType: S
  /** The level of the node in the form hierarchy. */
  level: number
  /** The path of the node in the form hierarchy. */
  path: Path

  // state
  /**
   * @hidden
   * @beta */
  presence: FormNodePresence[]
  /** The validation markers of the node. */
  validation: FormNodeValidation[]
  /** The value of the node. */
  value: T | undefined
  /** Whether the node is read-only. */
  readOnly?: boolean
  /** Whether the node is focused. */
  focused?: boolean
  /** Whether the node has changes in a draft. */
  changed: boolean
}

/** @public */
export interface ObjectFormNode<
  T = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType,
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  /**
   * @hidden
   * @beta */
  groups: FormFieldGroup[]
  /**
   * @hidden
   * @beta */
  members: ObjectMember[]
}

/** @public */
export interface ObjectArrayFormNode<
  T extends ObjectItem = ObjectItem,
  S extends ObjectSchemaType = ObjectSchemaType,
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  value: T

  /**
   * @hidden
   * @beta */
  groups: FormFieldGroup[]
  /**
   * @hidden
   * @beta */
  members: ObjectMember[]

  changesOpen?: boolean
}
