import {defineType} from 'sanity'

export const objectsDebug = defineType({
  type: 'document',
  name: 'objectsDebug',
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      type: 'array',
      name: 'array1',
      title: 'Animals',
      options: {
        modal: {
          // type: 'popover',
        },
      },
      of: [
        {
          type: 'object',
          name: 'object1',
          title: 'Animal',
          fields: [
            {
              name: 'name',
              type: 'string',
              title: 'Animal name',
            },
            {
              type: 'array',
              name: 'array2',
              options: {
                modal: {
                  // type: 'popover',
                },
              },
              of: [
                {
                  type: 'object',
                  name: 'object2',
                  fields: [
                    {
                      type: 'object',
                      name: 'object3',
                      fields: [
                        {
                          type: 'array',
                          name: 'array3',
                          options: {
                            modal: {
                              // type: 'popover',
                            },
                          },
                          of: [
                            {
                              type: 'object',
                              name: 'object3',
                              fields: [
                                {
                                  name: 'string',
                                  type: 'string',
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
})
