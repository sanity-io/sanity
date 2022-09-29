export const simpleReferences = {
  name: 'simpleReferences',
  type: 'document',
  title: 'Simple references test',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'referenceField',
      title: 'Reference field',
      description: 'A simple reference field',
      type: 'reference',
      to: [{type: 'author'}],
    },
    {
      name: 'arrayWithObjects',
      options: {collapsible: true, collapsed: true},
      title: 'Array with named objects',
      description: 'This array contains objects of type as defined inline',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'something',
          title: 'Something',
          // options: {modal: 'inline'},
          fields: [
            {name: 'first', type: 'string', title: 'First string'},
            {name: 'second', type: 'string', title: 'Second string'},
          ],
        },
        {
          type: 'object',
          name: 'otherThing',
          title: 'OtherThing',
          options: {modal: 'inline'},
          fields: [{name: 'value', type: 'string', title: 'First string'}],
        },
        {
          type: 'reference',
          title: 'A reference to an author or a book',
          to: [{type: 'author'}, {type: 'book'}],
        },
      ],
    },
  ],
}
