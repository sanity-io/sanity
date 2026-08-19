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

import {type FormNodePresence} from '../../../presence/types'
import {type ObjectItem} from '../../types/itemProps'
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
  /**
   * Whether the document has a base variant: the variant belonging to the same bundle (published,
   * drafts, or a content release) that itself belongs to no variant definition. A document has at
   * most one base variant.
   *
   * This is `false` unless the displayed document is a variant-scoped document whose base variant
   * exists. It is also `false` while a historical revision is displayed: the base variant is only
   * ever read at its current value, so comparing it to a past revision would report the passage of
   * time rather than divergence between variants.
   *
   * When this is `false`, `changedFromBaseVariant` is always `false` and `baseVariantValue` is
   * `undefined`.
   */
  hasBaseVariant: boolean
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
  /**
   * Whether the current value is different to the node's value in the document's base variant.
   *
   * This is always `false` when the document has no base variant. Use the `hasBaseVariant` prop to
   * distinguish "unchanged from the base variant" from "there is no base variant to compare to".
   *
   * Object nodes derive this by aggregating over their members rather than by comparing whole
   * values: a variant and its base variant always differ in document metadata (`_id`, `_rev`,
   * `_updatedAt`, `_system`), which would otherwise make every object node report a change. Hidden
   * fields, and fields nested deeper than the maximum field depth, produce no member and so do not
   * contribute to the aggregate. Array nodes combine a direct comparison — which catches reordering
   * and removals that per-item aggregation misses — with the same aggregation over their items.
   */
  changedFromBaseVariant: boolean
  /**
   * The node's value in the document's base variant.
   *
   * You can use the `hasBaseVariant` prop to determine whether the document has a base variant.
   * This is `undefined` when it does not.
   */
  baseVariantValue?: Value
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
/**
 * @hidden
 * @public */
export type ObjectRenderMembersCallback = (members: ObjectMember[]) => ObjectMember[]

/** @public */
export interface ObjectFormNode<
  T = {[key in string]: unknown},
  S extends ObjectSchemaType = ObjectSchemaType,
> extends BaseFormNode<
  T,
  S & {
    // RenderMembers is part of the schema but it's "augmented" in the definitionExtensions
    // so we need to add it here, we cannot make it part of the schema type because we don't have access there to the ObjectMember type
    renderMembers?: ObjectRenderMembersCallback
  }
> {
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
  /**
   * @hidden
   * @beta */
  _allMembers?: ObjectMember[]
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
