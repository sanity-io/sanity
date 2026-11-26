import {studioLocaleNamespace} from '../../localeNamespaces'
import {type LocaleResourceBundle} from '../../types'

/**
 * Locale resources for the core studio namespace, eg US English locale resources.
 *
 * The strings are loaded on demand, like the structure, presentation and releases bundles: the
 * i18n backend requests them when the namespace is first needed (the fallback i18n instance starts
 * that request when it is created), so the ~160 kB of source text (17 kB gzip in the CDN build)
 * stays out of the static import graph of the `sanity` entry that every studio downloads before
 * anything renders. The screens shown before a workspace has resolved (the login screen, the
 * workspace errors) use this namespace, so they render once the bundle has arrived:
 * `useTranslation` suspends until then, behind the `Suspense` boundary in
 * `FallbackLocaleProvider`, which shows a loading block in the meantime.
 *
 * @beta
 * @hidden
 */
export const studioDefaultLocaleResources: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: studioLocaleNamespace,
  resources: () => import('./resources').then((module) => module.studioLocaleStrings),
}

export {type StudioLocaleResourceKeys} from './resources'
