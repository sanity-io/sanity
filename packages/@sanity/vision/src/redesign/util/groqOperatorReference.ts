/**
 * What GROQ's operators do, for the editor's hover, as the specification describes them:
 * https://spec.groq.dev/
 */
export const GROQ_OPERATORS_REFERENCE_URL =
  'https://www.sanity.io/docs/specifications/groq-operators'

export interface GroqOperatorDoc {
  /** As a signature: `<any> == <any> <boolean>` */
  signature: string
  description: string
}

const COMPARISON =
  'Compares numbers, strings or datetimes; `null` when the sides cannot be compared.'

const OPERATORS: Record<string, GroqOperatorDoc> = {
  '==': {signature: '<any> == <any> <boolean>', description: 'True when both sides are equal.'},
  '!=': {signature: '<any> != <any> <boolean>', description: 'True when the sides differ.'},
  '<': {signature: '<any> < <any> <boolean>', description: COMPARISON},
  '<=': {signature: '<any> <= <any> <boolean>', description: COMPARISON},
  '>': {signature: '<any> > <any> <boolean>', description: COMPARISON},
  '>=': {signature: '<any> >= <any> <boolean>', description: COMPARISON},
  '&&': {
    signature: '<boolean> && <boolean> <boolean>',
    description: 'True when both sides are true, false when either is false.',
  },
  '||': {
    signature: '<boolean> || <boolean> <boolean>',
    description: 'True when either side is true, false when both are false.',
  },
  '!': {signature: '!<boolean> <boolean>', description: 'Negates a boolean.'},
  'in': {
    signature: '<any> in <array|range> <boolean>',
    description:
      'True when the left side is an item of the array, or within the range, on the right.',
  },
  'match': {
    signature: '<string|array> match <string|array> <boolean>',
    description:
      'Full-text match: true when the text on the left has every word, or `prefix*` pattern, on the right.',
  },
  '+': {
    signature: '<number|string|array|object> + <same> <same>',
    description: 'Adds numbers, joins strings and arrays, and merges objects.',
  },
  '-': {signature: '<number> - <number> <number>', description: 'Subtracts numbers.'},
  '*': {signature: '<number> * <number> <number>', description: 'Multiplies numbers.'},
  '/': {signature: '<number> / <number> <number>', description: 'Divides numbers.'},
  '%': {
    signature: '<number> % <number> <number>',
    description: 'The remainder of dividing the left side by the right.',
  },
  '**': {
    signature: '<number> ** <number> <number>',
    description: 'Raises the left side to the power of the right.',
  },
  '->': {
    signature: '<reference> -> <document>',
    description: 'Follows a reference to the document it points to; `null` when there is none.',
  },
  '|': {
    signature: '<array> | order(…) | score(…)',
    description: 'Pipes the array on the left into `order()` or `score()`.',
  },
  '=>': {
    signature: '<boolean> => {…}',
    description: 'In a projection: adds the attributes on the right when the condition is true.',
  },
  '..': {
    signature: '[<from>..<to>]',
    description: 'A range that includes its end: slices an array, or bounds `in`.',
  },
  '...': {
    signature: '[<from>...<to>] or {...}',
    description:
      'A range that excludes its end; in a projection, includes every attribute of the object.',
  },
  'asc': {signature: 'order(<any> asc)', description: 'Sorts in ascending order, the default.'},
  'desc': {signature: 'order(<any> desc)', description: 'Sorts in descending order.'},
}

/** The node names of the editor's grammar that are operators */
const OPERATOR_NODES = new Set([
  'EqualityOp',
  'CompareOp',
  'And',
  'Or',
  'Not',
  'In',
  'Match',
  'AddOp',
  'MulOp',
  'Exp',
  'Deref',
  'Pipe',
  'Arrow',
  'InclusiveRange',
  'ExclusiveRange',
  'Ellipsis',
  'Asc',
  'Desc',
])

export function isOperatorNode(name: string): boolean {
  return OPERATOR_NODES.has(name)
}

/** The documentation of an operator as written in the query */
export function findGroqOperator(text: string): GroqOperatorDoc | undefined {
  return Object.hasOwn(OPERATORS, text) ? OPERATORS[text] : undefined
}

const VALUE_DOCS: Record<string, string> = {
  '*': 'Every document in the dataset, as the filters right after it narrow them.',
  '@': 'The value the filter or projection reads: its current item.',
  '^': 'The value one scope out, outside the current filter or projection.',
}

/** What `*`, `@` and `^` stand for */
export function findGroqValueDoc(text: string): string | undefined {
  return Object.hasOwn(VALUE_DOCS, text) ? VALUE_DOCS[text] : undefined
}

export interface SystemFieldDoc {
  type: string
  description: string
}

/** The attributes every document, or every reference, has whatever its schema declares */
const SYSTEM_FIELD_DOCS: Record<string, SystemFieldDoc> = {
  _id: {type: 'string', description: 'The document ID.'},
  _type: {type: 'string', description: 'The name of the schema type.'},
  _rev: {type: 'string', description: 'The revision, which changes with every edit.'},
  _createdAt: {
    type: 'string',
    description: 'When the document was created, as an ISO 8601 datetime.',
  },
  _updatedAt: {
    type: 'string',
    description: 'When the document was last changed, as an ISO 8601 datetime.',
  },
  _originalId: {
    type: 'string',
    description: 'The ID of the draft or version a perspective returned this document from.',
  },
  _system: {type: 'object', description: 'Metadata the Content Lake keeps about the document.'},
  _key: {type: 'string', description: 'Identifies an item of an array.'},
  _score: {type: 'number', description: 'How well the document matched, after `score()`.'},
  _ref: {type: 'string', description: 'The ID of the document the reference points to.'},
  _weak: {
    type: 'boolean',
    description: 'A weak reference does not stop the document it points to from being deleted.',
  },
  _strengthenOnPublish: {
    type: 'object',
    description: 'Makes a weak reference strong once the document it points to is published.',
  },
  _dataset: {type: 'string', description: 'The dataset of a cross-dataset reference.'},
  _projectId: {type: 'string', description: 'The project of a cross-dataset reference.'},
}

export function findSystemField(name: string): SystemFieldDoc | undefined {
  return Object.hasOwn(SYSTEM_FIELD_DOCS, name) ? SYSTEM_FIELD_DOCS[name] : undefined
}
