import {
  isIndexSegment,
  isIndexTuple,
  isKeySegment,
  isReferenceSchemaType,
  type CrossDatasetType,
  type PathSegment,
  type SchemaType,
} from '@sanity/types'
import {fromString as pathFromString} from '@sanity/util/paths'

import {fieldNeedsEscape} from '../../util/searchUtils'

const IMPLICIT_SCHEMA_TYPE_FIELDS = ['_id', '_type', '_createdAt', '_updatedAt', '_rev']

/**
 * @internal
 *
 * Options controlling error reporting behaviour while walking a sort
 * field path against the schema.
 */
export interface CompileFieldPathOptions {
  /**
   * When `true`, unknown fields / unsupported path shapes throw. When
   * `false`, they `console.warn` (deduplicated) and the partial result
   * is returned.
   */
  strict?: boolean
  /**
   * Optional human-readable name of the ordering, used in error
   * messages to help developers locate the misconfigured ordering.
   */
  orderingName?: string
  /**
   * Internal flag used while probing multi-target references. When
   * `true`, resolution failures are silent — neither thrown nor
   * warned. Callers use this to try multiple reference targets
   * without surfacing per-target failures.
   *
   * @internal
   */
  silent?: boolean
}

const warnedMessages = new Set<string>()

/** @internal */
export function resetCompileFieldPathWarningCache(): void {
  warnedMessages.clear()
}

function reportError(message: string, strict: boolean, silent: boolean = false): void {
  if (silent) {
    return
  }
  if (strict) {
    throw new Error(message)
  }
  if (!warnedMessages.has(message)) {
    warnedMessages.add(message)
    console.warn(message)
  }
}

function formatOrderingLabel(orderingName: string | undefined): string {
  return orderingName
    ? `The sort ordering "${orderingName}" references`
    : 'A sort ordering references'
}

/**
 * @internal
 *
 * Compiles a single sort field path against the given schema type
 * into a GROQ expression that can be used inside a projection.
 *
 * Returns the schema-aware GROQ expression as a plain string. Every
 * compiled expression is intended to be projected into the
 * top-level `orderings[N]` array and addressed via that positional
 * index.
 *
 * Examples:
 * - `title` → `title`
 * - `author.name` (where `author` is a reference) → `author->name`
 * - `items[0].value` (where `items[]` is an array of references) →
 *   `items[0]->value`
 * - `items[_key=="abc"].value` → `items[_key=="abc"]->value`
 * - `translations.se` (where `translations` is an object) →
 *   `translations.se`
 * - `string::length(title)` → `string::length(title)` (treated as
 *   literal GROQ since it isn't a schema-walkable path)
 *
 * If `schemaType` is `undefined` (e.g. cross-dataset, or the field
 * is a built-in like `_id`), the path is treated as a literal GROQ
 * expression — no inference is performed.
 *
 * If a path segment cannot be resolved against the schema, the
 * function reports an error via `reportError` (throwing in strict
 * mode, warning otherwise) and returns the input `fieldPath` as-is.
 */
export function compileFieldPath(
  schemaType: SchemaType | CrossDatasetType | undefined,
  fieldPath: string,
  options: CompileFieldPathOptions = {},
): string {
  const {strict = false, orderingName} = options

  if (!fieldPath) {
    return fieldPath
  }

  const segments = pathFromString(fieldPath)

  // Top-level complex GROQ expressions (e.g. `string::length(title)`,
  // `count(items)`) are parsed as a single segment that doesn't
  // correspond to any schema field. Skip schema walking entirely
  // and treat the expression as literal GROQ.
  if (segments.length === 1 && typeof segments[0] === 'string' && fieldNeedsEscape(fieldPath)) {
    return fieldPath
  }

  // Cross-dataset and missing schema types: treat the path as literal
  // GROQ. No inference is possible without a schema to walk.
  if (!schemaType || !('fields' in schemaType)) {
    return fieldPath
  }

  const compiled = compileSegments(schemaType, segments, {strict, orderingName})

  // Resolution failed; fall back to the literal expression.
  return compiled ?? fieldPath
}

/**
 * Recursively compiles a parsed path against a schema type, returning
 * the resulting GROQ expression string. Returns `undefined` if the
 * path could not be fully resolved against the schema.
 */
