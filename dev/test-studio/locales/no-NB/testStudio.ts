import {type LanguageBundle, typed} from 'sanity'
import {TestStudioTranslations} from '../types'

export const testStudioNamespace: Partial<TestStudioTranslations> = {
  brandingTitle: 'Norwegian logo',
  structureRootTitle: 'Innhold',
  translatedFieldTitle: 'Norsk tittel',
}

export default typed<LanguageBundle>({
  namespace: 'testStudio',
  resources: testStudioNamespace,
})
