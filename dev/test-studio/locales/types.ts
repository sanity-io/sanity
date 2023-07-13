// eslint-disable-next-line import/no-unassigned-import
import 'sanity'
import {testStudioI18nNamespace, I18nTestStudioResourceKeys} from './index'

declare module 'sanity' {
  interface SanityLanguageResources {
    [testStudioI18nNamespace]: I18nTestStudioResourceKeys
  }
}
