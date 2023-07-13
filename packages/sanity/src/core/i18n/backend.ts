import {isPlainObject} from 'lodash'
import type {BackendModule, ReadCallback} from 'i18next'
import type {I18nResourceKey, I18nResourceRecord, LanguageResourceBundle} from './types'

/**
 * Options for the Sanity i18next backend
 *
 * @internal
 */
export interface SanityI18nBackendOptions {
  bundles: LanguageResourceBundle[]
}

/**
 * Creates a "backend" for i18next that loads language resources defined in configuration/plugins.
 *
 * This allows us to dynamically load only the resources used. For instance, if the user requests
 * the `vision` namespace and is using the `fr` language, we skip loading all the other languages.
 *
 * Note that this only works if the language bundles are defined with an async function for the
 * `resources` key, usually by using a dynamic import (`import('some/path/en.js')`. Otherwise,
 * the resources will be loaded at once.
 *
 * @param options - Options for the backend
 * @returns A backend module for i18next
 * @internal
 */
export function createSanityI18nBackend(options: SanityI18nBackendOptions): BackendModule {
  const {bundles} = options
  function init() {
    // intentional noop - i18next requires a init function, but we don't need it
  }

  function read(language: string, namespace: string, callback: ReadCallback) {
    // @todo figure out if this makes sense to keep/prevent, seems like maybe the i18next default?
    if (namespace === 'translation') {
      callback(null, undefined)
      return
    }

    const loadable = bundles.filter(
      (bundle) => bundle.language === language && bundle.namespace === namespace
    )

    if (loadable.length === 0) {
      // @todo warn? This means someone requested a namespace/language combination that there are no resources for
      callback(null, undefined)
      return
    }

    loadBundles(loadable)
      .then((resources) => callback(null, resources))
      .catch((err) => callback(err, undefined))
  }

  return {
    type: 'backend',
    init,
    read,
  }
}

/**
 * Load the given language bundles, and return a promise for a merged resource object.
 *
 * @param bundles - Array of bundles to load resources for
 * @returns An object of language resources
 * @remarks
 * - The bundles passed **MUST** be for the same namespace and language!
 * - The algorithm differs from i18next:
 *   - in i18next, if `deep` is `false`, `overwrite` is _always_ `true`
 *   - in Sanity,  `overwrite` is always respected
 * @internal
 */
async function loadBundles(bundles: LanguageResourceBundle[]): Promise<I18nResourceRecord> {
  // Resolve resources in parallell to avoid waiting for each bundle as we extend
  // Note: we may want a queue for this if people do very dynamic loading strategies
  const resolved = await Promise.all(
    bundles.map(async (bundle) => ({
      ...bundle,
      resources: await loadBundleResources(bundle),
    }))
  )

  const base: I18nResourceRecord = {}
  for (const item of resolved) {
    const deep = item.deep ?? true
    const overwrite = item.overwrite ?? true

    if (deep) {
      deepExtend(base, item.resources, overwrite)
    } else if (overwrite) {
      Object.assign(base, item.resources)
    } else {
      Object.assign({}, item.resources, base)
    }
  }

  return base
}

/**
 * Loads the resources of a bundle, calling any function and unwrapping any default module exports.
 *
 * @param bundle - Bundle to load resources for
 * @returns Record of resources
 */
async function loadBundleResources(bundle: LanguageResourceBundle): Promise<I18nResourceRecord> {
  if (typeof bundle.resources !== 'function') {
    return bundle.resources
  }

  const resources = await bundle.resources()
  return maybeUnwrapModule(resources)
}

/**
 * Deeply extend an object of resources, taking into account flat string shapes and nested objects.
 *
 * Typescripted version of i18next's internal utility for the same operation, see
 * {@link https://github.com/i18next/i18next/blob/v23.2.11/src/utils.js#L89}
 *
 * We need this because we're letting the backend do the merging instead of using `addResourceBundle`.
 *
 * @param target - Target object to extend
 * @param source - Source object to merge into target
 * @param overwrite - Whether to overwrite existing strings/objects
 * @returns A merged object
 * @internal
 */
function deepExtend(
  target: I18nResourceRecord,
  source: I18nResourceRecord,
  overwrite = false
): I18nResourceRecord {
  for (const prop in source) {
    if (prop === '__proto__' || prop === 'constructor') {
      continue
    }

    // Assign missing properties directly
    if (!(prop in target)) {
      target[prop] = source[prop]
      continue
    }

    const targetLeaf = target[prop]
    const sourceLeaf = source[prop]

    const targetIsString = isStringLeaf(targetLeaf)
    const sourceIsString = isStringLeaf(sourceLeaf)

    // We reached a leaf string in target OR source
    if ((targetIsString || sourceIsString) && overwrite) {
      target[prop] = source[prop]
      continue
    }

    if (targetIsString || sourceIsString) {
      // Skip, since we are not overwriting
      continue
    }

    // If we're overwriting with an array, don't try to merge objects/arrays, just overwrite
    const sourceIsArray = Array.isArray(sourceLeaf)
    const targetIsArray = Array.isArray(targetLeaf)
    if (sourceIsArray || targetIsArray) {
      // Nothing to do here if we can't overwrite
      if (overwrite) {
        target[prop] = sourceLeaf
      }
      continue
    }

    // Recurse deeper since we haven't reached a leaf
    deepExtend(targetLeaf, sourceLeaf, overwrite)
  }

  return target
}

/**
 * Returns whether or not the target is leaf, eg a string
 *
 * @param target - The target to check
 * @returns True if string/instance of string, false otherwise
 * @internal
 */
function isStringLeaf(target: I18nResourceKey): target is string {
  return typeof target === 'string' || target instanceof String
}

/**
 * Unwraps an imported module if it only contains a default export
 *
 * @param maybeModule - Module to unwrap
 * @returns Unwrapped resource record
 * @internal
 */
function maybeUnwrapModule(
  maybeModule: I18nResourceRecord | {default: I18nResourceRecord}
): I18nResourceRecord {
  return isWrappedModule(maybeModule) ? maybeModule.default : maybeModule
}

/**
 * Checks whether or not the passed item is wrapped
 *
 * @param mod - Item to check whether or not is wrapped
 * @returns True if wrapped, false otherwise
 * @internal
 */
function isWrappedModule(
  mod: I18nResourceRecord | {default: I18nResourceRecord}
): mod is {default: I18nResourceRecord} {
  return 'default' in mod && typeof mod.default === 'object' && isPlainObject(mod.default)
}
