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
      validation: (Rule) => Rule.required().min(10).max(80),
    },
  ],
}
