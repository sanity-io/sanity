import type {
  ImplicitLocaleResourceBundle,
  LocaleDefinition,
  LocaleResourceBundle,
  StaticLocaleResourceBundle,
} from './types'

/**
 * Defines a resource bundle for a given locale and namespace.
 *
 * @param bundle - The bundle of resources to define
 * @returns The bundle that was passed, as-is (this is an "identity function")
 * @beta
 * @hidden
 */
export function defineLocaleResourceBundle(bundle: LocaleResourceBundle): LocaleResourceBundle {
  return bundle
}

/**
 * Defines a locale and makes it available for use in the studio.
 *
 * @param locale - The locale to define
 * @returns The locale that was passed, as-is (this is an "identity function")
 * @beta
 * @hidden
 */
export function defineLocale(locale: LocaleDefinition): LocaleDefinition {
  return locale
}

/**
 * Checks whether or not the given resource bundle has static resources, eg is not lazy loaded.
 *
 * @param bundle - Bundle to check
 * @returns `true` if the bundle has static resources, `false` otherwise
 * @internal
 */
export function isStaticResourceBundle(
  bundle: LocaleResourceBundle | StaticLocaleResourceBundle | ImplicitLocaleResourceBundle,
): bundle is StaticLocaleResourceBundle {
  return !('then' in bundle.resources && typeof bundle.resources.then === 'function')
}
