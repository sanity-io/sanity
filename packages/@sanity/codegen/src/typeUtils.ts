/** Excludes `null` and `undefined` from a type. */
type NonNullish<T> = T extends null | undefined ? never : T

/** Builds a tuple from elements, stopping at the first `never`. */
type TakeUntilNever<T extends unknown[]> = T extends [infer H, ...infer Rest]
  ? [H] extends [never]
    ? []
    : [H, ...TakeUntilNever<Rest>]
  : []

/** Recursively navigates through a path, stripping nullability for key lookup. */
type NavigatePath<T, Path extends unknown[]> = Path extends []
  ? NonNullish<T>
  : Path extends [infer K, ...infer Rest]
    ? K extends keyof NonNullish<T>
      ? NavigatePath<NonNullish<T>[K], Rest>
      : never
    : never

/** Recursively gets value at path, preserving nullability at final access. */
type GetAtPath<T, Path extends unknown[]> = Path extends []
  ? T
  : Path extends [infer K]
    ? K extends keyof NonNullish<T>
      ? NonNullish<T>[K]
      : never
    : Path extends [infer K, ...infer Rest]
      ? K extends keyof NonNullish<T>
        ? GetAtPath<NonNullish<T>[K], Rest>
        : never
      : never

/**
 * Get a deeply nested property type from a complex type structure. Safely navigates
 * through nullable types (`T | null | undefined`) at each level, preserving the
 * nullability of the final accessed property.
 *
 * Supports up to 20 levels of nesting.
 *
 * @example
 * ```ts
 * type POST_QUERY_RESULT = {
 *   _id: string
 *   author: {
 *     profile: {
 *       name: string;
 *     } | null;
 *   } | null;
 *   links: Array<{
 *     _key: string
 *     type: 'link'
 *     label: string
 *     url: string
 *   }> | null
 * } | null
 *
 * // Basic property access:
 * type Id = Get<POST_QUERY_RESULT, '_id'>;
 * // → string
 *
 * // Nested property access:
 * type Profile = Get<POST_QUERY_RESULT, 'author', 'profile';
 * // → { name: string } | null
 *
 * // Array element access using `number`:
 * type Link = Get<POST_QUERY_RESULT, 'links', number, 'label'>;
 * // → string
 * ```
 */
export type Get<
  T,
  K1 extends keyof NonNullish<T>,
  K2 extends keyof NavigatePath<T, [K1]> = never,
  K3 extends keyof NavigatePath<T, [K1, K2]> = never,
  K4 extends keyof NavigatePath<T, [K1, K2, K3]> = never,
  K5 extends keyof NavigatePath<T, [K1, K2, K3, K4]> = never,
  K6 extends keyof NavigatePath<T, [K1, K2, K3, K4, K5]> = never,
  K7 extends keyof NavigatePath<T, [K1, K2, K3, K4, K5, K6]> = never,
  K8 extends keyof NavigatePath<T, [K1, K2, K3, K4, K5, K6, K7]> = never,
  K9 extends keyof NavigatePath<T, [K1, K2, K3, K4, K5, K6, K7, K8]> = never,
  K10 extends keyof NavigatePath<T, [K1, K2, K3, K4, K5, K6, K7, K8, K9]> = never,
  K11 extends keyof NavigatePath<T, [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10]> = never,
  K12 extends keyof NavigatePath<T, [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11]> = never,
  K13 extends keyof NavigatePath<T, [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12]> = never,
  K14 extends keyof NavigatePath<T, [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13]> =
    never,
  K15 extends keyof NavigatePath<T, [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14]> =
    never,
  K16 extends keyof NavigatePath<
    T,
    [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15]
  > = never,
  K17 extends keyof NavigatePath<
    T,
    [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16]
  > = never,
  K18 extends keyof NavigatePath<
    T,
    [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17]
  > = never,
  K19 extends keyof NavigatePath<
    T,
    [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18]
  > = never,
  K20 extends keyof NavigatePath<
    T,
    [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18, K19]
  > = never,
> = GetAtPath<
  T,
  TakeUntilNever<
    [K1, K2, K3, K4, K5, K6, K7, K8, K9, K10, K11, K12, K13, K14, K15, K16, K17, K18, K19, K20]
  >
>

/**
 * Filter a union of object types by the _type property. This is handy when working with page builder
 * setups where the returned type is an array containing multiple types.
 *
 * @example
 * ```ts
 *
 * export type Callout = {
 *   _type: 'callout'
 *   title?: string
 *   content?: string
 * }
 *
 * export type Video = {
 *   _type: 'video'
 *   url?: string
 *   caption?: string
 * }
 * type FORM_QUERY_RESULT = {
 *   _id: string
 *   title?: string
 *   content?: Array<
 *     | ({ _key: string } & Callout)
 *     | ({ _key: string } & Video)
 *   >
 * } | null
 *
 * // Get the type of the content with the Get helper
 * type Content = Get<FORM_QUERY_RESULT, 'content', number>
 *
 * // Get the type for a callout module from the page builder type
 * type CalloutModule = FilterByType<Content, 'callout'>
 * // → { _key: string } & Callout
 * ```
 */
export type FilterByType<U extends {_type: string}, T extends U['_type']> = Extract<U, {_type: T}>
