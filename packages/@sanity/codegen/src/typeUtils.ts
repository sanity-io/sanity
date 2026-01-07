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
 * Supports up to 10 levels of nesting.
 *
 * @example
 * Basic property access:
 * ```ts
 * type Post = { _id: string; title: string };
 *
 * type Id = Get<Post, '_id'>;
 * // → string
 * ```
 *
 * @example
 * Nested property access:
 * ```ts
 * type Post = {
 *   author: {
 *     profile: {
 *       name: string;
 *     } | null;
 *   } | null;
 * };
 *
 * type AuthorName = Get<Post, 'author', 'profile'>;
 * // → { name: string } | null
 * ```
 *
 * @example
 * Array element access using `number`:
 * ```ts
 * type Post = { tags: Array<{ label: string }> | null };
 *
 * type TagLabel = Get<Post, 'tags', number, 'label'>;
 * // → string
 * ```
 *
 * @example
 * Tuple element access using numeric literal:
 * ```ts
 * type Data = { tuple: [string, number, { nested: boolean }] };
 *
 * type Third = Get<Data, 'tuple', 2>;
 * // → { nested: boolean }
 *
 * type NestedFlag = Get<Data, 'tuple', 2, 'nested'>;
 * // → boolean
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
> = GetAtPath<T, TakeUntilNever<[K1, K2, K3, K4, K5, K6, K7, K8, K9, K10]>>

/**
 * Filter a union type by its `_type` discriminator.
 * Useful for narrowing union types from array members to a specific type.
 *
 * @example
 * ```ts
 * type Tag = { _type: 'tag'; label: string };
 * type Category = { _type: 'category'; name: string };
 * type Items = Array<Tag | Category>;
 *
 * type JustTags = Filter<Items[number], 'tag'>;
 * // → { _type: 'tag'; label: string }
 * ```
 */
export type Filter<U extends {_type: string}, T extends U['_type']> = Extract<U, {_type: T}>
