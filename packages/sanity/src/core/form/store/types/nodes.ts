import {type Diff} from '@sanity/diff'
import {
  type ArraySchemaType,
  type BooleanSchemaType,
  type FormNodeValidation,
  type KeyedObject,
  type NumberSchemaType,
  type ObjectSchemaType,
  type Path,
  type SchemaType,
  type StringSchemaType,
} from '@sanity/types'

import {type FormNodePresence} from '../../../presence'
import {type ObjectItem} from '../../types'
import {type ProvenanceDiffAnnotation} from './diff'
import {type FormFieldGroup} from './fieldGroup'
import {type ArrayOfObjectsMember, type ArrayOfPrimitivesMember, type ObjectMember} from './members'

/**
 * @public
 */
export type ComputeDiff<Annotation> = (value: unknown) => Diff<Annotation>

/**
 * Props that encapsulate document chronology within a stack of versions.
 *
 * @public
 */
export interface NodeChronologyProps {
  /**
   * Whether the document has an upstream version.
   */
  hasUpstreamVersion: boolean
}

/**
 * Props that encapsulate changes in the node's value.
 *
 * @public
 */
export interface NodeDiffProps<Annotation, Value = unknown> extends NodeChronologyProps {
  /**
   * A function that takes any value and produces a diff between that value and the value the node
   * is being compared to.
   *
   * This can be used to compute a diff optimistically.
   *
   * This is marked as unstable because the API may need to evolve as we iterate on the advanced
   * version control functionality. It will be stabilised when that project has matured.
   */
  __unstable_computeDiff: ComputeDiff<Annotation>
  /**
   * Whether the current value is different to the value the node is being compared to.
   */
  changed: boolean
  /**
   * The value the node is currently being compared to. This is taken from the upstream version, if
   * the document has an upstream version. Otherwise, it's taken from the document's current value.
   *
   * You can use the `hasUpstreamVersion` prop to determine whether the document has an upstream
   * version.
   */
  compareValue?: Value
}

/**
 * @hidden
 * @public
 */
export interface BaseFormNode<T = unknown, S extends SchemaType = SchemaType> extends NodeDiffProps<
  ProvenanceDiffAnnotation,
  T
> {
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
  displayInlineChanges?: boolean
}

/** @internal */
export interface HiddenField {
  kind: 'hidden'
  key: string
  name: string
  index: number
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

/** @internal */
export type DocumentFormNode<
  T extends {[key in string]: unknown} = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType,
> = ObjectFormNode<T, S>

/** @public */
export interface ArrayOfObjectsFormNode<
  T extends any[] = KeyedObject[],
  S extends ArraySchemaType = ArraySchemaType,
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  /**
   * @hidden
   * @beta */
  members: ArrayOfObjectsMember[]
}

/** @public */
export interface ArrayOfPrimitivesFormNode<
  T extends (string | number | boolean)[] = (string | number | boolean)[],
  S extends ArraySchemaType = ArraySchemaType,
> extends BaseFormNode<T, S> {
  /** The focus path of the form node. */
  focusPath: Path
  /**
   * @hidden
   * @beta */
  members: ArrayOfPrimitivesMember[]
}

/** @public */
export type BooleanFormNode<S extends BooleanSchemaType = BooleanSchemaType> = BaseFormNode<
  boolean,
  S
>

/** @public */
export type NumberFormNode<S extends NumberSchemaType = NumberSchemaType> = BaseFormNode<number, S>

/** @public */
export type StringFormNode<S extends StringSchemaType = StringSchemaType> = BaseFormNode<string, S>

/**
 * @hidden
 * @beta */
export type PrimitiveFormNode = BooleanFormNode | NumberFormNode | StringFormNode
