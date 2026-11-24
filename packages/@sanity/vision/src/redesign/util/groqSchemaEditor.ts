import {
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete'
import {syntaxTree} from '@codemirror/language'
import {type EditorState} from '@codemirror/state'
import {type Tooltip} from '@codemirror/view'
import {type SchemaType} from 'sanity'

import {groqEditorLabels, queryParamValues, querySchema} from './groqEditorContext'
import {type GroqNode, parseGroq} from './groqFunctions'
import {
  fieldsOfShape,
  isObjectShape,
  REFERENCE_FIELDS,
  type Shape,
  type ShapeField,
  SYSTEM_FIELDS,
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
  const dom = document.createElement('div')
  dom.className = 'cm-vision-function-doc'
  const pre = document.createElement('pre')
  pre.className = 'cm-vision-function-code'
  pre.textContent = code
  dom.append(pre)
  for (const line of lines) {
    const paragraph = document.createElement('p')
    paragraph.className = 'cm-vision-function-description'
    paragraph.textContent = line
    dom.append(paragraph)
  }
  return dom
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
      options.push({label: name, type: 'property', detail: labels.systemField, boost: -1})
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
        options.push({label: name, type: 'property', detail: labels.systemField, boost: -1})
      }
    }
  }
  if (options.length === 0) return null
  return {from, options, validFor: /^\w*$/}
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

/** The schema type of the field under the pointer, with its title, description and owners */
export function fieldHoverAt(state: EditorState, pos: number, side: -1 | 1): Tooltip | null {
  const schema = state.facet(querySchema)
  const labels = state.facet(groqEditorLabels)
  if (!schema || !labels) return null
  const node = syntaxTree(state).resolveInner(pos, side)
  if (node.name !== 'Identifier') return null
  const query = state.doc.toString()
  const visits = visitQueryFields(parseGroq(query), query, schema, state.facet(queryParamValues))
  const visit = visits.find((candidate) => candidate.from === node.from)
  if (!visit) return null
  const name = query.slice(node.from, node.to)
  const field = fieldsOfShape(visit.scope).find((candidate) => candidate.name === name)
  if (!field) return null
  const typeLabel = describeFieldType(field.type)
  return {
    pos: node.from,
    end: node.to,
    above: true,
    create: () => ({
      dom: renderFieldInfo(`${name}: ${typeLabel}`, describeField(field, labels.fieldOf)),
    }),
  }
}
