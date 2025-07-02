import {applyPatches, parsePatch} from '@sanity/diff-match-patch'
import {getIndexForKey, jsonMatch, slicePath, stringifyPath} from '@sanity/json-match'
import {
  type IndexTuple,
  type InsertPatch,
  isKeyedObject,
  isKeySegment,
  type PathSegment,
} from '@sanity/types'

type SingleValuePath = Exclude<PathSegment, IndexTuple>[]

type ToNumber<TInput extends string> = TInput extends `${infer TNumber extends number}`
  ? TNumber
  : TInput

/**
 * Parse a single "segment" that may include bracket parts.
 *
 * For example, the literal
 *
 * ```
 * "friends[0][1]"
 * ```
 *
 * is parsed as:
 *
 * ```
 * ["friends", 0, 1]
 * ```
 */
type ParseSegment<TInput extends string> = TInput extends `${infer TProp}[${infer TRest}`
  ? TProp extends ''
    ? [...ParseBracket<`[${TRest}`>] // no property name before '['
    : [TProp, ...ParseBracket<`[${TRest}`>]
  : TInput extends ''
    ? []
    : [TInput]

/**
 * Parse one or more bracketed parts from a segment.
 *
 * It recursively "peels off" a bracketed part and then continues.
 *
 * For example, given the string:
 *
 * ```
 * "[0][foo]"
 * ```
 *
 * it produces:
 *
 * ```
 * [ToNumber<"0">, "foo"]
 * ```
 */
type ParseBracket<TInput extends string> = TInput extends `[${infer TPart}]${infer TRest}`
  ? [ToNumber<TPart>, ...ParseSegment<TRest>]
  : [] // no leading bracket → end of this segment

/**
 * Split the entire path string on dots "outside" of any brackets.
 *
 * For example:
 * ```
 * "friends[0].name"
 * ```
 *
 * becomes:
 *
 * ```
 * [...ParseSegment<"friends[0]">, ...ParseSegment<"name">]
 * ```
 *
 * (We use a simple recursion that splits on the first dot.)
 */
type PathParts<TPath extends string> = TPath extends `${infer Head}.${infer Tail}`
  ? [Head, ...PathParts<Tail>]
  : TPath extends ''
    ? []
    : [TPath]

/**
 * Given a type T and an array of "access keys" Parts, recursively index into T.
 *
 * If a part is a key, it looks up that property.
 * If T is an array and the part is a number, it "indexes" into the element type.
 */
type DeepGet<TValue, TPath extends readonly (string | number)[]> = TPath extends []
  ? TValue
  : TPath extends readonly [infer THead, ...infer TTail]
    ? // Handle traversing into optional properties
      DeepGet<
        TValue extends undefined | null
          ? undefined // Stop traversal if current value is null/undefined
          : THead extends keyof TValue // Access property if key exists
            ? TValue[THead]
            : // Handle array indexing
              THead extends number
              ? TValue extends readonly (infer TElement)[]
                ? TElement | undefined // Array element or undefined if out of bounds
                : undefined // Cannot index non-array with number
              : undefined, // Key/index doesn't exist
        TTail extends readonly (string | number)[] ? TTail : [] // Continue with the rest of the path
      >
    : never // Should be unreachable

/**
 * Given a document type TDocument and a JSON Match path string TPath,
 * compute the type found at that path.
 * @beta
 */
export type JsonMatch<TDocument, TPath extends string> = DeepGet<TDocument, PathParts<TPath>>

