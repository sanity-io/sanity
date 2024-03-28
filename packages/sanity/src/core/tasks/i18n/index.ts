import {type LocaleResourceBundle} from '../../i18n'

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

/**
 * The locale resource keys for the task tool.
 *
 * @alpha
 * @hidden
 */
export type {TasksLocaleResourceKeys} from './resources'
