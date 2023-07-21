import type {ValidationContext as BaseValidationContext} from '@sanity/types'
import type {LocaleSource} from '../i18n'

/**
 * Extended validation context that includes internationalization
 *
 * Why is this not part of `@sanity/types.ValidationContext`, you ask?
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
export interface ValidationContext extends BaseValidationContext {
  i18n: LocaleSource
}
