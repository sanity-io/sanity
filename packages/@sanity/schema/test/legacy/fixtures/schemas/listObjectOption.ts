export default {
  name: 'listObjectOption',
  types: [
    {
      name: 'stringWithListOption',
      type: 'string',
    },
    {
      name: 'post',
      type: 'document',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
        },
        {
          name: 'align',
          title: 'Alignment',
          type: 'stringWithListOption',
          options: {
            list: {
              options: ['left', 'right', 'center'],
            },
          },
        },
      ],
    },
  ],
}
