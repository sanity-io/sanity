import {type Schema, type SchemaType, type SchemaValidationValue} from '@sanity/types'

import {compileValidationRules} from './util/normalizeValidationRules'

// NOTE: this overload is for TS API compatibility with a previous implementation
export function inferFromSchemaType(
  typeDef: SchemaType,
  // these are intentionally unused
  _schema: Schema,
  _visited?: Set<SchemaType>,
): SchemaType
// note: this seemingly redundant overload is required
export function inferFromSchemaType(typeDef: SchemaType): SchemaType
export function inferFromSchemaType(typeDef: SchemaType): SchemaType {
  traverse(typeDef, new Set())
  return typeDef
}

function traverse(typeDef: SchemaType, visited: Set<SchemaType>) {
  if (visited.has(typeDef)) {
    return
  }

  visited.add(typeDef)

  const usesValidationContext = hasValidationContext(typeDef.validation)

  // Only normalize validation at schema-compile time when it doesn't rely on runtime context.
  // Context-aware validation functions must be evaluated during validation, where context exists.
  if (!usesValidationContext) {
    typeDef.validation = compileValidationRules(typeDef)
  }

  if ('fields' in typeDef) {
    for (const field of typeDef.fields) {
      traverse(field.type, visited)
    }
  }

  if ('of' in typeDef) {
    for (const candidate of typeDef.of) {
      traverse(candidate, visited)
    }
  }

  // @ts-expect-error TODO (eventually): `annotations` does not exist on the SchemaType yet
  if (typeDef.annotations) {
    // @ts-expect-error TODO (eventually): `annotations` does not exist on the SchemaType yet
    for (const annotation of typeDef.annotations) {
      traverse(annotation, visited)
    }
  }
}

/**
 * Checks if a validation function may use the context parameter.
 *
 * Functions with 2+ parameters like `(rule, context) => ...` need runtime context
 * (e.g., `context.hidden`, `context.document`) and cannot be pre-evaluated at schema compile time.
 *
 * Simple functions with only a rule parameter can be normalized immediately.
 * Unrecognized signatures are deferred because their arity may hide context usage.
 *
 * @internal
 */
export function hasValidationContext(validation: SchemaValidationValue | undefined): boolean {
  if (!validation) return false
  if (Array.isArray(validation)) {
    return validation.some(hasValidationContext)
  }
  if (typeof validation !== 'function') return false

  // Check declared parameter count first (most common case)
  if (validation.length >= 2) return true

  // Default and rest parameters do not contribute to Function.length. Only compile
  // recognizable zero/one-parameter signatures; wrappers and unknown forms stay at runtime.
  const signature = Function.prototype.toString.call(validation)
  if (/\barguments\b|\[native code\]/.test(signature)) return true

  const simpleArrow = /^\s*(?:[\w$]+|\(\s*(?:[\w$]+\s*)?\))\s*=>/
  const simpleFunction = /^\s*(?:function(?:\s+[\w$]+)?|[\w$]+)\s*\(\s*(?:[\w$]+\s*)?\)\s*\{/
  return !simpleArrow.test(signature) && !simpleFunction.test(signature)
}
