import {isApiVersionBelow} from '../../util/compareApiVersion'
import {functionId, GROQ_FUNCTIONS, type GroqFunctionDoc} from './groqFunctionReference'

/** What the dataset and the tab's client can run, which decides what the model is taught */
export interface GroqReferenceContext {
  /** Whether the dataset has embeddings ready, so `text::semanticSimilarity()` can run on it */
  embeddings: boolean
  /** The API version the query runs on; functions newer than it are left out */
  apiVersion?: string
  /** The perspective the query runs with, as the client is configured */
  perspective?: string | string[]
}

/** Namespaced functions, `text::semanticSimilarity()` among them, do not parse on `v1` */
const NAMESPACED_FUNCTIONS_API_VERSION = 'v2021-03-25'
const SEMANTIC_SIMILARITY = 'text::semanticSimilarity'
const PART_OF_RELEASE = 'sanity::partOfRelease'

const BASICS = `GROQ is the query language of the Sanity Content Lake. It is not jq, SQL or JavaScript.
- A query usually starts with * (every document), filtered in brackets: *[_type == "movie" && releaseYear >= 1979]
- A projection picks and computes attributes: {_id, title, "director": director->name, "castCount": count(cast)}
- Order with the order() pipe function, then slice: *[_type == "movie"] | order(releaseDate desc, title asc)[0...10]
- [0...10] is the first ten (the end is excluded), [0] is the first match alone
- To pick some documents by one order and show them in another, slice first and order again: *[_type == "movie"] | order(_createdAt desc)[0...10] | order(title asc)
- Membership: "news" in tags; logic: &&, ||, !; existence: defined(field)
- Parameters are names that start with $ (like $type); their values are given separately. Put text that comes from the request (search terms, a description, a name) in a parameter rather than in the query
- Every document has _id, _type, _createdAt, _updatedAt and _rev; "recent" or "newest" usually means _createdAt desc
- Use the field names of the schema; when the request names something the schema lacks, use the closest field
- A field whose name is not a plain identifier (it has a dash, a space or starts with a digit) is read with brackets and quotes: @["release-year"], and named in a projection with quotes: "releaseYear": @["release-year"]`

const MISTAKES = `Mistakes the API rejects, or that quietly return the wrong data:
- Only score() and order() go after a pipe (|). Every other function takes its argument in parentheses: count(*[_type == "movie"]), never *[_type == "movie"] | count()
- There is no GROUP BY, ORDER BY, LIMIT, SELECT or JOIN. Group by listing the groups and nesting a query that finds their members: *[_type == "genre"]{title, "movies": *[_type == "movie" && references(^._id)]{title}}. Inside the nested query, ^ is the document of the outer one
- An attribute of a projection is a field name or "name": expression, never a bare path: "slug": slug.current and "director": director->name, not {slug.current} or {director->name}
- Never filter what -> returns: genres[]->[title == "Drama"] and count(genres[]->[title == "Drama"]) > 0 give wrong results without an error. Test the referenced documents inside the brackets with @->, or compare against the dereferenced values: *[_type == "movie" && count(genres[@->title == "Drama"]) > 0], *[_type == "movie" && "Drama" in genres[]->title], *[_type == "movie" && director->name == $name]
- An attribute computed in a projection is not available elsewhere in the same projection (it reads as null there). Compute it again, or add a second projection that uses it: {title, "castCount": count(cast)}{..., "largeCast": castCount > 20}
- The attributes a projection computes can be ordered by after it: *[_type == "director"]{name, "movieCount": count(*[_type == "movie" && references(^._id)])} | order(movieCount desc)[0...10]. This is also how to rank documents by how often other documents reference them
- jq habits do not work: no .[] or .field after a pipe, no sort_by(), map() or select(.x)`

const REFERENCES = `References and rich text:
- Follow a reference with ->: director->name; an array of references with []->: genres[]->title
- references($id) is true for documents that reference the document with that ID; it also takes an array of IDs: *[_type == "movie" && references(*[_type == "genre" && title in $genres]._id)]
- A Portable Text field is an array of blocks: pt::text(body) is its plain text, for searching it or showing an excerpt`

