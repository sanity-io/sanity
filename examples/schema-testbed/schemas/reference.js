export default {
  name: 'reference',
  types: [
    {
      name: 'blogpost',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          required: true
        },
        {
          name: 'pet',
          title: 'Browse for pet',
          type: 'reference',
          to: [
            {
              type: 'pet',
              title: 'Pet'
            }
          ]
        },
        {
          name: 'pet2',
          title: 'Select pet',
          type: 'reference',
          to: [
            {
              type: 'pet',
              title: 'Pet'
            }
          ]
        },
        {
          name: 'pet3',
          title: 'Type to find pet',
          type: 'reference',
          to: [
            {
              type: 'pet',
              title: 'Pet'
            }
          ]
        }
      ]
    },
    {
      name: 'pet',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string'
        }
      ]
    }
  ]
}
