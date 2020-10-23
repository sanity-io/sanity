export default {
  name: 'arrays',
  types: [
    {
      name: 'tags',
      type: 'array',
      of: [
        {
          type: 'string',
        },
      ],
    },
    {
      name: 'car',
      type: 'object',
      title: 'Car',
      options: {},
      fields: [
        {
          name: 'brand',
          title: 'Car brand',
          type: 'string',
        },
        {
          name: 'model',
          title: 'Car model',
          type: 'string',
        },
        {
          name: 'features',
          title: 'Features',
          type: 'tags',
        },
        {
          name: 'relatedCars',
          type: 'array',
          title: 'Array of related cars',
          description: 'This array are defined in the field.',
          of: [
            {
              title: 'Related car',
              type: 'car',
            },
          ],
        },
      ],
    },
    {
      name: 'cars',
      type: 'object',
      title: 'List of cars',
      fields: [
        {
          name: 'tags',
          type: 'tags',
          title: 'Array of string (defined type)',
          description: 'This array are defined in types.',
        },
        {
          name: 'customTags',
          type: 'array',
          title: 'Custom tags',
          description: 'This array are defined in the field.',
          of: [
            {
              type: 'string',
            },
          ],
        },
        {
          name: 'car',
          type: 'array',
          title: 'Array of cars in a list',
          description: 'This array are defined in the field.',
          of: [
            {
              title: 'Car in a list',
              type: 'car',
            },
          ],
        },
        {
          name: 'mixed',
          type: 'array',
          title: 'Mixed array',
          description: 'This array are defined in the field.',
          of: [
            {
              type: 'string',
              title: 'String',
            },
            {
              type: 'car',
              title: 'Car',
            },
          ],
        },
        {
          name: 'carGrid',
          type: 'array',
          title: 'Array of cars in a grid',
          description: 'This array are defined in the field.',
          options: {
            view: 'grid',
          },
          of: [
            {
              title: 'Car',
              type: 'car',
            },
          ],
        },
        {
          name: 'carsSortable',
          type: 'array',
          title: 'Array of cars in a list, sortable',
          description: 'This array are defined in the field.',
          options: {
            sortable: true,
          },
          of: [
            {
              title: 'Car',
              type: 'car',
            },
          ],
        },
      ],
    },
  ],
}
