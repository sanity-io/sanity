export default {
  name: 'customPatchHandling',
  types: [
    {
      name: 'exampledoc',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string'
        },
        {
          name: 'customPatchHandling',
          title: 'Toplevel',
          type: 'customPatchHandlingExampleType'
        },
        {
          name: 'customPatchHandlingInArray',
          type: 'array',
          of: [{type: 'customPatchHandlingExampleType'}]
        },
        {
          name: 'complex',
          type: 'object',
          fields: [
            {
              name: 'simpleString',
              title: 'Just a string',
              type: 'string'
            },
            {
              name: 'customPatchHandlingAsObjectField',
              title: 'Input with custom patch handling',
              type: 'customPatchHandlingExampleType'
            }
          ]
        }
      ]
    },
    {
      name: 'customPatchHandlingExampleType',
      type: 'object',
      fields: [
        {
          name: 'first',
          type: 'string',
          title: 'First'
        },
        {
          name: 'second',
          type: 'string',
          title: 'Second'
        }
      ]
    }
  ]
}
