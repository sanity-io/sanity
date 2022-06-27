/**
 * Options available for doing diffs. Currently no options are defined.
 *
 * @public
 */
export type DiffOptions = Record<string, never>

/**
 * The recognized diff value types
 *
 * @public
 */
export type ValueType = 'array' | 'boolean' | 'null' | 'number' | 'object' | 'string' | 'undefined'

/**
 * An "input" holds the _type_ of the value, the actual value, an optional annotation,
 * along with potential helper methods and properties, which vary dependending on the type
 *
 * @public
 */
export type Input<T> =
  | NumberInput<T>
  | BooleanInput<T>
  | StringInput<T>
  | NullInput<T>
  | ObjectInput<T>
  | ArrayInput<T>

/**
 * Shared properties for all input types
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export interface BaseInput<A> {
  annotation: A
}

/**
 * Input type for strings, which supports slicing parts of the string while maintaining the
 * annotation of the parent.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export interface StringInput<A> extends BaseInput<A> {
  type: 'string'
  value: string
  sliceAnnotation(start: number, end: number): {text: string; annotation: A}[]
}

/**
 * Input type for numbers.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export interface NumberInput<A> extends BaseInput<A> {
  type: 'number'
  value: number
}

/**
 * Input type for booleans.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export interface BooleanInput<A> extends BaseInput<A> {
  type: 'boolean'
  value: boolean
}

/**
 * Input type for `null` values.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export interface NullInput<A> extends BaseInput<A> {
  type: 'null'
  value: null
}

/**
 * Input type for object values. Caches the available keys, and allows retrieval of properties,
 * while automatically wrapping the retrieved property in a typed input container.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export interface ObjectInput<A> extends BaseInput<A> {
  type: 'object'

  /**
   * The actual object value
   */
  value: Record<string, unknown>

  /**
   * The keys of the object
   */
  keys: string[]

  /**
   * Retrieve the property with the given `key`, automatically wrapping it in an input container.
   *
   * @param key - The key of the property you want to retrieve.
   * @returns Typed input container, or `undefined` if the property does not exist
   */
  get(key: string): Input<A> | undefined
}

/**
 * Input type for array values. Helper functions are available for getting the item and/or
 * annotation at a given index.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export interface ArrayInput<A> extends BaseInput<A> {
  type: 'array'

  /**
   * The actual array value
   */
  value: unknown[]

  /**
   * The length of the array
   */
  length: number

  /**
   * Retrieve the value at the given `index`, automatically wrapping it in an input container.
   *
   * @param index - The index of the item to retrieve
   * @returns Typed input container, or `undefined` if the item does not exist
   */
  at(index: number): Input<A>

  /**
   * Retrieve the _annotation_ for an item at the given index
   *
   * @param index - The index of the item to fetch the annotation for
   * @returns The annotation at the given index, or `undefined` if the item does not exist
   */
  annotationAt(index: number): A
}

/**
 * Diff for something that has been added - eg a property in an object,
 * an item in an array, a segment of a string or similar.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @typeParam V - Value. The type of the destination (eg `after` or `to`) value.
 * @public
 */
export interface AddedDiff<A, V> {
  action: 'added'
  isChanged: true
  fromValue: null | undefined
  toValue: V
  annotation: A
}

/**
 * Diff for something that has been removed - eg a property in an object,
 * an item in an array, a segment of a string or similar.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @typeParam V - Value. The type of the source (eg `before` or `from`) value.
 * @public
 */
export interface RemovedDiff<A, V> {
  action: 'removed'
  isChanged: true
  fromValue: V
  toValue: null | undefined
  annotation: A
}

/**
 * Diff for something that has changed - eg it was not added or removed, but the
 * value has changed "in place". Note that {@link TypeChangeDiff} is used for values that change
 * their _type_, thus the `V` type parameter represents both the source and the destination value
 * in this type.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @typeParam V - Value. The type of the value.
 * @public
 */
export interface ChangedDiff<A, V> {
  action: 'changed'
  isChanged: true
  fromValue: V
  toValue: V
  annotation: A
}

/**
 * Diff (or lack thereof, in this case) for a value that has _not_ changed.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @typeParam V - Value. The type of the destination (eg `after`) value.
 * @public
 */
export interface UnchangedDiff<A, V> {
  action: 'unchanged'
  isChanged: false
  fromValue: V
  toValue: V
}

/**
 * Diff with all the possible diff types.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @typeParam V - Value. Type of the value repesented in the diff.
 * @public
 */
export type FullDiff<A, V> =
  | AddedDiff<A, V>
  | RemovedDiff<A, V>
  | ChangedDiff<A, V>
  | UnchangedDiff<A, V>

/**
 * Diff of a string. Holds an additional array of string _segments_,
 * indicating which portions of the string is changed/unchanged.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export type StringDiff<A> = FullDiff<A, string> & {type: 'string'; segments: StringDiffSegment<A>[]}

/**
 * Diff of a number.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export type NumberDiff<A> = FullDiff<A, number> & {type: 'number'}

/**
 * Diff of a boolean.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export type BooleanDiff<A> = FullDiff<A, boolean> & {type: 'boolean'}

/**
 * Diff for a value that has changed from one type to another.
 * For example, an object property going from `null` to `string`.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export interface TypeChangeDiff<A> {
  type: 'typeChange'
  action: 'changed'
  isChanged: true

  fromType: string
  fromValue: unknown
  fromDiff: Diff<A> & {action: 'removed'}

  toType: string
  toValue: unknown
  toDiff: Diff<A> & {action: 'added'}

  annotation: A
}

/**
 * Diff for an object value.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @typeParam T - Value type.
 * @public
 */
export type ObjectDiff<A, T extends object = Record<string, any>> = FullDiff<A, T> & {
  type: 'object'
  fields: Record<keyof T, Diff<A>>
}

/**
 * Diff for an array value.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @typeParam V - Item value type.
 * @public
 */
export type ArrayDiff<A, V = unknown> = FullDiff<A, V[]> & {type: 'array'; items: ItemDiff<A>[]}

/**
 * Diff for a `null` value.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export type NullDiff<A> = FullDiff<A, null> & {type: 'null'}

/**
 * Diff for any value type.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export type Diff<A> =
  | NullDiff<A>
  | StringDiff<A>
  | NumberDiff<A>
  | BooleanDiff<A>
  | ObjectDiff<A>
  | ArrayDiff<A>
  | TypeChangeDiff<A>

/**
 * Diff of a string segment (eg a portion/slice), and whether or not it was changed or unchanged.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export type StringDiffSegment<A> = StringSegmentChanged<A> | StringSegmentUnchanged

/**
 * Diff of a string segment that has changed.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export interface StringSegmentChanged<A> {
  type: 'stringSegment'
  action: 'added' | 'removed'
  text: string
  annotation: A
}

/**
 * Diff of a string segment that is unchanged.
 *
 * @public
 */
export interface StringSegmentUnchanged {
  type: 'stringSegment'
  action: 'unchanged'
  text: string
}

/**
 * Diff of an item in an array, representing whether or not it has moved within the array,
 * and if so, which index it was moved from/to.
 *
 * If not moved, `fromIndex` and `toIndex` will have the same value.
 * If the item was added, `fromIndex` will be `undefined`.
 * If the item was removed, `toIndex` will be `undefined`.
 *
 * @typeParam A - Annotation. Timestamps, author and similar info is attached by Sanity, but anything is allowed.
 * @public
 */
export interface ItemDiff<A> {
  fromIndex: number | undefined
  toIndex: number | undefined
  hasMoved: boolean
  diff: Diff<A>
  annotation: A
}