// this is a similar array key to the studio:
// https://github.com/sanity-io/sanity/blob/v3.74.1/packages/sanity/src/core/form/inputs/arrays/ArrayOfObjectsInput/createProtoArrayValue.ts
function generateArrayKey(length: number = 12): string {
  // Each byte gives two hex characters, so generate enough bytes.
  const numBytes = Math.ceil(length / 2)
  const bytes = crypto.getRandomValues(new Uint8Array(numBytes))
  // Convert each byte to a 2-digit hex string and join them.
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

function memoize<TFunction extends (input: unknown) => unknown>(fn: TFunction): TFunction {
  const cache = new WeakMap<object, unknown>()
  return ((input) => {
    if (!input || typeof input !== 'object') return fn(input)

    const cached = cache.get(input)
    if (cached) return cached

    const result = fn(input)
    cache.set(input, result)
    return result
  }) as TFunction
}

/**
 * Recursively traverse a value. When an array is encountered, ensure that
 * each object item has a _key property. Memoized such that sub-objects that
 * have not changed aren't re-computed.
 */
export const ensureArrayKeysDeep = memoize(<R>(input: R): R => {
  if (!input || typeof input !== 'object') return input

  if (Array.isArray(input)) {
    // if the array is empty then just return the input
    if (!input.length) return input
    const first = input[0]
    // if the first input in the array isn't an object (null is allowed) then
    // assume that this is an array of primitives, just return the input
    if (typeof first !== 'object') return input

    // if all the items already have a key, then return the input
    if (input.every(isKeyedObject)) return input

    // otherwise return a new object item with a new key
    return input.map((item: unknown) => {
      if (!item || typeof item !== 'object') return item
      if (isKeyedObject(item)) return ensureArrayKeysDeep(item)
      const next = ensureArrayKeysDeep(item)
      return {...next, _key: generateArrayKey()}
    }) as R
  }

  const entries = Object.entries(input).map(([key, value]) => [key, ensureArrayKeysDeep(value)])

  if (entries.every(([key, value]) => input[key as keyof typeof input] === value)) {
    return input
  }

  return Object.fromEntries(entries) as R
})

/**
 * Given an input object and a record of path expressions to values, this
 * function will set each match with the given value.
 *
 * ```js
 * const output = set(
 *   {name: {first: 'initial', last: 'initial'}},
 *   {'name.first': 'changed'}
 * );
 *
 * // { name: { first: 'changed', last: 'initial' } }
 * console.log(output);
 * ```
 */
export function set<R>(input: unknown, pathExpressionValues: Record<string, unknown>): R
export function set(input: unknown, pathExpressionValues: Record<string, unknown>): unknown {
  const result = Object.entries(pathExpressionValues)
    .flatMap(([pathExpression, replacementValue]) =>
      Array.from(jsonMatch(input, pathExpression)).map((matchEntry) => ({
        ...matchEntry,
        replacementValue,
      })),
    )
    .reduce((acc, {path, replacementValue}) => setDeep(acc, path, replacementValue), input)

  return ensureArrayKeysDeep(result)
}

/**
 * Given an input object and a record of path expressions to values, this
 * function will set each match with the given value **if the value at the current
 * path is missing** (i.e. `null` or `undefined`).
 *
 * ```js
 * const output = setIfMissing(
 *   {items: [null, 'initial']},
 *   {'items[:]': 'changed'}
 * );
 *
 * // { items: ['changed', 'initial'] }
 * console.log(output);
 * ```
 */
export function setIfMissing<R>(input: unknown, pathExpressionValues: Record<string, unknown>): R
export function setIfMissing(
  input: unknown,
  pathExpressionValues: Record<string, unknown>,
): unknown {
  const result = Object.entries(pathExpressionValues)
    .flatMap(([pathExpression, replacementValue]) => {
      return Array.from(jsonMatch(input, pathExpression)).map((matchEntry) => ({
        ...matchEntry,
        replacementValue,
      }))
    })
    .filter((matchEntry) => matchEntry.value === null || matchEntry.value === undefined)
    .reduce((acc, {path, replacementValue}) => setDeep(acc, path, replacementValue), input)

  return ensureArrayKeysDeep(result)
}

/**
 * Given an input object and an array of path expressions, this function will
 * remove each match from the input object.
 *
 * ```js
 * const output = unset(
 *   {name: {first: 'one', last: 'two'}},
 *   ['name.last']
 * );
 *
 * // { name: { first: 'one' } }
 * console.log(output);
 * ```
 */
export function unset<R>(input: unknown, pathExpressions: string[]): R
export function unset(input: unknown, pathExpressions: string[]): unknown {
  const result = pathExpressions
    .flatMap((pathExpression) => Array.from(jsonMatch(input, pathExpression)))
    // ensure that we remove in the reverse order the paths were found in
    // this is necessary for array unsets so the indexes don't change as we unset
    .reverse()
    .reduce((acc, {path}) => unsetDeep(acc, path), input)

  return ensureArrayKeysDeep(result)
}

/**
 * Given an input object, a path expression (inside the insert patch object), and an array of items,
 * this function will insert or replace the matched items.
 *
 * **Insert before:**
 *
 * ```js
 * const input = {some: {array: ['a', 'b', 'c']}}
 * const output = insert(
 *   input,
 *   {
 *     before: 'some.array[1]',
 *     items: ['!']
 *   }
 * );
 * // { some: { array: ['a', '!', 'b', 'c'] } }
 * console.log(output);
 * ```
 *
 * **Insert before with negative index (append):**
 *
 * ```js
 * const input = {some: {array: ['a', 'b', 'c']}}
 * const output = insert(
 *   input,
 *   {
 *     before: 'some.array[-1]',
 *     items: ['!']
 *   }
 * );
 * // { some: { array: ['a', 'b', 'c', '!'] } }
 * console.log(output);
 * ```
 *
 * **Insert after:**
 *
 * ```js
 * const input = {some: {array: ['a', 'b', 'c']}}
 * const output = insert(
 *   input,
 *   {
 *     after: 'some.array[1]',
 *     items: ['!']
 *   }
 * );
 * // { some: { array: ['a', 'b', '!', 'c'] } }
 * console.log(output);
 * ```
 *
 * **Replace:**
 *
 * ```js
 * const output = insert(
 *   { some: { array: ['a', 'b', 'c'] } },
 *   {
 *     replace: 'some.array[1]',
 *     items: ['!']
 *   }
 * );
 * // { some: { array: ['a', '!', 'c'] } }
 * console.log(output);
 * ```
 *
 * **Replace many:**
 *
 * ```js
 * const input = {some: {array: ['a', 'b', 'c', 'd']}}
 * const output = insert(
 *   input,
 *   {
 *     replace: 'some.array[1:3]',
 *     items: ['!', '?']
 *   }
 * );
 * // { some: { array: ['a', '!', '?', 'd'] } }
 * console.log(output);
 * ```
 */
export function insert<R>(input: unknown, insertPatch: InsertPatch): R
export function insert(input: unknown, {items, ...insertPatch}: InsertPatch): unknown {
  let operation
  let pathExpression

  // behavior observed from content-lake when inserting:
  // 1. if the operation is before, out of all the matches, it will use the
  //    insert the items before the first match that appears in the array
  // 2. if the operation is after, it will insert the items after the first
  //    match that appears in the array
  // 3. if the operation is replace, then insert the items before the first
  //    match and then delete the rest
  if ('before' in insertPatch) {
    operation = 'before' as const
    pathExpression = insertPatch.before
  } else if ('after' in insertPatch) {
    operation = 'after' as const
    pathExpression = insertPatch.after
  } else if ('replace' in insertPatch) {
    operation = 'replace' as const
    pathExpression = insertPatch.replace
  }
  if (!operation) return input
  if (typeof pathExpression !== 'string') return input

  // in order to do an insert patch, you need to provide at least one path segment
  if (!pathExpression.length) return input

  const arrayPath = slicePath(pathExpression, 0, -1)
  const positionPath = slicePath(pathExpression, -1)

  let result = input

  for (const {path, value} of jsonMatch(input, arrayPath)) {
    if (!Array.isArray(value)) continue
    let arr = value

    switch (operation) {
      case 'replace': {
        const indexesToRemove = new Set<number>()
        let position = Infinity

        for (const itemMatch of jsonMatch(arr, positionPath)) {
          // there should only be one path segment for an insert patch, invalid otherwise
          if (itemMatch.path.length !== 1) continue
          const [segment] = itemMatch.path
          if (typeof segment === 'string') continue

          let index

          if (typeof segment === 'number') index = segment
          if (typeof index === 'number' && index < 0) index = arr.length + index
          if (isKeySegment(segment)) index = getIndexForKey(arr, segment._key)
          if (typeof index !== 'number') continue
          if (index < 0) index = arr.length + index

          indexesToRemove.add(index)
          if (index < position) position = index
        }

        if (position === Infinity) continue

        // remove all other indexes
        arr = arr
          .map((item, index) => ({item, index}))
          .filter(({index}) => !indexesToRemove.has(index))
          .map(({item}) => item)

        // insert at the min index
        arr = [...arr.slice(0, position), ...items, ...arr.slice(position, arr.length)]

        break
      }
      case 'before': {
        let position = Infinity

        for (const itemMatch of jsonMatch(arr, positionPath)) {
          if (itemMatch.path.length !== 1) continue
          const [segment] = itemMatch.path

          if (typeof segment === 'string') continue

          let index

          if (typeof segment === 'number') index = segment
          if (typeof index === 'number' && index < 0) index = arr.length + index
          if (isKeySegment(segment)) index = getIndexForKey(arr, segment._key)
          if (typeof index !== 'number') continue
          if (index < 0) index = arr.length - index
          if (index < position) position = index
        }

        if (position === Infinity) continue

        arr = [...arr.slice(0, position), ...items, ...arr.slice(position, arr.length)]

        break
      }
      case 'after': {
        let position = -Infinity

        for (const itemMatch of jsonMatch(arr, positionPath)) {
          if (itemMatch.path.length !== 1) continue
          const [segment] = itemMatch.path

          if (typeof segment === 'string') continue

          let index

          if (typeof segment === 'number') index = segment
          if (typeof index === 'number' && index < 0) index = arr.length + index
          if (isKeySegment(segment)) index = getIndexForKey(arr, segment._key)
          if (typeof index !== 'number') continue
          if (index > position) position = index
        }

        if (position === -Infinity) continue

        arr = [...arr.slice(0, position + 1), ...items, ...arr.slice(position + 1, arr.length)]

        break
      }

      default: {
        continue
      }
    }

    result = setDeep(result, path, arr)
  }

  return ensureArrayKeysDeep(result)
}

/**
 * Given an input object and a record of path expressions to numeric values,
 * this function will increment each match with the given value.
 *
 * ```js
 * const output = inc(
 *   {foo: {first: 3, second: 4.5}},
 *   {'foo.first': 3, 'foo.second': 4}
 * );
 *
 * // { foo: { first: 6, second: 8.5 } }
 * console.log(output);
 * ```
 */
export function inc<R>(input: unknown, pathExpressionValues: Record<string, number>): R
export function inc(input: unknown, pathExpressionValues: Record<string, number>): unknown {
  const result = Object.entries(pathExpressionValues)
    .flatMap(([pathExpression, valueToAdd]) =>
      Array.from(jsonMatch(input, pathExpression)).map((matchEntry) => ({
        ...matchEntry,
        valueToAdd,
      })),
    )
    .filter(
      <T extends {value: unknown}>(matchEntry: T): matchEntry is T & {value: number} =>
        typeof matchEntry.value === 'number',
    )
    .reduce((acc, {path, value, valueToAdd}) => setDeep(acc, path, value + valueToAdd), input)

  return ensureArrayKeysDeep(result)
}

/**
 * Given an input object and a record of path expressions to numeric values,
 * this function will decrement each match with the given value.
 *
 * ```js
 * const output = dec(
 *   {foo: {first: 3, second: 4.5}},
 *   {'foo.first': 3, 'foo.second': 4}
 * );
 *
 * // { foo: { first: 0, second: 0.5 } }
 * console.log(output);
 * ```
 */
export function dec<R>(input: unknown, pathExpressionValues: Record<string, number>): R
export function dec(input: unknown, pathExpressionValues: Record<string, number>): unknown {
  const result = inc(
    input,
    Object.fromEntries(
      Object.entries(pathExpressionValues)
        .filter(([, value]) => typeof value === 'number')
        .map(([key, value]) => [key, -value]),
    ),
  )

  return ensureArrayKeysDeep(result)
}

/**
 * Given an input object and a record of paths to [diff match patches][0], this
 * function will apply the diff match patch for the string at each match.
 *
 * [0]: https://www.sanity.io/docs/http-patches#aTbJhlAJ
 *
 * ```js
 * const output = diffMatchPatch(
 *   {foo: 'the quick brown fox'},
 *   {'foo': '@@ -13,7 +13,7 @@\n own \n-fox\n+cat\n'}
 * );
 *
 * // { foo: 'the quick brown cat' }
 * console.log(output);
 * ```
 */
export function diffMatchPatch<R>(input: unknown, pathExpressionValues: Record<string, string>): R
export function diffMatchPatch(
  input: unknown,
  pathExpressionValues: Record<string, string>,
): unknown {
  const result = Object.entries(pathExpressionValues)
    .flatMap(([pathExpression, dmp]) =>
      Array.from(jsonMatch(input, pathExpression)).map((m) => ({...m, dmp})),
    )
    .filter((i) => i.value !== undefined)
    .map(({path, value, dmp}) => {
      if (typeof value !== 'string') {
        throw new Error(
          `Can't diff-match-patch \`${JSON.stringify(value)}\` at path \`${stringifyPath(path)}\`, because it is not a string`,
        )
      }

      const [nextValue] = applyPatches(parsePatch(dmp), value)
      return {path, value: nextValue}
    })
    .reduce((acc, {path, value}) => setDeep(acc, path, value), input)

  return ensureArrayKeysDeep(result)
}

/**
 * Simply checks if the given document input has a `_rev` that matches the given
 * `revisionId` and throws otherwise.
 *
 * (No code example provided.)
 */
export function ifRevisionID<R>(input: unknown, revisionId: string): R
export function ifRevisionID(input: unknown, revisionId: string): unknown {
  const inputRev =
    typeof input === 'object' && !!input && '_rev' in input && typeof input._rev === 'string'
      ? input._rev
      : undefined

  if (typeof inputRev !== 'string') {
    throw new Error(`Patch specified \`ifRevisionID\` but could not find document's revision ID.`)
  }

  if (revisionId !== inputRev) {
    throw new Error(
      `Patch's \`ifRevisionID\` \`${revisionId}\` does not match document's revision ID \`${inputRev}\``,
    )
  }

  return input
}

/**
 * Gets a value deep inside of an object given a path. If the path does not
 * exist in the object, `undefined` will be returned.
 */
export function getDeep<R>(input: unknown, path: SingleValuePath): R
export function getDeep(input: unknown, path: SingleValuePath): unknown {
  const [currentSegment, ...restOfPath] = path
  if (currentSegment === undefined) return input
  if (typeof input !== 'object' || input === null) return undefined

  let key
  if (isKeySegment(currentSegment)) {
    key = getIndexForKey(input, currentSegment._key)
  } else if (typeof currentSegment === 'string') {
    key = currentSegment
  } else if (typeof currentSegment === 'number') {
    key = currentSegment
  }

  if (key === undefined) return undefined

  // Use .at() to support negative indexes on arrays.
  const nestedInput =
    typeof key === 'number' && Array.isArray(input)
      ? input.at(key)
      : (input as Record<string, unknown>)[key]

  return getDeep(nestedInput, restOfPath)
}

/**
 * Sets a value deep inside of an object given a path. If the path does not
 * exist in the object, it will be created.
 */
export function setDeep<R>(input: unknown, path: SingleValuePath, value: unknown): R
export function setDeep(input: unknown, path: SingleValuePath, value: unknown): unknown {
  const [currentSegment, ...restOfPath] = path
  if (currentSegment === undefined) return value

  // If the current input is not an object, create a new container.
  if (typeof input !== 'object' || input === null) {
    if (typeof currentSegment === 'string') {
      return {[currentSegment]: setDeep(null, restOfPath, value)}
    }

    let index: number | undefined
    if (isKeySegment(currentSegment)) {
      // When creating a new array via a keyed segment, use index 0.
      index = 0
    } else if (typeof currentSegment === 'number' && currentSegment >= 0) {
      index = currentSegment
    } else {
      // For negative numbers in a non‐object we simply return input.
      return input
    }

    return [
      // fill until index
      ...Array.from({length: index}).fill(null),
      // then set deep here
      setDeep(null, restOfPath, value),
    ]
  }

  // When input is an array…
  if (Array.isArray(input)) {
    let index: number | undefined
    if (isKeySegment(currentSegment)) {
      index = getIndexForKey(input, currentSegment._key) ?? input.length
    } else if (typeof currentSegment === 'number') {
      // Support negative indexes by computing the proper positive index.
      index = currentSegment < 0 ? input.length + currentSegment : currentSegment
    }
    if (index === undefined) return input

    if (index in input) {
      // Update the element at the resolved index.
      return input.map((nestedInput, i) =>
        i === index ? setDeep(nestedInput, restOfPath, value) : nestedInput,
      )
    }

    // Expand the array if needed.
    return [
      ...input,
      ...Array.from({length: index - input.length}).fill(null),
      setDeep(null, restOfPath, value),
    ]
  }

  // For keyed segments that aren't arrays, do nothing.
  if (typeof currentSegment === 'object') return input

  // For plain objects, update an existing property if it exists…
  if (currentSegment in input) {
    return Object.fromEntries(
      Object.entries(input).map(([key, nestedInput]) =>
        key === currentSegment
          ? [key, setDeep(nestedInput, restOfPath, value)]
          : [key, nestedInput],
      ),
    )
  }

  // ...otherwise create the new nested path.
  return {...input, [currentSegment]: setDeep(null, restOfPath, value)}
}

/**
 * Given an object and an exact path as an array, this unsets the value at the
 * given path.
 */
export function unsetDeep<R>(input: unknown, path: SingleValuePath): R
export function unsetDeep(input: unknown, path: SingleValuePath): unknown {
  const [currentSegment, ...restOfPath] = path
  if (currentSegment === undefined) return input
  if (typeof input !== 'object' || input === null) return input

  let _segment: string | number | undefined
  if (isKeySegment(currentSegment)) {
    _segment = getIndexForKey(input, currentSegment._key)
  } else if (typeof currentSegment === 'string' || typeof currentSegment === 'number') {
    _segment = currentSegment
  }
  if (_segment === undefined) return input

  // For numeric segments in arrays, compute the positive index.
  let segment: string | number = _segment
  if (typeof segment === 'number' && Array.isArray(input)) {
    segment = segment < 0 ? input.length + segment : segment
  }
  if (!(segment in input)) return input

  // If we're at the final segment, remove the property/element.
  if (!restOfPath.length) {
    if (Array.isArray(input)) {
      return input.filter((_nestedInput, index) => index !== segment)
    }
    return Object.fromEntries(Object.entries(input).filter(([key]) => key !== segment.toString()))
  }

  // Otherwise, recurse into the nested value.
  if (Array.isArray(input)) {
    return input.map((nestedInput, index) =>
      index === segment ? unsetDeep(nestedInput, restOfPath) : nestedInput,
    )
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) =>
      key === segment ? [key, unsetDeep(value, restOfPath)] : [key, value],
    ),
  )
}
