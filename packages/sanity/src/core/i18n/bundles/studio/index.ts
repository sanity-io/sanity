import {studioLocaleNamespace} from '../../localeNamespaces'
import {type LocaleResourceBundle} from '../../types'

/**
 * Locale resources for the core studio namespace, eg US English locale resources.
 *
 * The strings are loaded on demand, like the structure, presentation and releases bundles: the
 * i18n backend requests them when the namespace is first needed (`prepareI18n` starts that
 * request), so the ~160 kB of source text (17 kB gzip in the CDN build) stays out of the static
 * import graph of the `sanity` entry that every studio downloads before anything renders. The
 * login screen does use this namespace (`WorkspaceAuth`, `LoggedOutToast`, the login component),
 * so it renders once the bundle has arrived: `useTranslation` suspends until then, behind the
 * `Suspense` boundary in `StudioProvider`, which shows the loading block in the meantime.
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
