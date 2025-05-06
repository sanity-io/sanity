/**
 * Defines a GROQ query string literal type. This no-op function helps TypeScript
 * preserve the exact query structure for type inference when working with
 * {@link SanityQueryResult} and query type generation. While similar to the `groq`
 * template tag, this function enables better type inference until TypeScript
 * resolves microsoft/TypeScript#33304.
 *
 * @param query - The GROQ query to capture as a literal type
 * @returns The same query string unchanged
 *
 * @example
 * ```ts
 * const authorQuery = defineQuery('*[_type == "author"]')
 * type AuthorResult = SanityQueryResult<typeof authorQuery>
 * ```
 * @public
 */
export function defineQuery<const TQuery extends string>(query: TQuery): TQuery {
  return query
}

/**
 * Defines a GROQ projection string literal type. This no-op function helps TypeScript
 * preserve the exact projection string structure for type inference when working with
 * {@link SanityProjectionResult} and projection type generation.
 *
 * @param projection - The GROQ projection string to capture as a literal type
 * @returns The same projection string unchanged
 *
 * @example
 * ```ts
 * const authorProjection = defineProjection('{ name, "books": favoriteBooks[]->title }')
 * type AuthorResult = SanityProjectionResult<typeof authorProjection, 'author'>
 * ```
 * @public
 */
export function defineProjection<const TProjection extends string>(
  projection: TProjection,
): TProjection {
  return projection
}

/**
 * This interface is augmented by [Sanity TypeGen](https://www.sanity.io/docs/sanity-typegen) to
 * provide type definitions for registered GROQ queries. This allows library authors to capture the
 * query string as a literal and look up type of the query result via importing this augmented
 * interface.
 *
 * See {@link SanityQueryResult}.
 *
 * @example
 * ```ts
 * export type AuthorsQueryResult = {
 *   // ...
 * }[]
 *
 * declare module 'groq' {
 *  interface SanityQueries {
 *   '*[_type=="author"]': AuthorsQueryResult
 *  }
 * }
 * ```
 *
 * @public
 */
export interface SanityQueries {}

/**
 * This interface is augmented by [Sanity TypeGen](https://www.sanity.io/docs/sanity-typegen) to
 * provide type definitions for registered GROQ projections. Projections are computed against all
 * possible document types registered per schema and then unioned with {@link ProjectionBase}
 * using document type name as the second type parameter.
 *
 * Use the {@link PickProjectionResult} and {@link SanityProjectionResult} helpers to extract a
 * specific projection result.
 *
 * @example
 * ```ts
 * type PreviewProjectionResult =
 *  | ProjectionBase<{title: string | null, description: string | null}, 'product'>
 *  | ProjectionBase<{title: null, description: string | null}, 'author'>
 *
 * declare module 'groq' {
 *   interface SanityProjections {
 *     '{title, description}': PreviewProjectionResult
 *   }
 * }
 * ```
 *
 * @public
 */
export interface SanityProjections {}

/**
 * This interface is augmented by the [Sanity TypeGen](https://www.sanity.io/docs/sanity-typegen) to
 * provide type definitions for all schema types registered by the user. This allows extracting
 * specific schema types using helpers like {@link SanitySchema}, {@link SanityDocument}, or
 * {@link SanitySchemaType}.
 *
 * @example
 * ```ts
 * type Author =
 *   SchemaOrigin<{_id: string, _type: 'author', foo: string}, 'yourProjectId:test'> |
 *   SchemaOrigin<{_id: string, _type: 'author', foo: number}, 'yourProjectId:production'>;
 *
 * type Book =
 *   SchemaOrigin<{_id: string, _type: 'book', foo: string}, 'yourProjectId:test'> |
 *   SchemaOrigin<{_id: string, _type: 'book', foo: number}, 'yourProjectId:production'>;
 *
 * type YourProjectIdTestSchema =
 *   PickSchema<Author, 'yourProjectId:test'> |
 *   PickSchema<Book, 'yourProjectId:test'>;
 *
 * type YourProjectIdProductionSchema =
 *   PickSchema<Author, 'yourProjectId:production'> |
 *   PickSchema<Book, 'yourProjectId:production'>;
 *
 * declare module 'groq' {
 *   interface SanitySchemas {
 *     "yourProjectId:test": YourProjectIdTestSchema;
 *     "yourProjectId:production": YourProjectIdProductionSchema;
 *   }
 * }
 * ```
 * @public
 */
export interface SanitySchemas {}

/**
 * Represents the result type for a specific GROQ projection when used with
 * `PickProjectionResult`. Extracts the projection result for a specific type name.
 *
 * @typeParam T - Union type of possible projection results
 * @typeParam TProjectionBaseTypeName - The document type name to filter by
 *
 * @example
 * ```ts
 * type AuthorProjection = PickProjectionResult<AuthorProjectionProjectionResult, 'author'>
 * // Returns: ProjectionBase<{name: string | null, favoriteBookTitles: ...}, 'author'>
 * ```
 * @public
 */
export type PickProjectionResult<T, TProjectionBaseTypeName extends string = string> = Extract<
  T,
  ProjectionBase<T, TProjectionBaseTypeName>
>

/**
 * Represents the result type of a GROQ projection query. Combines schema picking
 * with projection type filtering.
 *
 * @typeParam TProjection - The projection string literal type
 * @typeParam TProjectionBaseTypeName - The document type name to filter by
 * @typeParam TSchemaId - The schema ID to pick from
 *
 * @example
 * ```ts
 * const authorProjection = defineProjection('{name, "favoriteBooks": favoriteBooks[]->title}')
 * type Result = SanityProjectionResult<typeof authorProjection, 'author', 'yourProjectId:production'>
 * // Returns: SchemaOrigin<ProjectionBase<{name: string, favoriteBooks: string[]}, 'author'>, 'yourProjectId:production'>
 * ```
 * @public
 */
