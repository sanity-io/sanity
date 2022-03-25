// Example type that has no obvious candidate fields for sort or preview
export default {
  name: 'noTitleField',
  type: 'document',
  title: 'No title field',
  fields: [
    {
      name: 'isChecked',
      type: 'boolean',
      title: 'Is checked?',
    },
    {
      name: 'somethings',
      title: 'Some things',
      type: 'array',
      of: [{type: 'string'}],
    },
    {
      name: 'something',
      type: 'document',
      title: 'Some thing',
      fields: [
        {name: 'first', type: 'string'},
        {name: 'second', type: 'string'},
      ],
    },
    {
      name: 'arrayOfBooks',
      type: 'array',
      title: 'Array of books',
      of: [{type: 'book', title: 'Book'}],
    },
    {
      name: 'arrayOfMyself',
      type: 'array',
      title: 'Array of my own type',
      of: [{type: 'noTitleField', title: 'My own type'}],
    },
  ],
}
