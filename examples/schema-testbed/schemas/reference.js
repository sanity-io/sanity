export default {
  name: 'reference',
  types: [
    {
      name: 'blogpost',
      type: 'object',
      fields: [
        {
          name: 'petReferenceArray',
          type: 'array',
          title: 'Array of reference to pets in a list',
          description: 'This array are defined in the field.',
          of: [
            {
              title: 'Pet',
              type: 'reference',
              description: 'Pet you pet',
              to: {
                type: 'pet'
              }
            }
          ]
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          required: true
        },
        {
          name: 'pet',
          title: 'Browse for pet',
          description: 'Just the default',
          type: 'reference',
          to: [
            {
              type: 'pet',
              title: 'Pet'
            },
            {
              type: 'wildAnimal',
              title: 'Wild Animal'
            }
          ]
        },
        {
          name: 'pet4',
          title: 'Browse for pet with search',
          type: 'reference',
          description: 'inputType is browser, and searchable is true',
          options: {
            inputType: 'browse',
            searchable: true,
          },
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
          description: 'inputType is select, and searchable is false',
          options: {
            inputType: 'select',
            searchable: false,
          },
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
          description: 'inputType is select, and searchable is true',
          type: 'reference',
          options: {
            inputType: 'select',
            searchable: true,
          },
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
    },
    {
      name: 'wildAnimal',
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
