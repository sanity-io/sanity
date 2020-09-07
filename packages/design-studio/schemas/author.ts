import icon from 'part:@sanity/base/user-icon'

export default {
  type: 'document',
  name: 'author',
  title: 'Author',
  icon,
  fields: [
    {
      type: 'string',
      name: 'name',
      title: 'Name',
      validation: Rule =>
        Rule.required()
          .min(10)
          .max(80)
    },
    {
      type: 'string',
      name: 'role',
      title: 'Role',
      options: {
        layout: 'radio',
        list: ['developer', 'designer', 'manager'],
        direction: 'horizontal' // | 'vertical'
      }
    },
    {
      type: 'image',
      name: 'avatar',
      title: 'Avatar',
      options: {
        hotspot: true
      }
    },
    {
      type: 'array',
      name: 'bio',
      title: 'Bio',
      of: [{type: 'block'}]
    },
    {
      type: 'string',
      name: 'phoneNumber',
      title: 'Phone #'
    }
  ]
}
