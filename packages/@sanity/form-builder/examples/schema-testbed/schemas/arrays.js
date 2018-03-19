export default {
  name: 'arrays',
  types: [
    {
      name: 'tags',
      type: 'array',
      of: [
        {
          type: 'string'
        }
      ]
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
          type: 'string'
        },
        {
          name: 'model',
          title: 'Car model',
          type: 'string'
        },
        {
          name: 'features',
          title: 'Features',
          type: 'tags'
        },
        {
          name: 'cars',
          type: 'array',
          title: 'Cars with defaults',
          of: [
            {
              title: 'Car',
              type: 'car'
            }
          ]
        },
        {
          name: 'carsNotSortable',
          type: 'array',
          title: 'Cars with default layout, not sortable',
          options: {
            sortable: false
          },
          of: [
            {
              title: 'Car',
              type: 'car'
            }
          ]
        },
        {
          name: 'carsInGrid',
          type: 'array',
          title: 'Cars in grid',
          description: 'Cars in grid',
          options: {
            layout: 'grid'
          },
          of: [
            {
              title: 'Related car',
              type: 'car'
            }
          ]
        },
        {
          name: 'carsInGridNotSortable',
          type: 'array',
          title: 'Cars in grid not sortable',
          description: 'Cars in grid not sortable',
          options: {
            layout: 'grid',
            sortable: false
          },
          of: [
            {
              title: 'Related car',
              type: 'car'
            }
          ]
        }
      ]
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
          description: 'This array are defined in types.'
        },
        {
          name: 'customTags',
          type: 'array',
          title: 'Custom tags',
          description: 'This array are defined in the field.',
          of: [
            {
              type: 'string'
            }
          ]
        },
        {
          name: 'car',
          type: 'array',
          title: 'Array of cars in a list',
          description: 'This array are defined in the field.',
          of: [
            {
              title: 'Car in a list',
              type: 'car'
            }
          ]
        },
        {
          name: 'mixed',
          type: 'array',
          title: 'Mixed array',
          description: 'This array are defined in the field.',
          of: [
            {
              type: 'string',
              title: 'String'
            },
            {
              type: 'car',
              title: 'Car'
            }
          ]
        },
        {
          name: 'carGrid',
          type: 'array',
          title: 'Array of cars in a grid',
          description: 'This array are defined in the field.',
          options: {
            view: 'grid'
          },
          of: [
            {
              title: 'Car',
              type: 'car'
            }
          ]
        },
        {
          name: 'carsSortable',
          type: 'array',
          title: 'Array of cars in a list, sortable',
          description: 'This array are defined in the field.',
          options: {
            sortable: true
          },
          of: [
            {
              title: 'Car',
              type: 'car'
            }
          ]
        }
      ]
    }
  ]
}
