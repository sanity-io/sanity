export default {
  type: 'document',
  name: 'radio',
  title: 'Radio',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },

    {
      type: 'string',
      name: 'stringObjects',
      title: 'String (objects)',
      options: {
        layout: 'radio',
        list: [
          {
            value: 'foo',
            title: 'Foo',
          },
          {
            value: 'bar',
            title: 'Bar',
          },
          {
            value: 'baz',
            title: 'Baz',
          },
        ],
      },
    },

    {
      type: 'number',
      name: 'numberObjects',
      title: 'Number (objects)',
      options: {
        layout: 'radio',
        list: [
          {
            value: 0,
            title: 'Foo (0)',
          },
          {
            value: 1,
            title: 'Bar (1)',
          },
          {
            value: 2,
            title: 'Baz (2)',
          },
        ],
      },
    },
  ],
}
