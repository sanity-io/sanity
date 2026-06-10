import {compileFieldPath, type CompileFieldPathOptions} from './compileFieldPath'
import {type SearchSort} from './types'

/**
 * @internal
 *
 * Result of compiling a single `SearchSort` into the data needed by
 * the search strategy to project and order on the value.
 */
export interface CompiledSortEntry {
  /**
   * The fully-qualified GROQ expression that produces the value to
   * sort on. Inserts `->` for reference traversals inferred from the
   * schema, preserves array indexing and keyed access.
   */
  expression: string
  /**
   * Numeric index into the `orderings` projection array under which
   * the value will be projected. Always defined: every sort entry
   * is projected into `orderings` for a consistent, predictable
   * result shape.
   *
   * The projected value is available at
   * `result.orderings[projectionIndex]`.
   */
  projectionIndex: number
}

/**
 * @internal
 *
 * Compiles a `SearchSort` into the projection-ready
 * `{ expression, projectionIndex }` shape used by the search
 * strategies.
 *
 * Every entry is projected into the top-level `orderings` array —
 * there is no "bare" projection branch. This keeps the result
 * shape predictable and avoids needing to reason about whether a
 * particular sort field is addressable as a bare GROQ identifier.
 *
 * The compiled GROQ expression is produced by walking
 * `searchSort.schemaType` with `compileFieldPath`, which inserts
 * `->` at reference boundaries and preserves array indexing / keyed
 * access. If `searchSort.schemaType` is missing or the path can't be
 * resolved, the original `field` is used as a literal GROQ
 * expression.
 *
 * The compiled `expression` is **not** stored on `SearchSort` itself.
 * Callers thread the array of resolved entries through to anywhere
 * else it's needed (e.g. `getNextCursor`).
 */
export function compileSortExpression(
  searchSort: SearchSort,
  index: number,
  options: CompileFieldPathOptions = {},
): CompiledSortEntry {
  const {field, schemaType} = searchSort

  const expression = field ? compileFieldPath(schemaType, field, options) : field

  return {
    expression,
    projectionIndex: index,
  }
}
