import {type LanguageBundle, typed} from 'sanity'

export const testStudioNamespace = {
  brandingTitle: 'English logo',
  structureRootTitle: 'Content',
  translatedFieldTitle: 'English custom component title',
}

export default typed<LanguageBundle>({
  namespace: 'testStudio',
  resources: testStudioNamespace,
})
