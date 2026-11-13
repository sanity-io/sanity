/**
 * The built-in GROQ functions, as the GROQ functions reference documents them, for the query
 * editor's hover documentation, completions and function lint. Descriptions quote GROQ in
 * backticks, like the lint messages.
 */

export const GROQ_FUNCTIONS_REFERENCE_URL =
  'https://www.sanity.io/docs/specifications/groq-functions'

export interface GroqFunctionDoc {
  /** `global` for the functions called without a namespace */
  namespace: string
  name: string
  /** As the reference writes it: `count(<array>) <integer>` */
  signature: string
  description: string
  /** How many arguments it takes, when the API checks that; `max` is `Infinity` for no limit */
  args?: {min: number; max: number}
  /** The oldest API version it works with, when that is newer than `v1` */
  apiVersion?: string
  /** Called after `|`: `* | order(_createdAt desc)` */
  pipe?: boolean
  /** Only inside a `score()` */
  scoreOnly?: boolean
  /** Only in delta mode, where webhooks and Sanity Functions run their filters */
  deltaOnly?: boolean
}

const V2021 = 'v2021-03-25'

function exactly(count: number): {min: number; max: number} {
  return {min: count, max: count}
}

export const GROQ_FUNCTIONS: readonly GroqFunctionDoc[] = [
  {
    namespace: 'global',
    name: 'after',
    signature: 'after() <object>',
    description: 'Returns the document as it is after the change; `null` when it was deleted.',
    args: exactly(0),
    deltaOnly: true,
  },
  {
    namespace: 'global',
    name: 'before',
    signature: 'before() <object>',
    description: 'Returns the document as it was before the change; `null` when it was created.',
    args: exactly(0),
    deltaOnly: true,
  },
  {
    namespace: 'global',
    name: 'boost',
    signature: 'boost(<expression>, <number>)',
    description:
      'Weighs a condition in `score()`: a match adds the boost value times what it would add otherwise. Boosts are constant positive numbers.',
    args: exactly(2),
    scoreOnly: true,
  },
  {
    namespace: 'global',
    name: 'coalesce',
    signature: 'coalesce(<any>...) <any>',
    description:
      'Returns the first argument that is not `null`, or `null` when they all are: `coalesce(title.es, title.en)`.',
  },
  {
    namespace: 'global',
    name: 'count',
    signature: 'count(<array>) <integer>',
    description: 'Returns the number of elements in an array: `count(*[_type == "movie"])`.',
    args: exactly(1),
  },
  {
    namespace: 'global',
    name: 'dateTime',
    signature: 'dateTime(<string>) <datetime>',
    description:
      'Reads an RFC 3339 string, like `_createdAt`, as a datetime to compare and calculate with: subtracting two gives the seconds between them.',
    args: exactly(1),
  },
  {
    namespace: 'global',
    name: 'defined',
    signature: 'defined(<any>) <boolean>',
    description:
      'Returns `true` when the argument is not `null`. Strings longer than 1024 characters do not give the expected result; `match` works on any length.',
    args: exactly(1),
  },
  {
    namespace: 'global',
    name: 'geo',
    signature: 'geo(<object>) <geo>',
    description:
      'Reads a GeoJSON object, or one with `lat` and `lng`, as a geo value; `null` when it cannot.',
    args: exactly(1),
    apiVersion: V2021,
  },
  {
    namespace: 'global',
    name: 'identity',
    signature: 'identity() <string>',
    description:
      'Returns the project user ID of whoever runs the query, `<anonymous>` without a login and `<system>` for system actions.',
    args: exactly(0),
  },
  {
    namespace: 'global',
    name: 'length',
    signature: 'length(<array|string>) <integer>',
    description:
      'Returns the number of elements in an array or of characters in a string. For arrays, `count()` is faster.',
    args: exactly(1),
  },
  {
    namespace: 'global',
    name: 'lower',
    signature: 'lower(<string>) <string>',
    description: 'Returns the string in lowercase.',
    args: exactly(1),
  },
  {
    namespace: 'global',
    name: 'now',
    signature: 'now() <string>',
    description:
      'Returns the time the query runs at, in RFC 3339 format (UTC), the same for every call in a query. The API CDN caches queries that use it for 120 seconds.',
    args: exactly(0),
  },
  {
    namespace: 'global',
    name: 'order',
    signature: 'order(<expression> [asc|desc], ...)',
    description:
      'Sorts an array by the expressions, each ascending unless followed by `desc`: `* | order(_createdAt desc)`.',
    args: {min: 1, max: Infinity},
    pipe: true,
  },
  {
    namespace: 'global',
    name: 'path',
    signature: 'path(<string>) <path>',
    description:
      'Reads a string as a path to match IDs against: `*` matches one segment and `**` any number, so `_id in path("drafts.**")` matches every draft.',
    args: exactly(1),
  },
  {
    namespace: 'global',
    name: 'references',
    signature: 'references(<path|string|array>) <boolean>',
    description:
      'Returns `true` when the document at the root of the current scope references the given document ID, or any of the IDs in an array.',
    args: {min: 1, max: Infinity},
  },
  {
    namespace: 'global',
    name: 'round',
    signature: 'round(<integer|float>[, <integer>]) <integer|float>',
    description:
      'Rounds a number to the nearest integer, or to the given number of decimals: `round(3.14, 1)` is `3.1`.',
    args: {min: 1, max: 2},
  },
  {
    namespace: 'global',
    name: 'score',
    signature: 'score(<expression>...)',
    description:
      'Gives every document a `_score` for the conditions it matches, to sort by with `| order(_score desc)`. Takes conditions and `boost()`, not other functions, references or subqueries.',
    args: {min: 1, max: Infinity},
    pipe: true,
  },
  {
    namespace: 'global',
    name: 'select',
    signature: 'select(<condition> => <value>..., <fallback>) <any>',
    description:
      'Returns the value of the first `condition => value` pair whose condition is `true`, or else the first argument that is not a pair; `null` when nothing applies.',
  },
  {
    namespace: 'global',
    name: 'string',
    signature: 'string(<integer|float|boolean|datetime|string>) <string>',
    description:
      'Returns the string representation of a number, boolean, datetime or string, `null` for anything else.',
    args: exactly(1),
  },
  {
    namespace: 'global',
    name: 'upper',
    signature: 'upper(<string>) <string>',
    description: 'Returns the string in uppercase.',
    args: exactly(1),
  },
  {
    namespace: 'array',
    name: 'compact',
    signature: 'array::compact(<array>) <array>',
    description: 'Returns the array without its `null` elements.',
    args: exactly(1),
  },
  {
    namespace: 'array',
    name: 'intersects',
    signature: 'array::intersects(<array>, <array>) <boolean>',
    description: 'Returns `true` when the two arrays have an element in common.',
    args: exactly(2),
  },
  {
    namespace: 'array',
    name: 'join',
    signature: 'array::join(<array[string|number|boolean]>, <string>) <string>',
    description:
      'Joins the elements into one string with the separator between them; an element without a string representation becomes `<INVALID>`.',
    args: exactly(2),
  },
  {
    namespace: 'array',
    name: 'unique',
    signature: 'array::unique(<array>) <array>',
    description:
      'Returns the array without duplicate strings, numbers, booleans and `null`s, in no guaranteed order.',
    args: exactly(1),
  },
  {
    namespace: 'dateTime',
    name: 'now',
    signature: 'dateTime::now() <datetime>',
    description: 'Returns the time the query runs at, like `now()` but as a datetime.',
    args: exactly(0),
  },
  {
    namespace: 'delta',
    name: 'changedAny',
    signature: 'delta::changedAny(<selector>) <boolean>',
    description:
      'Returns `true` when any of the selected fields changed: `delta::changedAny((title, slug.current))`.',
    args: exactly(1),
    deltaOnly: true,
  },
  {
    namespace: 'delta',
    name: 'changedOnly',
    signature: 'delta::changedOnly(<selector>) <boolean>',
    description:
      'Returns `true` when nothing but the selected fields changed; `_rev` and `_updatedAt` are ignored.',
    args: exactly(1),
    deltaOnly: true,
  },
  {
    namespace: 'delta',
    name: 'operation',
    signature: 'delta::operation() <string>',
    description: 'Returns `create`, `update` or `delete`, for the operation that made the change.',
    args: exactly(0),
    deltaOnly: true,
  },
  {
    namespace: 'diff',
    name: 'changedAny',
    signature: 'diff::changedAny(<object>, <object>, <selector>) <boolean>',
    description: 'Returns `true` when any of the selected fields differ between the two objects.',
    args: exactly(3),
  },
  {
    namespace: 'diff',
    name: 'changedOnly',
    signature: 'diff::changedOnly(<object>, <object>, <selector>) <boolean>',
    description: 'Returns `true` when the two objects differ in nothing but the selected fields.',
    args: exactly(3),
  },
  {
    namespace: 'documents',
    name: 'get',
    signature: 'documents::get(<global document reference>) <document>',
    description: 'Resolves a global document reference, like `->` resolves a reference.',
    args: exactly(1),
  },
  {
    namespace: 'documents',
    name: 'incomingGlobalDocumentReferenceCount',
    signature: 'documents::incomingGlobalDocumentReferenceCount() <number>',
    description:
      'Returns how many global document references point to the document in the current scope.',
    args: exactly(0),
  },
  {
    namespace: 'geo',
    name: 'contains',
    signature: 'geo::contains(<geo polygon>, <geo>) <boolean>',
    description: 'Returns `true` when the first geo value fully contains the second.',
    args: exactly(2),
    apiVersion: V2021,
  },
  {
    namespace: 'geo',
    name: 'distance',
    signature: 'geo::distance(<geo point>, <geo point>) <number>',
    description:
      'Returns the distance between two points in meters; `null` for lines and polygons.',
    args: exactly(2),
    apiVersion: V2021,
  },
  {
    namespace: 'geo',
    name: 'intersects',
    signature: 'geo::intersects(<geo>, <geo>) <boolean>',
    description: 'Returns `true` when the two geo values overlap or intersect.',
    args: exactly(2),
    apiVersion: V2021,
  },
  {
    namespace: 'geo',
    name: 'latLng',
    signature: 'geo::latLng(<latitude>, <longitude>) <geo>',
    description: 'Returns the geo point at a latitude and a longitude.',
    args: exactly(2),
    apiVersion: V2021,
  },
  {
    namespace: 'math',
    name: 'avg',
    signature: 'math::avg(<array[number]>) <number|null>',
    description:
      'Returns the average of the numbers in an array, ignoring `null`s; `null` when an element is not a number.',
    args: exactly(1),
  },
  {
    namespace: 'math',
    name: 'max',
    signature: 'math::max(<array[number]>) <number|null>',
    description:
      'Returns the largest number in an array, ignoring `null`s; `null` when an element is not a number.',
    args: exactly(1),
  },
  {
    namespace: 'math',
    name: 'min',
    signature: 'math::min(<array[number]>) <number|null>',
    description:
      'Returns the smallest number in an array, ignoring `null`s; `null` when an element is not a number.',
    args: exactly(1),
  },
  {
    namespace: 'math',
    name: 'sum',
    signature: 'math::sum(<array[number]>) <number|null>',
    description:
      'Returns the sum of the numbers in an array, `0` for an empty one, ignoring `null`s; `null` when an element is not a number.',
    args: exactly(1),
  },
  {
    namespace: 'media',
    name: 'aspect',
    signature: 'media::aspect(<media library asset reference>, <string>) <any>',
    description: 'Returns the value of a public aspect of a Media Library asset.',
    args: exactly(2),
  },
  {
    namespace: 'pt',
    name: 'text',
    signature: 'pt::text(<Portable Text array|object>) <string>',
    description:
      'Returns the plain text of a Portable Text block or array of blocks, with a blank line between blocks. Only the spans directly in the blocks count.',
    args: exactly(1),
    apiVersion: V2021,
  },
  {
    namespace: 'releases',
    name: 'all',
    signature: 'releases::all() <array>',
    description: 'Returns every release, like `*[_type == "system.release"]`.',
    args: exactly(0),
  },
  {
    namespace: 'sanity',
    name: 'dataset',
    signature: 'sanity::dataset() <string>',
    description: 'Returns the name of the dataset the query runs in.',
    args: exactly(0),
    apiVersion: V2021,
  },
  {
    namespace: 'sanity',
    name: 'partOfRelease',
    signature: 'sanity::partOfRelease(<string>) <boolean>',
    description:
      'Returns `true` when the document at the root of the current scope is in the release with the given name, the last part of its ID.',
    args: exactly(1),
    apiVersion: 'v2025-02-19',
  },
  {
    namespace: 'sanity',
    name: 'projectId',
    signature: 'sanity::projectId() <string>',
    description: 'Returns the ID of the project the query runs in.',
    args: exactly(0),
    apiVersion: V2021,
  },
  {
    namespace: 'sanity',
    name: 'versionOf',
    signature: 'sanity::versionOf(<string>) <boolean>',
    description:
      'Returns `true` when the document at the root of the current scope is a version (draft, published or in a release) of the given document ID.',
    args: exactly(1),
    apiVersion: 'v2025-02-19',
  },
  {
    namespace: 'string',
    name: 'split',
    signature: 'string::split(<string>, <string>) <array[string]>',
    description:
      'Splits a string at every separator; an empty separator splits it into its characters.',
    args: exactly(2),
  },
  {
    namespace: 'string',
    name: 'startsWith',
    signature: 'string::startsWith(<string>, <string>) <boolean>',
    description: 'Returns `true` when the first string starts with the second.',
    args: exactly(2),
  },
  {
    namespace: 'text',
    name: 'highlight',
    signature: 'text::highlight(<document>, <text query>) <object>',
    description:
      'Returns which parts of a document matched a `text::query()`, for snippets in search results. Experimental.',
    args: exactly(2),
    apiVersion: 'vX',
  },
  {
    namespace: 'text',
    name: 'query',
    signature: 'text::query(<string>) <text query>',
    description:
      'Reads a search string (words, `"phrases"`, `prefix*`, `-negation`) for `match`: `title match text::query("dracula")`.',
    args: exactly(1),
  },
  {
    namespace: 'text',
    name: 'semanticSimilarity',
    signature: 'text::semanticSimilarity(<string>) <number>',
    description:
      'Ranks documents by how close their meaning is to the search term, in `score()`, on datasets with embeddings enabled.',
    args: exactly(1),
    scoreOnly: true,
  },
  {
    namespace: 'user',
    name: 'attributes',
    signature: 'user::attributes() <object>',
    description:
      'Returns the user attributes of the logged-in user: `user::attributes().branch`. An Enterprise feature.',
    args: exactly(0),
  },
]

/**
 * Functions the API knows that the reference does not document: calling them is no mistake,
 * but there is nothing to show for them
 */
const UNDOCUMENTED_FUNCTIONS = new Set([
  'global::anywhere',
  'documents::incomingRefCount',
  'string::lower',
  'string::upper',
])

const FUNCTIONS_BY_ID = new Map(GROQ_FUNCTIONS.map((doc) => [functionId(doc), doc]))

/** `pt::text`, and for the global namespace just the name: `count` */
export function functionId({namespace, name}: {namespace: string; name: string}): string {
  return namespace === 'global' ? name : `${namespace}::${name}`
}

/** A call written without a namespace calls the global function of that name */
export function findGroqFunction(
  namespace: string | undefined,
  name: string,
): GroqFunctionDoc | undefined {
  return FUNCTIONS_BY_ID.get(functionId({namespace: namespace ?? 'global', name}))
}

export function isKnownGroqFunction(namespace: string | undefined, name: string): boolean {
  const id = functionId({namespace: namespace ?? 'global', name})
  return FUNCTIONS_BY_ID.has(id) || UNDOCUMENTED_FUNCTIONS.has(`${namespace ?? 'global'}::${name}`)
}
