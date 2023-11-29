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

/**
 * Internal helper for definining resources for a given namespace.
 *
 * Used for automation (finding the officially defined namespaces and keys), and potentially in
 * the future for type safety/helpers.
 *
 * @param resources - Resources to define
 * @returns The resources that was passed, as-is (this is an "identity function")
 * @deprecated Sanity-internal helper, don't use in external code
 * @internal
 * @hidden
 */
export function defineLocalesResources<R extends Record<string, string>>(
  namespace: string,
  resources: R,
): R {
  return resources
}

/**
 * Removes any values that are undefined from the given object.
 *
 * This is used to remove any placeholders from the generated files, while being able to leave them
 * in place to ease spotting the missing translations.
 *
 * @param resources - The resources to remove undefined values from
 * @returns The resources without any undefined values
 * @public
 * @hidden
 */
export function removeUndefinedLocaleResources<T extends {[key: string]: string | undefined}>(
  resources: T,
): {[K in keyof T]: Exclude<T[K], undefined>} {
  const result: Partial<T> = {}

  for (const key in resources) {
    if (typeof resources[key] !== 'undefined') {
      result[key] = resources[key]
    }
  }

  return result as {[K in keyof T]: Exclude<T[K], undefined>}
}
