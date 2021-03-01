export default {
  type: 'document',
  name: 'selectInputs',
  title: 'Select inputs',
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