function compileSegments(
  schemaType: SchemaType | CrossDatasetType,
  path: PathSegment[],
  options: Required<Pick<CompileFieldPathOptions, 'strict'>> &
    Pick<CompileFieldPathOptions, 'orderingName' | 'silent'>,
): string | undefined {
  const [head, ...rest] = path
  if (head === undefined) {
    return ''
  }

  // Numeric or keyed-access leading segments are not meaningful at
  // this level: they should always follow a field name.
  if (typeof head !== 'string') {
    reportError(
      `${formatOrderingLabel(options.orderingName)} an invalid path starting with a non-field segment.`,
      options.strict,
      options.silent,
    )
    return undefined
  }

  if (!('fields' in schemaType)) {
    const typeLabel = 'name' in schemaType ? schemaType.name : schemaType.type
    reportError(
      `${formatOrderingLabel(options.orderingName)} the field "${head}" on non-object schema type "${typeLabel}"`,
      options.strict,
      options.silent,
    )
    return undefined
  }

  const schemaField = schemaType.fields.find((field) => field.name === head)
  if (!schemaField) {
    if (IMPLICIT_SCHEMA_TYPE_FIELDS.includes(head)) {
      // Built-in document fields that aren't declared in the schema:
      // treat as a literal field reference and stop walking.
      return joinTail(head, rest)
    }
    const validFields = schemaType.fields.map((field) => field.name).join(', ')
    reportError(
      `${formatOrderingLabel(options.orderingName)} the nonexistent field "${head}" on schema type "${schemaType.name}". Valid fields are: ${validFields}`,
      options.strict,
      options.silent,
    )
    return undefined
  }

  const nextSegment = rest[0]
  const hasArrayAccessor =
    nextSegment !== undefined &&
    (isIndexSegment(nextSegment) || isKeySegment(nextSegment) || isIndexTuple(nextSegment))

  if (!hasArrayAccessor) {
    return compileFieldContinuation(head, schemaField.type, rest, options)
  }

  // Range slices are not meaningful for ordering.
  if (isIndexTuple(nextSegment)) {
    reportError(
      `${formatOrderingLabel(options.orderingName)} a range slice on "${head}" on schema type "${schemaType.name}". Range slices are not supported for ordering.`,
      options.strict,
      options.silent,
    )
    return undefined
  }

  if (schemaField.type.jsonType !== 'array') {
    reportError(
      `${formatOrderingLabel(options.orderingName)} array access on non-array field "${head}" on schema type "${schemaType.name}"`,
      options.strict,
      options.silent,
    )
    return undefined
  }

  const members = (
    'of' in schemaField.type && Array.isArray(schemaField.type.of) ? schemaField.type.of : []
  ) as SchemaType[]
  if (members.length !== 1) {
    reportError(
      `${formatOrderingLabel(options.orderingName)} array access on multi-type array field "${head}" on schema type "${schemaType.name}". Array ordering requires a single member type.`,
      options.strict,
      options.silent,
    )
    return undefined
  }

  const accessor =
    typeof nextSegment === 'number' ? `[${nextSegment}]` : `[_key=="${nextSegment._key}"]`
  const tail = rest.slice(1)
  const memberType = members[0]

  return compileFieldContinuation(`${head}${accessor}`, memberType, tail, options)
}

/**
 * After a field (or array-accessed field) has been resolved, decides
 * how to continue compiling the tail of the path:
 *
 * - No tail → emit the field as a leaf.
 * - Reference field → emit `->` and recurse into the target type.
 * - Object field → emit `.` and recurse into the field's type.
 */
function compileFieldContinuation(
  emittedSoFar: string,
  fieldType: SchemaType,
  tail: PathSegment[],
  options: Required<Pick<CompileFieldPathOptions, 'strict'>> &
    Pick<CompileFieldPathOptions, 'orderingName' | 'silent'>,
): string | undefined {
  if (tail.length === 0) {
    return emittedSoFar
  }

  if (isReferenceSchemaType(fieldType) && 'to' in fieldType) {
    // For multi-target references, GROQ's `->` follows the first
    // target whose `_type` matches at runtime. We need to pick a
    // reference target type to walk for schema resolution. Try each
    // target in turn and return the first that successfully compiles.
    //
    // Probe each target silently — a target that doesn't match isn't
    // an error, it just means we should try the next one. If *every*
    // target fails, surface a single resolution error.
    const probeOptions = {
      strict: false as const,
      orderingName: options.orderingName,
      silent: true,
    }
    for (const refType of fieldType.to) {
      const compiled = compileSegments(refType, tail, probeOptions)
      if (compiled !== undefined) {
        return `${emittedSoFar}->${compiled}`
      }
    }
    reportError(
      `${formatOrderingLabel(options.orderingName)} a path that does not resolve against any target type of the multi-target reference at "${emittedSoFar}".`,
      options.strict,
      options.silent,
    )
    return undefined
  }

  const inner = compileSegments(fieldType, tail, options)
  if (inner === undefined) {
    return undefined
  }
  return `${emittedSoFar}.${inner}`
}

/**
 * Given a head segment and remaining segments that didn't undergo
 * schema resolution (e.g. for built-in fields), join them into a
 * single GROQ expression. We assume no `->` is needed past this
 * point.
 */
function joinTail(head: string, tail: PathSegment[]): string {
  let out = head
  for (const seg of tail) {
    if (typeof seg === 'string') {
      out += `.${seg}`
    } else if (typeof seg === 'number') {
      out += `[${seg}]`
    } else if (isKeySegment(seg)) {
      out += `[_key=="${seg._key}"]`
    } else if (isIndexTuple(seg)) {
      out += `[${seg[0]}...${seg[1]}]`
    }
  }
  return out
}
