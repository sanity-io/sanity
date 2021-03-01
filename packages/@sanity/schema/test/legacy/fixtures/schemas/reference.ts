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
                type: 'pet',
              },
            },
          ],
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          required: true,
        },
        {
          name: 'pet',
          title: 'Default reference picker',
          description: 'Just the default',
          type: 'reference',
          to: [
            {
              type: 'pet',
              title: 'Pet',
            },
          ],
        },
        {
          name: 'petTwoTypes',
          title: 'Default reference picker (two types)',
          description: 'Just the default',
          type: 'reference',
          to: [
            {
              type: 'pet',
              title: 'Pet',
            },
            {
              type: 'wildAnimal',
              title: 'Wild Animal',
            },
          ],
        },
        {
          name: 'pet2',
          title: 'Reference browser',
          type: 'reference',
          description: 'inputType is browse',
          options: {
            inputType: 'browser',
            searchable: false,
          },
          to: [
            {
              type: 'pet',
              title: 'Pet',
            },
          ],
        },
        {
          name: 'pet4',
          title: 'Reference browser (with search)',
          type: 'reference',
          description: 'inputType is browser, and searchable is true',
          options: {
            inputType: 'browser',
            searchable: true,
          },
          to: [
            {
              type: 'pet',
              title: 'Pet',
            },
          ],
        },
        {
          name: 'pet3',
          title: 'Normal select (os UI)',
          description: 'inputType is select, and searchable is false',
          type: 'reference',
          options: {
            inputType: 'select',
            searchable: false,
          },
          to: [
            {
              type: 'pet',
              title: 'Pet',
            },
          ],
        },
        {
          name: 'pet5',
          title: 'Searchable select',
          description: 'inputType is select, and searchable is true',
          type: 'reference',
          options: {
            inputType: 'select',
            searchable: true,
          },
          to: [
            {
              type: 'pet',
              title: 'Pet',
            },
          ],
        },
      ],
    },
    {
      name: 'pet',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
        },
      ],
    },
    {
      name: 'wildAnimal',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
        },
      ],
    },
  ],
}
