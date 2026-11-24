import {
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete'
import {syntaxTree} from '@codemirror/language'
import {type EditorState} from '@codemirror/state'
import {type Tooltip} from '@codemirror/view'
import {type SchemaType} from 'sanity'

import {
  type GroqEditorLabels,
  groqEditorLabels,
  queryParamValues,
  querySchema,
} from './groqEditorContext'
import {type GroqNode, parseGroq} from './groqFunctions'
import {type DocParts, renderDoc} from './groqHoverDoc'
import {
  findGroqOperator,
  findGroqValueDoc,
  findSystemField,
  GROQ_OPERATORS_REFERENCE_URL,
  isOperatorNode,
} from './groqOperatorReference'
import {inferQueryParams} from './paramInference'
import {
  describeShape,
  fieldsOfShape,
  inspectQuery,
  isObjectShape,
  REFERENCE_FIELDS,
  type Shape,
  type ShapeField,
  SYSTEM_FIELDS,
  typeValuesOf,
  visitQueryFields,
} from './schemaCheck'

/** A field name being typed, or none yet */
const WORD_BEFORE_CURSOR = /[A-Za-z_][A-Za-z0-9_]*$/
/** After these, a field name comes next: completions open before anything is typed */
const FIELD_OPENER_BEFORE = /(?:\.|->|\{|\[|,)\s*$/
/**
 * Stands in for the field name not typed yet, so `author->` and `author.` parse as a field
 * access the schema checks can follow; no schema declares it
 */
const PLACEHOLDER = '_visionCompletionPlaceholder_'
/** A document type name typed in the string `_type` is compared to */
const TYPE_VALUE_BEFORE_CURSOR =
  /(?:_type\s*[!=]=\s*|_type\s+in\s+\[(?:\s*(?:"[^"]*"|'[^']*')\s*,)*\s*)(["'])([\w.-]*)$/

/** Every document has these, as does every object in an array (`_key`) */
const SYSTEM_FIELD_ORDER = ['_id', '_type', '_createdAt', '_updatedAt', '_rev', '_key']

function inCommentOrString(state: EditorState, pos: number): boolean {
  for (
    let node: GroqNode | null = syntaxTree(state).resolveInner(pos, -1);
    node;
    node = node.parent
  ) {
    if (node.name === 'String' || node.name === 'LineComment' || node.name === 'BlockComment') {
      return true
    }
  }
  return false
}

/** `reference → author`, `array of book, string`, `slug`: a field's type as the hover and list show it */
export function describeFieldType(type: SchemaType): string {
  try {
    if ('to' in type && Array.isArray(type.to) && type.to.length > 0) {
      return `reference → ${type.to.map((target: SchemaType) => target.name).join(' | ')}`
    }
    if (type.jsonType === 'array' && 'of' in type && Array.isArray(type.of)) {
      const members = type.of.map((member: SchemaType) =>
        'to' in member && Array.isArray(member.to)
          ? `→ ${member.to.map((target: SchemaType) => target.name).join(' | ')}`
          : member.name,
      )
      return members.length > 0 ? `array of ${[...new Set(members)].join(', ')}` : 'array'
    }
    return type.name
  } catch {
    return 'unknown'
  }
}

/** The field's title and description from the schema, for the completion info and hover */
function describeField(field: ShapeField, fieldOf: (types: string) => string): string[] {
  const lines: string[] = []
  const {title, description} = field.type
  if (title && title.toLowerCase() !== field.name.toLowerCase()) lines.push(title)
  if (typeof description === 'string' && description) lines.push(description)
  lines.push(fieldOf(field.owners.join(', ')))
  return lines
}

function renderFieldInfo(code: string, lines: string[]): HTMLElement {
  const [description, ...notes] = lines
  return renderDoc({code, description, notes})
}

/** The value a field name typed at `from`…`to` is read from, as far as the schema knows */
function fieldScopeAt(state: EditorState, from: number, to: number): Shape | undefined {
  const schema = state.facet(querySchema)
  if (!schema) return undefined
  const doc = state.doc.toString()
  const query = from === to ? doc.slice(0, from) + PLACEHOLDER + doc.slice(to) : doc
  const visits = visitQueryFields(parseGroq(query), query, schema, state.facet(queryParamValues))
  return visits.find((visit) => visit.from === from)?.scope
}

/**
 * Field names, from the workspace schema, for the value the field is read from: in a filter or a
 * projection the documents of the types the query pins `_type` to (with a string or a param from
 * the params JSON), after `.` or `->` the object or the referenced documents. Nothing is offered
 * where the schema does not tell, so a query over unpinned documents gets no guesses.
 */
export function schemaFieldCompletions(context: CompletionContext): CompletionResult | null {
  const {state, pos, explicit} = context
  const labels = state.facet(groqEditorLabels)
  if (!labels || !state.facet(querySchema)) return null
  const word = context.matchBefore(WORD_BEFORE_CURSOR)
  const from = word?.from ?? pos
  const before = state.sliceDoc(Math.max(0, from - 40), from)
  if (before.endsWith('$') || before.endsWith('::') || /\d$/.test(before)) return null
  if (!word && !explicit && !FIELD_OPENER_BEFORE.test(before)) return null
  if (inCommentOrString(state, pos)) return null

  const scope = fieldScopeAt(state, from, word?.to ?? pos)
  if (!scope || !isObjectShape(scope)) return null
  const reference =
    scope.kind === 'reference' || (scope.kind === 'array' && scope.of.kind === 'reference')
  const options: Completion[] = []
  if (reference) {
    for (const name of REFERENCE_FIELDS) {
      options.push({label: name, type: 'property', detail: labels.systemField})
    }
  } else {
    for (const field of fieldsOfShape(scope)) {
      const typeLabel = describeFieldType(field.type)
      options.push({
        label: field.name,
        type: 'property',
        detail: typeLabel,
        info: () =>
          renderFieldInfo(`${field.name}: ${typeLabel}`, describeField(field, labels.fieldOf)),
      })
    }
    for (const name of SYSTEM_FIELD_ORDER) {
      if (SYSTEM_FIELDS.has(name)) {
        options.push({label: name, type: 'property', detail: labels.systemField})
      }
    }
  }
  const matching = filterByTyped(options, word?.text ?? '')
  if (matching.length === 0) return null
  return {from, options: matching, filter: false}
}

/**
 * The options that start with, or else contain, what is typed, in the order given. The list is
 * not left to CodeMirror's filter: it ranks every option a source filters itself above every
 * option it filters for it, so the generic functions of the function source, which do their own
 * filtering, would sit above the schema's fields. A source that does not filter lists its options
 * in the order the sources are registered and the options are given, so the fields come first,
 * the schema's own before the system fields.
 */
function filterByTyped(options: Completion[], typed: string): Completion[] {
  if (!typed) return options
  const needle = typed.toLowerCase()
  const starting: Completion[] = []
  const containing: Completion[] = []
  for (const option of options) {
    const label = option.label.toLowerCase()
    if (label.startsWith(needle)) starting.push(option)
    else if (label.includes(needle)) containing.push(option)
  }
  return [...starting, ...containing]
}

/**
 * Document type names in the string `_type` is compared to (`_type == "`, `_type in ["post", "`),
 * the workspace's own types first
 */
export function typeValueCompletions(context: CompletionContext): CompletionResult | null {
  const {state} = context
  const schema = state.facet(querySchema)
  const labels = state.facet(groqEditorLabels)
  if (!schema || !labels) return null
  const match = context.matchBefore(TYPE_VALUE_BEFORE_CURSOR)
  if (!match) return null
  const typed = /[\w.-]*$/.exec(match.text)?.[0] ?? ''
  const from = match.to - typed.length
  const options: Completion[] = [...schema.documents.values()].map((type, index) => ({
    label: type.name,
    type: 'type',
    detail: type.title && type.title !== type.name ? type.title : labels.documentType,
    // Keeps the workspace's own types above the `sanity.` and `system.` ones
    boost: -Math.min(index, 99),
  }))
  if (options.length === 0) return null
  return {from, options, validFor: /^[\w.-]*$/}
}

const MAX_LITERAL_LENGTH = 120
const MAX_LIST_OPTIONS = 12

/** A value as a literal type, the way typegen prints it: `"author"`, `["a", "b"]`, `42` */
function literalType(value: unknown): string {
  const text = JSON.stringify(value) ?? 'undefined'
  return text.length > MAX_LITERAL_LENGTH ? `${text.slice(0, MAX_LITERAL_LENGTH - 1)}…` : text
}

function unionOf(values: readonly unknown[]): string {
  return values.map(literalType).join(' | ')
}

/** A field's type, or the values its `options.list` allows: `"draft" | "published"` */
function fieldTypeOf(type: SchemaType): string {
  try {
    const list: unknown = type.options && 'list' in type.options ? type.options.list : undefined
    if (type.jsonType !== 'array' && Array.isArray(list) && list.length > 0) {
      const values = list.map((item: unknown) =>
        item && typeof item === 'object' && 'value' in item ? item.value : item,
      )
      if (
        values.length <= MAX_LIST_OPTIONS &&
        values.every((value) => typeof value === 'string' || typeof value === 'number')
      ) {
        return unionOf(values)
      }
    }
  } catch {
    // An options list the schema resolves lazily and cannot: its type is shown instead
  }
  return describeFieldType(type)
}

function itemShape(shape: Shape): Shape {
  return shape.kind === 'array' ? itemShape(shape.of) : shape
}

/** The type of the field `name`, read from a value of shape `scope`, with what the schema says of it */
function fieldDoc(name: string, scope: Shape, labels: GroqEditorLabels): DocParts | undefined {
  const field = fieldsOfShape(scope).find((candidate) => candidate.name === name)
  if (field) {
    const [description, ...notes] = describeField(field, labels.fieldOf)
    return {code: `${name}: ${fieldTypeOf(field.type)}`, description, notes}
  }
  const item = itemShape(scope)
  const known =
    item.kind === 'reference'
      ? REFERENCE_FIELDS.has(name)
      : item.kind === 'unknown'
        ? SYSTEM_FIELDS.has(name) || REFERENCE_FIELDS.has(name)
        : SYSTEM_FIELDS.has(name)
  const system = known ? findSystemField(name) : undefined
  if (!system) return undefined
  const typeValues = name === '_type' ? typeValuesOf(scope) : undefined
  return {
    code: `${name}: ${typeValues ? unionOf(typeValues) : system.type}`,
    description: system.description,
    notes: [labels.systemField],
  }
}

/** A `$param`'s value in the params, or the type the query expects of it when it has none yet */
function paramDoc(
  name: string,
  state: EditorState,
  query: string,
  labels: GroqEditorLabels,
): DocParts {
  const params = state.facet(queryParamValues)
  // The params form fills in `""` for each param the query uses, until it is given a value
  if (Object.hasOwn(params, name) && params[name] !== '') {
    return {code: `$${name}: ${literalType(params[name])}`, notes: [labels.paramValue]}
  }
  const schema = state.facet(querySchema)
  const inferred = inferQueryParams(query, {
    documentTypes: schema ? [...schema.documents.keys()] : undefined,
  }).params.find((param) => param.name === name)?.type
  const base = inferred?.options ? unionOf(inferred.options) : (inferred?.kind ?? 'any')
  const type = inferred?.array ? `array of ${inferred.options ? `(${base})` : base}` : base
  return {code: `$${name}: ${type}`, notes: [labels.paramNotSet]}
}

function stringLiteral(text: string): string | undefined {
  if (!text.startsWith('"')) return text.slice(1, -1)
  try {
    const value: unknown = JSON.parse(text)
    return typeof value === 'string' ? value : undefined
  } catch {
    return undefined
  }
}

interface Hover {
  from: number
  to: number
  doc: DocParts
}

function hoverOf(state: EditorState, pos: number, side: -1 | 1): Hover | undefined {
  const labels = state.facet(groqEditorLabels)
  if (!labels) return undefined
  const schema = state.facet(querySchema)
  const query = state.doc.toString()
  const node = syntaxTree(state).resolveInner(pos, side)
  const at = {from: node.from, to: node.to}
  const text = query.slice(node.from, node.to)
  const inspect = () =>
    schema
      ? inspectQuery(parseGroq(query), query, schema, state.facet(queryParamValues))
      : undefined

  if (node.name === 'Parameter') {
    return {...at, doc: paramDoc(text.slice(1), state, query, labels)}
  }
  if (node.name === 'Identifier') {
    const visit = inspect()?.fields.find((candidate) => candidate.from === node.from)
    const doc = visit ? fieldDoc(text, visit.scope, labels) : undefined
    return doc ? {...at, doc} : undefined
  }
  if (node.name === 'Everything' || node.name === 'This' || node.name === 'Parent') {
    const visit = inspect()?.values.find((candidate) => candidate.from === node.from)
    const shape = visit && visit.shape.kind !== 'unknown' ? describeShape(visit.shape) : undefined
    return {
      ...at,
      doc: {code: shape ? `${text}: ${shape}` : text, description: findGroqValueDoc(text)},
    }
  }
  const string = node.parent?.name === 'String' ? node.parent : node.name === 'String' ? node : null
  if (string) {
    // A document type name, as `_type` is compared to
    const value = stringLiteral(query.slice(string.from, string.to))
    const type = value === undefined ? undefined : schema?.documents.get(value)
    if (!type) return undefined
    return {
      from: string.from,
      to: string.to,
      doc: {code: literalType(value), description: type.title, notes: [labels.documentType]},
    }
  }
  if (isOperatorNode(node.name)) {
    const operator = findGroqOperator(text)
    if (!operator) return undefined
    let code = operator.signature
    if (node.name === 'Deref') {
      const visit = inspect()?.values.find((candidate) => candidate.from === node.from)
      // After `[]`, each item's reference leads to one document
      const target = visit ? itemShape(visit.shape) : undefined
      if (target && target.kind !== 'unknown') code = `<reference> -> ${describeShape(target)}`
    }
    return {
      ...at,
      doc: {
        code,
        description: operator.description,
        link: {href: GROQ_OPERATORS_REFERENCE_URL, text: labels.operatorReference},
      },
    }
  }
  return undefined
}

/**
 * The resolved type of what the pointer is on, the way typegen would print it: a field (`_type`
 * of a filtered query is `"pokemon"`), a system attribute, a `$param` by its value in the params,
 * `*`, `@`, `^` and `->` by what they stand for, and an operator with its documentation
 */
export function typeHoverAt(state: EditorState, pos: number, side: -1 | 1): Tooltip | null {
  const hover = hoverOf(state, pos, side)
  if (!hover) return null
  return {
    pos: hover.from,
    end: hover.to,
    above: true,
    create: () => ({dom: renderDoc(hover.doc)}),
  }
}
