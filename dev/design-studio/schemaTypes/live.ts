import {type Rule} from 'sanity'

export default {
  type: 'document',
  name: 'live',
  title: 'Live Document',
  liveEdit: true,
  fields: [
    {
      type: 'string',
      name: 'name',
      title: 'Name',
      validation: (rule: Rule) => rule.required().min(10).max(80),
    },
  ],
}
