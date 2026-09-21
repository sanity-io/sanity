import {studioLocaleNamespace} from '../../localeNamespaces'
import {type LocaleResourceBundle} from '../../types'

/**
 * Locale resources for the core studio namespace, eg US English locale resources.
 *
 * The strings are loaded on demand, like the structure, presentation and releases bundles: the
 * i18n backend requests them when the namespace is first needed, so the ~160 kB of source text
 * stays out of the static import graph of the `sanity` entry that every studio downloads before
 * the login screen can render (the login screen itself does not use them).
 *
 * @beta
 * @hidden
 */
export const studioDefaultLocaleResources: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: studioLocaleNamespace,
  resources: () => import('./resources'),
}

export {type StudioLocaleResourceKeys} from './resources'
