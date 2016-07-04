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
          title: 'Pet',
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