const PAGINATION = `Paging: to go through many documents, order by _id and start after the last one seen, *[_type == "movie" && _id > $lastId] | order(_id asc)[0...100], rather than slicing deep into the results ([10000...10100] gets slower the further it starts).`

const SEARCH_STRATEGY_HEAD = `Choosing how to find documents:
- An exact value (a name, a slug, an ID, a number, a date, a value from a list): compare it with ==, in or a range in the filter, like *[_type == "movie" && title == $title]. A name someone typed may differ in case from the stored one: lower(title) == lower($title). No scoring
- An objective order (newest, longest, most expensive, highest rated): order() by that field. No scoring
- Words that should appear in the text (a title containing "dragon", articles about "kubernetes"): keyword search, ranked with score()`

const SEARCH_STRATEGY_SEMANTIC = `- A description of what the user means rather than the words to look for (a vague memory, a mood, a question about which one fits, a misspelled or half-remembered name): semantic search with text::semanticSimilarity()
- Both (some words that must match, and a description): hybrid search, keyword and semantic conditions in one score()`

const SEARCH_STRATEGY_KEYWORDS = `- A description of what the user means rather than the words to look for (a vague memory, a mood, a question about which one fits, a misspelled or half-remembered name): keyword search with the description turned into the words a matching document would contain (see "Expanding search terms")`

const KEYWORD_SEARCH = `Keyword search:
- field match "word" is true when every word of the string appears in the field, compared word by word and ignoring case; "word*" also matches longer words that start with it. There is no stemming or spelling tolerance: "run" does not match "running", "run*" does
- text::query($terms) reads a search string with "exact phrases", prefix*, and -excluded words, and is only used on the right of match: title match text::query($terms). On the left: a field, an array of fields ([title, overview]), or @ for every text field of the document
- To rank, put the conditions in score() and sort by the _score it gives: *[_type == "movie"] | score(title match text::query($terms), overview match text::query($terms)) | order(_score desc)[0...10]. Inside score(), a document scores for each word it matches, so a search for several words finds documents with any of them
- score() keeps every document; documents that match nothing score 0. Add [_score > 0] after it to keep only matches: ... | score(...)[_score > 0] | order(_score desc)[0...10]
- Score, then order, then slice. A slice before score() ranks only the documents that happened to be in it
- Weigh conditions with boost(condition, weight): a title match counts more than a match in the body, boost(title match text::query($terms), 3). Any condition can be boosted, boost(featured == true, 2), and the weight can be a parameter
- Keep hard requirements (the type, a date range, a category) in the filter in brackets, before score(); score() only ranks
- Search rich text with pt::text(body) match text::query($terms)`

const SEMANTIC_SEARCH = `Semantic search (this dataset has embeddings, so it is available):
- text::semanticSimilarity($description) scores documents by how close their meaning is to the text, so they can be found without sharing a word with it. It only works inside score(), never in a filter, order() or a projection: *[_type == "movie"] | score(text::semanticSimilarity($description)) | order(_score desc)[0...10]
- Use it when the request describes what the user is after instead of naming it. Give it the description as a parameter, rewritten as a short statement of what a matching document is about, without filler like "show me" or "what is"
- Documents far from the meaning score 0, so [_score > 0] after it keeps only the close ones
- Hybrid search: keyword and semantic conditions in one score(), weighted with boost(): *[_type == "movie"] | score(boost(title match text::query($terms), 2), text::semanticSimilarity($description)) | order(_score desc)[0...10]. Keyword conditions pin down names and specific terms; the semantic one catches the rest. Use it when the request has both, or when a name in it may be misspelled
- Keep hard requirements in the filter: *[_type == "movie" && releaseYear < 1990] | score(text::semanticSimilarity($description)) | order(_score desc)[0...10]`

const NO_SEMANTIC_SEARCH = `This dataset has no embeddings, so text::semanticSimilarity() fails on it: never use it. Answer a request that describes what the user means with keyword search instead.`

const EXPANDING_TERMS = `Expanding search terms: when keywords come from a description rather than from words the user wants matched, search for the words a matching document would use. Add synonyms, related words and the likely spellings of a half-remembered name, use prefix* for word forms (alien* matches aliens), and search the fields that hold descriptive text. A request for "a scary film set in space" becomes *[_type == "movie"] | score([title, overview] match text::query($terms)) [_score > 0] | order(_score desc)[0...10] with "terms": "space alien* horror terror monster* scary".`

