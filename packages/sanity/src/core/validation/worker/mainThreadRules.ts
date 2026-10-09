import {type SanityClient} from '@sanity/client'
import {
  type CurrentUser,
  isKeyedObject,
  type Path,
  type Rule,
  type RuleSpec,
  type SanityDocument,
  type Schema,
  type SchemaType,
  type ValidationContext,
  type ValidationMarker,
} from '@sanity/types'
import {ConcurrencyLimiter} from '@sanity/util/concurrency-limiter'
import {
  type LocaleSource,
  normalizeValidationRules,
  resolveTypeForArrayItem,
  Rule as RuleClass,
} from '@sanity/validation/_internal'

/* oxlint-disable typescript/no-deprecated -- this pass reads rule internals (`_rules`, `_fieldRules`) to find the rules the worker's manifest schema cannot carry */

const DEFAULT_MAX_CUSTOM_VALIDATION_CONCURRENCY = 5

export interface MainThreadRulesOptions {
  document: SanityDocument
  schema: Schema
  i18n: LocaleSource
  getClient: (options: {apiVersion: string}) => SanityClient
  getDocumentExists: (options: {id: string; signal?: AbortSignal}) => Promise<boolean>
  currentUser?: Omit<CurrentUser, 'role'> | null
  signal?: AbortSignal
}

type MainThreadDecision = {
  /** The rule to run here, or `undefined` when the worker covers all of it. */
  rule: Rule | undefined
  /** `Rule.fields()` maps, which the manifest does not carry at all. */
  fieldRules: NonNullable<Rule['_fieldRules']>[]
}

const customValidationConcurrencyLimiters = new WeakMap<Schema, ConcurrencyLimiter>()
// Per schema type: whether the type or anything nested in it owns a rule this pass must run.
const subtreeNeedsMainThread = new WeakMap<Schema, Map<SchemaType, boolean>>()

function isFieldReference(constraint: unknown): boolean {
  return (
    typeof constraint === 'object' &&
    constraint !== null &&
    (constraint as {type?: unknown}).type === RuleClass.FIELD_REF
  )
}

/**
 * Whether a spec is one the worker cannot evaluate: user code (`custom`, `media`), an `all` /
 * `either` combinator (removed from the worker's manifest, see `prepareManifestTypesForWorker`),
 * a constraint that references another field, or a rule without a constraint (`unique`,
 * `integer`, `email`, `positive`, `negative`); the manifest serialization drops the last two.
 */
function specNeedsMainThread(spec: RuleSpec): boolean {
  if (spec.flag === 'custom' || spec.flag === 'media') return true
  if (spec.flag === 'all' || spec.flag === 'either') return true
  if (!('constraint' in spec)) return true
  return isFieldReference(spec.constraint)
}

function ruleNeedsMainThread(rule: Rule): boolean {
  return rule._rules.some(specNeedsMainThread) || extractFieldRules(rule).length > 0
}

function extractFieldRules(rule: Rule): NonNullable<Rule['_fieldRules']>[] {
  const results: NonNullable<Rule['_fieldRules']>[] = []
  if (rule._fieldRules) results.push(rule._fieldRules)
  for (const spec of rule._rules) {
    if (spec.flag === 'all' || spec.flag === 'either') {
      for (const child of spec.constraint) results.push(...extractFieldRules(child))
    }
  }
  return results
}

/**
 * Splits a rule into the part the main thread must run. A slug's built-in structure and
 * uniqueness checks are custom validators internally, so they are selected here too; the worker
 * is told to skip uniqueness and the structure markers are deduplicated when merging.
 */
function decide(rule: Rule): MainThreadDecision {
  const fieldRules = extractFieldRules(rule)
  const specs = rule._rules.filter(specNeedsMainThread)
  if (specs.length === 0) return {rule: undefined, fieldRules}
  if (specs.length === rule._rules.length) return {rule, fieldRules}
  const partial = rule.clone()
  partial._rules = specs
  return {rule: partial, fieldRules}
}

function typeNeedsMainThread(schema: Schema, type: SchemaType): boolean {
  let cache = subtreeNeedsMainThread.get(schema)
  if (!cache) {
    cache = new Map()
    subtreeNeedsMainThread.set(schema, cache)
  }
  const visiting = new Set<SchemaType>()

  // Returns `[needsMainThread, definitive]`: a result reached by cutting a cycle is not cached,
  // since the cut branch could own a rule this pass must run.
  const compute = (candidate: SchemaType): [boolean, boolean] => {
    const cached = cache.get(candidate)
    if (cached !== undefined) return [cached, true]
    if (visiting.has(candidate)) return [false, false]
    visiting.add(candidate)
    try {
      const own = normalizeValidationRules(candidate).some(ruleNeedsMainThread)
      if (own) {
        cache.set(candidate, true)
        return [true, true]
      }
      let definitive = true
      const children: SchemaType[] = []
      if (candidate.jsonType === 'object') {
        children.push(...candidate.fields.map((field) => field.type))
      }
      if (candidate.jsonType === 'array') {
        children.push(...candidate.of)
      }
      for (const child of children) {
        const [needs, childDefinitive] = compute(child)
        if (needs) {
          cache.set(candidate, true)
          return [true, true]
        }
        definitive &&= childDefinitive
      }
      if (definitive) cache.set(candidate, false)
      return [false, definitive]
    } finally {
      visiting.delete(candidate)
    }
  }

  return compute(type)[0]
}

