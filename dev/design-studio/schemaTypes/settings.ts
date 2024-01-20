import {type Rule} from 'sanity'

export default {
  type: 'document',
  name: 'settings',
  title: 'Settings',
  liveEdit: true,
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
      validation: (rule: Rule) => rule.required().min(10).max(80),
    },
  ],
}
