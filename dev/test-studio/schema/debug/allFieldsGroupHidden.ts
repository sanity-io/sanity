import {ALL_FIELDS_GROUP, defineField, defineType} from 'sanity'

export const allFieldsGroupHidden = defineType({
  name: 'allFieldsGroupHidden',
  type: 'document',
  title: 'All fields group hidden',

  groups: [
    {
      name: 'details',
      title: 'Details',
      hidden: false,
    },
    {
      name: 'config',
      title: 'Config',
    },
    {
      ...ALL_FIELDS_GROUP,
      hidden: true,
    },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'details',
    }),
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'details',
    },
    {
      name: 'locked',
      title: 'Locked',
      description: 'Used for testing the "locked" permissions pattern',
      type: 'boolean',
      group: 'config',
    },
  ],
})
