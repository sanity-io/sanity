import {type DocumentActionComponent} from 'sanity'

export const TestVersionAction: DocumentActionComponent = () => {
  return {
    label: 'Version only action',
    title:
      'This action shows only on versions and it should be the first one on books and the last one on authors',
  }
}
