import {type LocaleResourceBundle} from '../../i18n/types'

/**
 * The locale namespace for the task tool
 *
 * @public
 */
export const tasksLocaleNamespace = 'tasks' as const

/**
 * The default locale bundle for the task tool, which is US English.
 *
 * @internal
 */
export const tasksUsEnglishLocaleBundle: LocaleResourceBundle = {
  locale: 'en-US',
  namespace: tasksLocaleNamespace,
  resources: () => import('./resources'),
}
