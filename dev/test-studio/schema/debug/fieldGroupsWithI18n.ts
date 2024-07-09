import {defineType} from 'sanity'

import {testStudioLocaleNamespace} from '../../locales'

export default defineType({
  name: 'fieldGroupsWithI18n',
  title: 'With i18n',
  type: 'document',
  groups: [
    {
      name: 'group1',
      title: 'I18N-MISSING (1)',
      i18n: {title: {key: 'field-groups.group-1', ns: testStudioLocaleNamespace}},
      icon: () => '🌎',
    },
    {
      name: 'group2',
      title: 'I18N-MISSING (2)',
      i18n: {title: {key: 'field-groups.group-2', ns: testStudioLocaleNamespace}},
      icon: () => '🌍',
    },
  ],
  fields: [
    {name: 'field1', type: 'string', group: 'group1'},
    {name: 'field2', type: 'string', group: 'group2'},
    {name: 'field3', type: 'string', group: 'group1'},
    {name: 'field4', type: 'string', group: ['group1', 'group2']},
  ],
})