export type SanityProjectionResult<
  TProjection extends string = string,
  TProjectionBaseTypeName extends string = string,
  TSchemaId extends string = string,
> = PickSchema<
  PickProjectionResult<SafeAccess<SanityProjections, TProjection>, TProjectionBaseTypeName>,
  TSchemaId
>

/**
 * Extracts a schema type by its ID. Used to get the type definition for a specific
 * schema version when working with multiple schemas.
 *
 * @typeParam TSchemaId - The schema ID to extract
 *
 * @example
 * ```ts
 * type TestSchema = SanitySchema<'yourProjectId:test'>
 * // Returns union of all types in the test schema
 * ```
 * @public
 */
export type SanitySchema<TSchemaId extends string = string> = PickSchema<
  SafeAccess<SanitySchemas, TSchemaId>,
  TSchemaId
>

interface _SanityDocument {
  _id: string
  _type: string
  _createdAt: string
  _updatedAt: string
  _rev: string
  [key: string]: unknown
}

/**
 * Represents a Sanity document with base document fields. Used as the foundation
 * for document type definitions.
 *
 * @typeParam TDocumentType - The _type field value of the document
 * @typeParam TSchemaId - The schema ID to pick from
 *
 * @example
 * ```ts
 * type AuthorDoc = SanityDocument<'author', 'yourProjectId:production'>
 * // Returns: Author type with __schemaId metadata
 * ```
 * @public
 */
export type SanityDocument<
  TDocumentType extends string = string,
  TSchemaId extends string = string,
> = Extract<
  Extract<SanitySchema<TSchemaId>, _SanityDocument> | _SanityDocument,
  {_type: TDocumentType}
>

/**
 * Extracts a specific schema type by both schema ID and type name. Combines
 * schema selection with type filtering.
 *
 * @typeParam TSchemaTypeName - The _type field value to match
 * @typeParam TSchemaId - The schema ID to pick from
 *
 * @example
 * ```ts
 * type TestAuthor = SanitySchemaType<'author', 'yourProjectId:test'>
 * // Returns: Author type from test schema
 * ```
 * @public
 */
export type SanitySchemaType<
  TSchemaTypeName extends string = string,
  TSchemaId extends string = string,
> = Extract<SanitySchema<TSchemaId>, {_type: TSchemaTypeName}>

type SafeAccess<T, K extends string> = K extends keyof T ? T[K] : T[keyof T]

/**
 * @public
 */
export type SanityQueryResult<
  TQuery extends string = string,
  TSchemaId extends string = string,
> = Extract<
  SafeAccess<SanityQueries, TQuery>,
  SchemaOrigin<SafeAccess<SanityQueries, TQuery>, TSchemaId>
>

/**
 * Represents the result type of a GROQ query. Combines schema picking with
 * query result type resolution.
 *
 * @typeParam TQuery - The GROQ query string literal type
 * @typeParam TSchemaId - The schema ID to pick from
 *
 * @example
 * ```ts
 * type Result = SanityQueryResult<'*[_type=="author"]', 'yourProjectId:production'>
 * // Returns: Author[] from production schema
 * ```
 * @public
 */
export type SchemaOrigin<TBase, TSchemaId extends string> = TBase & {
  /**
   * @internal
   * @deprecated typescript helper only
   */
  __schemaId?: TSchemaId
}

/**
 * Base type for projection results that includes metadata about the document type
 * being projected. Designed to be used in union types representing multiple possible
 * document type projections, which can then be narrowed using type helpers like
 * {@link PickProjectionResult}.
 *
 * @typeParam TBase - The actual projection result type
 * @typeParam TProjectionBaseTypeName - The document type name this projection applies to
 *
 * @example
 * ```ts
 * // Typically appears as a union of possible document type projections:
 * type BookProjections =
 *   ProjectionBase<{name: string}, 'book'> |
 *   ProjectionBase<{name: string[]}, 'author'>
 *
 * // Narrow the union to a specific document type:
 * type BookProjection = PickProjectionResult<BookProjections, 'book'>
 * ```
 * @public
 */
export type ProjectionBase<TBase, TProjectionBaseTypeName extends string> = TBase & {
  /**
   * @internal
   * @deprecated typescript helper only
   */
  __schemaTypeName?: TProjectionBaseTypeName // projection base type name
}

/**
 * Extracts types from a schema-aware union that match a specific schema ID.
 * Useful when working with multi-schema environments.
 *
 * @typeParam T - Union type containing SchemaOrigin types
 * @typeParam TSchemaId - The schema ID to filter by
 *
 * @example
 * ```ts
 * // As generated in explain.sanity.types.ts:
 * type Author =
 *   SchemaOrigin<{_type: 'author'; foo: string}, 'yourProjectId:test'> |
 *   SchemaOrigin<{_type: 'author'; foo: number}, 'yourProjectId:production'>
 *
 * // Extract production version:
 * type ProductionAuthor = PickSchema<Author, 'yourProjectId:production'>
 * // Returns: {_type: 'author'; foo: number}
 * ```
 * @public
 */
export type PickSchema<T, TSchemaId extends string = string> = Extract<
  T,
  SchemaOrigin<T, TSchemaId>
>
