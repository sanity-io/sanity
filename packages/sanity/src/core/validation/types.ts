import type {LocaleSource} from '../i18n'

declare module '@sanity/types' {
  /**
   * Extended validation context that includes internationalization
   *
   * Why is this not directly part of `@sanity/types`, you ask?
   * Because `@sanity/types` shouldn't need to depend on the `i18next` package, which it needs
   * for the `TFunction` type. The `ValidationContext` should never have been part of the types
   * module in the first place, but is now unfortunately part of the public API and thus cannot
   * be changed easily.
   *
   * This is a temporary solution until we can remove the `ValidationContext` from the types module,
   * which is likely to happen at the next major version.
   *
   * @public
   */
  interface ValidationContext {
    i18n: LocaleSource
  }
}

export type {ValidationContext} from '@sanity/types'
