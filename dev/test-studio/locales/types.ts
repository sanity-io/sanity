// eslint-disable-next-line import/no-unassigned-import
import 'sanity'
import {testStudioLocaleNamespace, TestStudioLocaleResourceKeys} from './index'

declare module 'sanity' {
  interface SanityLanguageResources {
    [testStudioLocaleNamespace]: TestStudioLocaleResourceKeys
  }
}