function resolveHidden(
  type: SchemaType | undefined,
  context: {
    document: SanityDocument
    parent: unknown
    value: unknown
    path: Path
    currentUser: Omit<CurrentUser, 'role'> | null
  },
  ancestorHidden: boolean,
): boolean {
  if (ancestorHidden || !type) return ancestorHidden
  const {hidden} = type
  if (typeof hidden === 'boolean' || hidden === undefined) return Boolean(hidden)
  // oxlint-disable-next-line no-unnecessary-boolean-literal-compare -- runtime callbacks may return non-booleans
  return hidden({...context, document: context.document as never}) === true
}

/**
 * Runs the rules of a document that the validation worker cannot run (see
 * {@link specNeedsMainThread}) directly through `Rule.validate`, with no idle-callback pacing:
 * these are a handful of user validators per document rather than a check per node.
 */
export async function validateMainThreadRules(
  options: MainThreadRulesOptions,
): Promise<ValidationMarker[]> {
  const {document, schema, i18n, getClient, getDocumentExists, signal} = options
  const currentUser = options.currentUser ?? null
  const documentType = schema.get(document._type)
  if (!documentType) return []

  let limiter = customValidationConcurrencyLimiters.get(schema)
  if (!limiter) {
    limiter = new ConcurrencyLimiter(DEFAULT_MAX_CUSTOM_VALIDATION_CONCURRENCY)
    customValidationConcurrencyLimiters.set(schema, limiter)
  }
  const internal = {customValidation: true, customValidationConcurrencyLimiter: limiter}

  const pending: Promise<ValidationMarker[]>[] = []

  const runRule = (rule: Rule, value: unknown, context: ValidationContext) => {
    pending.push(
      // `__internal` carries the custom validator concurrency limiter the package also uses; it
      // is not part of the public context type.
      rule.validate(value, {...context, __internal: internal} as ValidationContext),
    )
  }

  const visit = (
    value: unknown,
    type: SchemaType | undefined,
    path: Path,
    parent: unknown,
    ancestorHidden: boolean,
  ): void => {
    if (!type || signal?.aborted) return
    if (!typeNeedsMainThread(schema, type)) return

    const hidden = resolveHidden(type, {document, parent, value, path, currentUser}, ancestorHidden)
    // `currentUser` is not part of the public context type, but the in-thread pipeline passes it
    // through to validators, so this pass does too.
    const context: ValidationContext & {currentUser: typeof currentUser} = {
      document,
      parent,
      path,
      type,
      schema,
      getClient,
      getDocumentExists,
      i18n,
      environment: 'studio',
      currentUser,
      hidden,
      signal,
    }

    const rules = normalizeValidationRules(type, context)
    const fieldRuleMaps: NonNullable<Rule['_fieldRules']>[] = []
    for (const rule of rules) {
      const decision = decide(rule)
      if (decision.rule) runRule(decision.rule, value, context)
      fieldRuleMaps.push(...decision.fieldRules)
    }

    const selfIsRequired = rules.some((rule) => rule.isRequired())
    const runNestedObject =
      type.jsonType === 'object' &&
      (!!value || ((value === null || value === undefined) && selfIsRequired))
    const record =
      typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined

    if (runNestedObject) {
      const fieldTypes = Object.fromEntries(type.fields.map((field) => [field.name, field.type]))
      for (const fieldRuleMap of fieldRuleMaps) {
        for (const [name, validation] of Object.entries(fieldRuleMap)) {
          const fieldType = fieldTypes[name]
          const nestedValue = record?.[name]
          const fieldPath = [...path, name]
          const fieldContext: ValidationContext = {
            ...context,
            parent: value,
            path: fieldPath,
            type: fieldType,
            hidden: resolveHidden(
              fieldType,
              {document, parent: value, value: nestedValue, path: fieldPath, currentUser},
              hidden,
            ),
          }
          for (const subRule of normalizeValidationRules(
            {...fieldType, validation} as SchemaType,
            fieldContext,
          )) {
            runRule(subRule, nestedValue, fieldContext)
          }
        }
      }
      for (const field of type.fields) {
        visit(record?.[field.name], field.type, [...path, field.name], value, hidden)
      }
    }

    if (type.jsonType === 'array' && Array.isArray(value)) {
      value.forEach((item, index) => {
        visit(
          item,
          resolveTypeForArrayItem(item, type.of),
          [...path, isKeyedObject(item) ? {_key: item._key} : index],
          value,
          hidden,
        )
      })
    }
  }

  visit(document, documentType, [], undefined, false)

  const results = await Promise.all(pending)
  signal?.throwIfAborted()
  return results.flat()
}
