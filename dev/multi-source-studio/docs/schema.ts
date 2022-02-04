export const schemaTypes = [
  {
    type: 'document',
    name: 'article',
    title: 'Article',
    fields: [
      {
        type: 'string',
        name: 'title',
        title: 'Title',
      },

      // {
      //   type: 'array',
      //   name: 'seeAlso',
      //   title: 'See also',
      //   of: [
      //     {
      //       type: 'reference',
      //       name: 'blogPost',
      //       title: 'Title',
      //       to: [
      //         {
      //           type: 'post',
      //           source: 'blog', // <----
      //         },
      //       ],
      //     },
      //   ],
      // },
    ],
  },
]
