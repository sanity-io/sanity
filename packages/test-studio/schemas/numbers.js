import icon from 'react-icons/lib/ti/sort-numerically'

export default {
  name: 'numbersTest',
  type: 'document',
  title: 'Numbers test',
  icon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'myNumberField',
      type: 'number',
      title: 'Plain number',
      description: 'A plain number field'
    },
    {
      name: 'myCustomNumberField',
      type: 'customNumber',
      title: 'Number between 0 and 1000',
      description: 'A subclassed number, with validation!'
    },
    {
      name: 'readonlyField',
      type: 'number',
      title: 'A read only number',
      description: 'It may have a value, but it cannot be edited',
      readOnly: true
    }
  ]
}
