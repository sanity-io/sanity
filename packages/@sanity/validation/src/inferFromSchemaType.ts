import {type Schema, type SchemaType, type SchemaValidationValue} from '@sanity/types'

import {normalizeValidationRules} from './util/normalizeValidationRules'

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
    typeDef.validation = normalizeValidationRules(typeDef)
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
 * Checks if a validation function uses the context parameter.
 *
 * Functions with 2+ parameters like `(rule, context) => ...` need runtime context
 * (e.g., `context.hidden`, `context.document`) and cannot be pre-evaluated at schema compile time.
 *
 * Functions with 1 parameter like `(rule) => rule.required()` don't need context
 * and can be normalized immediately for better performance.
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

  // Function.length doesn't count rest parameters, so check the signature for patterns like
  // `(rule, ...args)` which would have length === 1 but still expects context
  const signature = Function.prototype.toString.call(validation)
  return /\(\s*\w+\s*,\s*\.\.\./.test(signature)
}
