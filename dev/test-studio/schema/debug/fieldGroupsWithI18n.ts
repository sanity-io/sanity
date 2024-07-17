import {defineType} from 'sanity'

import {testStudioLocaleNamespace} from '../../locales'

export default defineType({
  name: 'fieldGroupsWithI18n',
  title: 'With i18n',
  type: 'document',
  groups: [
    {
      name: 'i18n-group1',
      title: 'I18N-MISSING (1)',
      i18n: {title: {key: 'field-groups.group-1', ns: testStudioLocaleNamespace}},
    },
    {
      name: 'i18n-group2',
      title: 'I18N-MISSING (2)',
      i18n: {title: {key: 'intentionally-missing-key', ns: testStudioLocaleNamespace}},
    },
    {
      name: 'non-i18n-group3',
      title: '🌐 Non-i18n group',
    },
  ],
  fields: [
    {name: 'field1', type: 'string', group: 'i18n-group1'},
    {name: 'field2', type: 'string', group: 'i18n-group2'},
    {name: 'field3', type: 'string', group: 'i18n-group1'},
    {name: 'field4', type: 'string', group: ['i18n-group1', 'i18n-group2']},
    {name: 'field5', type: 'string', group: 'non-i18n-group3'},
  ],
})