/** The perspective the query runs with, and what it means for IDs; nothing when it is not known */
function describePerspective(perspective: string | string[] | undefined): string {
  const runsWith =
    perspective === undefined
      ? undefined
      : Array.isArray(perspective)
        ? `a stack of releases (${perspective.join(', ')})`
        : `the ${perspective} perspective`
  const raw = perspective === 'raw'
  return `Drafts, versions and perspectives:${runsWith ? `\n- The query runs with ${runsWith}` : ''}
- A perspective decides which version of each document a query sees. With published, drafts or a stack of releases, every document appears once, under its base ID (without a drafts. or versions. prefix): look documents up and compare IDs by that base ID
- Only with raw are drafts (drafts.<id>) and release versions (versions.<release name>.<id>) documents of their own, next to the published one; only there do drafts. and versions. prefixes belong in a query, like _id in path("drafts.**")${raw ? '. To list each document once with raw, filter the prefixed IDs out: !(_id in path("drafts.**")) && !(_id in path("versions.**"))' : ''}`
}

const RELEASES = `- A release is a document of type system.release with a name (its ID without the _.releases. prefix), a state (like active, scheduled or published) and metadata (title, description, releaseType, intendedPublishAt)
- sanity::partOfRelease($name) is true for the versions in a release, taking the release's name, never its _id: *[_type == "system.release" && state == "active"]{"title": metadata.title, "documents": count(*[sanity::partOfRelease(^.name)])}. Versions are their own documents with the raw perspective only
- A version made from an existing document has _system.base ({id, rev} of the document it started from); one without it adds a new document`

function formatFunction(doc: GroqFunctionDoc): string {
  const where = doc.pipe ? ' (after |)' : doc.scoreOnly ? ' (only inside score())' : ''
  return `- ${doc.signature}${where}: ${doc.description}`
}

/**
 * The GROQ functions the query can call, from the editor's function reference: those of delta
 * mode are left out, as are those newer than the API version and, on a dataset without
 * embeddings, `text::semanticSimilarity()`
 */
export function listGroqFunctions(context: GroqReferenceContext): GroqFunctionDoc[] {
  const {apiVersion, embeddings} = context
  return GROQ_FUNCTIONS.filter(
    (doc) =>
      !doc.deltaOnly &&
      !(apiVersion && doc.apiVersion && isApiVersionBelow(apiVersion, doc.apiVersion)) &&
      (embeddings || functionId(doc) !== SEMANTIC_SIMILARITY),
  )
}

/** Whether the dataset and API version can run `text::semanticSimilarity()` */
export function canUseSemanticSearch(context: GroqReferenceContext): boolean {
  const {apiVersion, embeddings} = context
  return (
    embeddings && !(apiVersion && isApiVersionBelow(apiVersion, NAMESPACED_FUNCTIONS_API_VERSION))
  )
}

/**
 * How GROQ works, for the model: the patterns a query needs, how to search, and the jq, SQL and
 * JavaScript habits models fall back on (the API rejects those, and a retry quotes its error).
 * Semantic and hybrid search are only taught when the dataset can run them.
 */
export function buildGroqReference(context: GroqReferenceContext): string {
  const semantic = canUseSemanticSearch(context)
  const functions = listGroqFunctions({...context, embeddings: semantic})
  const releases = functions.some((doc) => functionId(doc) === PART_OF_RELEASE)
  return [
    BASICS,
    MISTAKES,
    REFERENCES,
    [SEARCH_STRATEGY_HEAD, semantic ? SEARCH_STRATEGY_SEMANTIC : SEARCH_STRATEGY_KEYWORDS].join(
      '\n',
    ),
    KEYWORD_SEARCH,
    semantic ? SEMANTIC_SEARCH : NO_SEMANTIC_SEARCH,
    EXPANDING_TERMS,
    [describePerspective(context.perspective), ...(releases ? [RELEASES] : [])].join('\n'),
    PAGINATION,
    `The functions (signature, then what it does):\n${functions.map(formatFunction).join('\n')}`,
  ].join('\n\n')
}
